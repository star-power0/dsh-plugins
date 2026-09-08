/**
 * dsh-remote-control — 配对与设备令牌存储。
 *
 * 配对码：8 位数字，10 分钟有效、一次性（内存态，不落盘）。
 * 设备令牌：32 字节随机 hex，Cookie 下发一次；磁盘只存 SHA-256 摘要。
 * 持久化：~/.dsh/remote-control-state.json（tmp + rename 原子替换）。
 */
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
/** 配对码有效期（毫秒）。 */
const PAIR_CODE_TTL_MS = 10 * 60 * 1000;
function tokenHash(token) {
    return createHash('sha256').update(token, 'utf8').digest('hex');
}
async function atomicWrite(file, data) {
    await mkdir(dirname(file), { recursive: true });
    const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
    await writeFile(tmp, data, 'utf8');
    await rename(tmp, file);
}
export class PairingStore {
    file;
    devices = [];
    pendingCodes = new Map();
    loaded = false;
    /** 内存中的 lastSeen 变更；flush 时落盘。 */
    dirty = false;
    constructor(file) {
        this.file = file ?? join(homedir(), '.dsh', 'remote-control-state.json');
    }
    /** 懒加载持久化状态；文件缺失或损坏时从空表开始。 */
    async ensureLoaded() {
        if (this.loaded)
            return;
        this.loaded = true;
        try {
            const raw = await readFile(this.file, 'utf8');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.devices))
                this.devices = parsed.devices;
        }
        catch {
            this.devices = [];
        }
    }
    async flush() {
        const state = { devices: this.devices };
        await atomicWrite(this.file, `${JSON.stringify(state, null, 2)}\n`);
        this.dirty = false;
    }
    /** 生成一条新配对码。 */
    createPairCode() {
        // 8 位数字； rejects 前导零歧义——保留前导零，输入框按字符串处理。
        const code = String(randomBytes(4).readUInt32BE(0) % 100_000_000).padStart(8, '0');
        this.pendingCodes.set(code, { expiresAt: Date.now() + PAIR_CODE_TTL_MS });
        // 顺手清掉过期码，避免 map 无界增长。
        const now = Date.now();
        for (const [key, pending] of this.pendingCodes) {
            if (pending.expiresAt <= now)
                this.pendingCodes.delete(key);
        }
        return { code, expiresAt: new Date(now + PAIR_CODE_TTL_MS).toISOString() };
    }
    /** 用配对码换设备令牌；码无效/过期/已用返回 null。 */
    async consumePairCode(code, deviceName) {
        await this.ensureLoaded();
        const pending = this.pendingCodes.get(code);
        if (pending === undefined || pending.expiresAt <= Date.now())
            return null;
        this.pendingCodes.delete(code);
        const token = randomBytes(32).toString('hex');
        const now = new Date().toISOString();
        const stored = {
            id: randomUUID(),
            name: deviceName === '' ? '未命名设备' : deviceName.slice(0, 40),
            tokenHash: tokenHash(token),
            createdAt: now,
            lastSeen: now,
        };
        this.devices.push(stored);
        await this.flush();
        return { token, device: toDeviceInfo(stored) };
    }
    /** 校验设备令牌；命中则刷新 lastSeen（内存态，惰性落盘）。 */
    async verifyToken(token) {
        await this.ensureLoaded();
        if (token === '')
            return null;
        const hash = tokenHash(token);
        const device = this.devices.find((entry) => entry.tokenHash === hash);
        if (device === undefined)
            return null;
        device.lastSeen = new Date().toISOString();
        this.dirty = true;
        return toDeviceInfo(device);
    }
    async listDevices() {
        await this.ensureLoaded();
        return this.devices.map(toDeviceInfo);
    }
    async revokeDevice(id) {
        await this.ensureLoaded();
        const before = this.devices.length;
        this.devices = this.devices.filter((entry) => entry.id !== id);
        if (this.devices.length !== before) {
            await this.flush();
            return true;
        }
        return false;
    }
    /**
     * 按令牌吊销（手机端「退出配对」）：设备只持有自己的令牌、不知道 id，
     * 所以自助退出走摘要匹配。命中即从磁盘移除，令牌立刻失效。
     */
    async revokeByToken(token) {
        await this.ensureLoaded();
        if (token === '')
            return false;
        const hash = tokenHash(token);
        const before = this.devices.length;
        this.devices = this.devices.filter((entry) => entry.tokenHash !== hash);
        if (this.devices.length !== before) {
            await this.flush();
            return true;
        }
        return false;
    }
    /** lastSeen 惰性落盘入口（宿主关闭时调用；无变更时是 no-op）。 */
    async flushIfDirty() {
        if (this.dirty)
            await this.flush();
    }
}
function toDeviceInfo(device) {
    return { id: device.id, name: device.name, createdAt: device.createdAt, lastSeen: device.lastSeen };
}
