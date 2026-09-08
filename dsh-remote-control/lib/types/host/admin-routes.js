/**
 * dsh-remote-control — 管理面路由（挂在宿主官方 webServer 上）。
 *
 * 桌面端设置页从这里取网关状态、生成配对码、管理设备。安全模型与
 * dsh-plugin-manager 一致（MIT，参考其实现）：整棵前缀树只对回环请求
 * 放行——坐在这台电脑前的人才能发配对码、吊销设备。
 */
import { collectLocalHostnames } from "./gateway.js";
/** Loopback 信任围栏（同 dsh-plugin-manager / dsh-ide-layout 的判断）。 */
function isLoopbackRequest(request) {
    const address = request.socket.remoteAddress;
    if (address !== '127.0.0.1' && address !== '::1' && address !== '::ffff:127.0.0.1')
        return false;
    const host = request.headers.host;
    if (typeof host !== 'string')
        return false;
    let hostUrl;
    try {
        hostUrl = new URL(`http://${host}`);
    }
    catch {
        return false;
    }
    if (hostUrl.hostname !== '127.0.0.1' && hostUrl.hostname !== 'localhost' && hostUrl.hostname !== '[::1]')
        return false;
    if (request.headers['sec-fetch-site'] === 'cross-site')
        return false;
    const origin = request.headers.origin;
    if (origin === undefined)
        return true;
    try {
        return new URL(origin).host === hostUrl.host;
    }
    catch {
        return false;
    }
}
function json(res, status, body) {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    res.end(JSON.stringify(body));
}
async function readJsonBody(req) {
    const chunks = [];
    let total = 0;
    for await (const chunk of req) {
        total += chunk.length;
        if (total > 1 << 20)
            return null;
        chunks.push(chunk);
    }
    const text = Buffer.concat(chunks).toString('utf8');
    if (text === '')
        return {};
    try {
        return JSON.parse(text);
    }
    catch {
        return null;
    }
}
export function registerAdminRoutes(ctx, deps) {
    const { getGateway, pairing, configHost, publicUrl } = deps;
    return ctx.webServer.register({
        kind: 'prefix',
        path: '/remote-control',
        async handler(req, res) {
            if (!isLoopbackRequest(req)) {
                json(res, 403, { ok: false, error: { code: 'forbidden', message: 'loopback-only' } });
                return;
            }
            const pathname = new URL(req.url ?? '/', 'http://x').pathname;
            const method = req.method ?? 'GET';
            const gateway = getGateway();
            if (gateway === undefined) {
                json(res, 503, { ok: false, error: { code: 'starting', message: '手机网关尚未就绪' } });
                return;
            }
            // 网关状态 + 本机可达 URL。
            if (method === 'GET' && pathname === '/remote-control/status') {
                const devices = await pairing.listDevices();
                // 公网入口（若配置）排在首位：设置页二维码取第一条。
                const urls = [
                    ...(publicUrl !== '' ? [publicUrl] : []),
                    ...(configHost === '0.0.0.0'
                        ? collectLocalHostnames()
                            // 移动端场景只给 IPv4 直连地址（排除 IPv6 与 localhost 字面量）。
                            .filter((name) => name.includes('.') && name !== 'localhost')
                            .map((name) => `http://${name}:${gateway.port}`)
                        : [`http://${configHost}:${gateway.port}`]),
                ];
                json(res, 200, {
                    ok: true,
                    status: {
                        listening: gateway.server.listening,
                        port: gateway.port,
                        host: configHost,
                        urls,
                        devices,
                        publicUrl,
                    },
                });
                return;
            }
            // 生成配对码（10 分钟、一次性），附每个可达地址的深链。
            if (method === 'POST' && pathname === '/remote-control/pair-code') {
                const body = await readJsonBody(req);
                void body; // deviceName 由手机端配对时自报，这里不收。
                const issued = pairing.createPairCode();
                // 公网深链（若配置 publicUrl）排首位：微信扫 HTTPS 域名可直接打开。
                const urls = [
                    ...(publicUrl !== '' ? [`${publicUrl}/?code=${issued.code}`] : []),
                    ...(configHost === '0.0.0.0'
                        ? collectLocalHostnames()
                            .filter((name) => name.includes('.') && name !== 'localhost')
                            .map((name) => `http://${name}:${gateway.port}/?code=${issued.code}`)
                        : [`http://${configHost}:${gateway.port}/?code=${issued.code}`]),
                ];
                const payload = { ok: true, code: issued.code, expiresAt: issued.expiresAt, urls };
                json(res, 200, payload);
                return;
            }
            // 设备列表。
            if (method === 'GET' && pathname === '/remote-control/devices') {
                json(res, 200, { ok: true, devices: await pairing.listDevices() });
                return;
            }
            // 吊销设备。
            if (method === 'POST' && pathname === '/remote-control/revoke') {
                const body = await readJsonBody(req);
                const id = typeof body?.id === 'string' ? body.id : '';
                if (id === '') {
                    json(res, 400, { ok: false, error: { code: 'bad-request', message: '缺少设备 id' } });
                    return;
                }
                json(res, 200, { ok: await pairing.revokeDevice(id) });
                return;
            }
            json(res, 404, { ok: false, error: { code: 'not-found', message: 'not found' } });
        },
    });
}
