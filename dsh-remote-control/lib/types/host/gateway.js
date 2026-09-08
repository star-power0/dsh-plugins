/**
 * dsh-remote-control — 手机网关（自起 node:http 服务器）。
 *
 * 不复用宿主 webServer（它绑定 127.0.0.1，手机够不着）：本网关按配置绑定
 * （默认 0.0.0.0），自管认证。路由：
 *   GET  /                    配对页 / 已连接页
 *   GET  /remote/health       存活探测
 *   POST /remote/pair         配对码换设备令牌（HttpOnly Cookie）
 *   POST /remote/api/<method> 官方 RPC 白名单转发（进程内桥）
 *
 * 防线：全局限流、Host 头校验（DNS rebinding）、令牌 Cookie、方法白名单。
 */
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { networkInterfaces } from 'node:os';
import { REMOTE_METHOD_ALLOWLIST } from "./proxy.js";
import { renderConnectedPage, renderPairPage } from "./page.js";
const TOKEN_COOKIE = 'dshrc_token';
/** 请求体上限（12 MiB：图片消息走 base64 内联，4 张压缩图约 2-3 MiB，留足余量）。 */
const MAX_BODY_BYTES = 12 * 1024 * 1024;
/** 限流：每 IP 每分钟 60 次。 */
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 60;
/** 收集本机可达主机名（Host 校验 + 局域网地址展示共用）。 */
export function collectLocalHostnames() {
    const names = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);
    for (const list of Object.values(networkInterfaces())) {
        for (const entry of list ?? []) {
            if (entry.internal)
                continue;
            if (entry.family === 'IPv4')
                names.add(entry.address);
            else
                names.add(`[${entry.address}]`);
        }
    }
    return [...names];
}
/** 解析 Cookie 头为键值对。 */
function parseCookies(header) {
    const out = {};
    if (header === undefined)
        return out;
    for (const part of header.split(';')) {
        const at = part.indexOf('=');
        if (at === -1)
            continue;
        out[part.slice(0, at).trim()] = decodeURIComponent(part.slice(at + 1).trim());
    }
    return out;
}
function readJsonBody(req) {
    return new Promise((resolve) => {
        const chunks = [];
        let total = 0;
        req.on('data', (chunk) => {
            total += chunk.length;
            if (total > MAX_BODY_BYTES) {
                req.destroy();
                resolve(null);
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8');
            if (text === '') {
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(text));
            }
            catch {
                resolve(null);
            }
        });
        req.on('error', () => resolve(null));
    });
}
function json(res, status, body) {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    res.end(JSON.stringify(body));
}
class RateLimiter {
    buckets = new Map();
    allow(ip) {
        const now = Date.now();
        const bucket = this.buckets.get(ip);
        if (bucket === undefined || bucket.resetAt <= now) {
            this.buckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
            if (this.buckets.size > 1024) {
                // 粗暴防无界增长：满时清掉已过期的桶。
                for (const [key, entry] of this.buckets) {
                    if (entry.resetAt <= now)
                        this.buckets.delete(key);
                }
            }
            return true;
        }
        bucket.count += 1;
        return bucket.count <= RATE_LIMIT;
    }
}
export async function startGateway(deps) {
    const { config, pairing, proxy, logger } = deps;
    const localHostnames = new Set(collectLocalHostnames());
    for (const host of config.trustedHosts)
        localHostnames.add(host);
    const limiter = new RateLimiter();
    async function handle(req, res) {
        const rawPath = new URL(req.url ?? '/', 'http://x').pathname;
        const cookies = parseCookies(req.headers.cookie);
        const token = cookies[TOKEN_COOKIE] ?? '';
        const device = token === '' ? null : await pairing.verifyToken(token);
        const remoteIp = req.socket.remoteAddress ?? 'unknown';
        // Host 校验：主机名必须是本机地址、localhost 或显式信任域（防 DNS rebinding）。
        const hostHeader = req.headers.host;
        let hostName = '';
        if (typeof hostHeader === 'string') {
            try {
                hostName = new URL(`http://${hostHeader}`).hostname;
            }
            catch {
                hostName = '';
            }
        }
        const hostTrusted = hostName !== '' && (localHostnames.has(hostName) || localHostnames.has(`[${hostName}]`));
        if (!hostTrusted) {
            json(res, 403, { ok: false, error: { code: 'forbidden', message: 'host 不受信任' } });
            return;
        }
        // 全局限流（未认证面优先，但对所有请求生效，简单且够用）。
        if (!limiter.allow(remoteIp)) {
            json(res, 429, { ok: false, error: { code: 'rate-limited', message: '请求过于频繁' } });
            return;
        }
        // ---- 公开路由 ----
        if (req.method === 'GET' && rawPath === '/') {
            const url = new URL(req.url ?? '/', 'http://x');
            const wantsPair = device === null;
            res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
            res.end(wantsPair
                ? renderPairPage(url.searchParams.get('code') ?? '', '')
                : renderConnectedPage(device.name, url.searchParams.get('code') ?? ''));
            return;
        }
        if (req.method === 'GET' && rawPath === '/remote/health') {
            json(res, 200, { ok: true, paired: device !== null });
            return;
        }
        // ---- 实时事件流（SSE）：已配对设备 EventSource 直连，客户端断开即中止上游 ----
        if (req.method === 'GET' && rawPath === '/remote/events') {
            if (device === null) {
                json(res, 401, { ok: false, error: { code: 'unauthorized', message: '设备未配对' } });
                return;
            }
            const ac = new AbortController();
            res.on('close', () => ac.abort());
            try {
                const upstream = await proxy.openEventStream(ac.signal);
                if (!upstream.ok || !upstream.body) {
                    json(res, 502, { ok: false, error: { code: 'bad-gateway', message: '事件流上游不可用' } });
                    return;
                }
                res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
                Readable.fromWeb(upstream.body).pipe(res);
            }
            catch {
                if (!res.headersSent)
                    json(res, 502, { ok: false, error: { code: 'bad-gateway', message: '事件流建立失败' } });
            }
            return;
        }
        if (req.method === 'POST' && rawPath === '/remote/pair') {
            const body = await readJsonBody(req);
            const code = typeof body?.code === 'string' ? body.code : '';
            const name = typeof body?.deviceName === 'string'
                ? body.deviceName
                : '';
            if (code === '') {
                json(res, 400, { ok: false, error: { code: 'bad-request', message: '缺少配对码' } });
                return;
            }
            // 手机端自报设备名：带上 UA 家族做默认名。
            const ua = req.headers['user-agent'] ?? '';
            const fallbackName = /iPhone/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : '手机';
            const paired = await pairing.consumePairCode(code, name === '' ? fallbackName : name);
            if (paired === null) {
                json(res, 401, { ok: false, error: { code: 'bad-code', message: '配对码无效或已过期' } });
                return;
            }
            // Cookie 不设 HttpOnly：手机端把它镜像进 localStorage，浏览器清掉 Cookie 时可自愈恢复
            res.setHeader('set-cookie', `${TOKEN_COOKIE}=${paired.token}; Path=/; SameSite=Lax; Max-Age=${365 * 24 * 3600}`);
            json(res, 200, { ok: true, device: paired.device, token: paired.token });
            return;
        }
        // ---- 退出配对：吊销本设备令牌并清 Cookie（真吊销，不是本地清缓存） ----
        if (req.method === 'POST' && rawPath === '/remote/unpair') {
            if (device === null) {
                json(res, 401, { ok: false, error: { code: 'unauthorized', message: '设备未配对' } });
                return;
            }
            const revoked = await pairing.revokeByToken(token);
            // Max-Age=0 让浏览器立即丢弃 Cookie；页面侧同时清 localStorage 镜像。
            res.setHeader('set-cookie', `${TOKEN_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`);
            logger.info(`[dsh-remote-control] 设备「${device.name}」已自助退出配对`);
            json(res, 200, { ok: revoked });
            return;
        }
        // ---- 审批/提问应答：透传 client-response 信封到 /api/respond（走同一张 pending 表） ----
        if (req.method === 'POST' && rawPath === '/remote/respond') {
            if (device === null) {
                json(res, 401, { ok: false, error: { code: 'unauthorized', message: '设备未配对' } });
                return;
            }
            const body = await readJsonBody(req);
            if (body === null) {
                json(res, 400, { ok: false, error: { code: 'bad-request', message: '请求体不是合法 JSON' } });
                return;
            }
            try {
                json(res, 200, await proxy.respond(body));
            }
            catch (error) {
                logger.warn(`[dsh-remote-control] respond 失败: ${error instanceof Error ? error.message : String(error)}`);
                json(res, 500, { accepted: false, reason: 'internal' });
            }
            return;
        }
        // ---- 认证路由：官方 RPC 白名单转发 ----
        if (req.method === 'POST' && rawPath.startsWith('/remote/api/')) {
            if (device === null) {
                json(res, 401, { ok: false, error: { code: 'unauthorized', message: '设备未配对' } });
                return;
            }
            const method = decodeURIComponent(rawPath.slice('/remote/api/'.length));
            if (!REMOTE_METHOD_ALLOWLIST.includes(method)) {
                json(res, 403, { ok: false, error: { code: 'method-not-allowed', message: `方法不在白名单：${method}` } });
                return;
            }
            const payload = await readJsonBody(req);
            if (payload === null) {
                json(res, 400, { ok: false, error: { code: 'bad-request', message: '请求体不是合法 JSON' } });
                return;
            }
            try {
                const outcome = await proxy.call(method, payload);
                json(res, 200, outcome);
            }
            catch (error) {
                const detail = error instanceof Error ? error.message : String(error);
                logger.warn(`[dsh-remote-control] RPC ${method} 失败: ${detail}`);
                // 回传简短原因：诊断远程 RPC 时「进程内调用失败」这一句无法定位问题。
                json(res, 500, { ok: false, error: { code: 'internal', message: '进程内调用失败', detail } });
            }
            return;
        }
        json(res, 404, { ok: false, error: { code: 'not-found', message: 'not found' } });
    }
    const server = createServer((req, res) => {
        handle(req, res).catch((error) => {
            logger.warn(`[dsh-remote-control] 网关请求异常: ${error instanceof Error ? error.message : String(error)}`);
            if (!res.headersSent)
                json(res, 500, { ok: false, error: { code: 'internal', message: 'internal error' } });
            else
                res.destroy();
        });
    });
    // 端口被占用自动 +1 重试（最多 +20）。
    let port = config.port;
    for (let attempt = 0;; attempt++) {
        try {
            await new Promise((resolve, reject) => {
                const onError = (error) => { server.off('error', onError); reject(error); };
                server.once('error', onError);
                server.listen(port, config.host, () => { server.off('error', onError); resolve(); });
            });
            break;
        }
        catch (error) {
            const code = error.code;
            if (code === 'EADDRINUSE' && attempt < 20) {
                port += 1;
                continue;
            }
            throw error;
        }
    }
    logger.info(`[dsh-remote-control] 手机网关已启动 http://${config.host}:${port}（本机地址见设置页）`);
    return {
        server,
        port,
        close: () => new Promise((resolve, reject) => {
            server.close((error) => { if (error === undefined)
                resolve();
            else
                reject(error); });
            server.closeAllConnections();
        }),
    };
}
