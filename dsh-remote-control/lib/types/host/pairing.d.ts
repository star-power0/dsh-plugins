/**
 * dsh-remote-control — 配对与设备令牌存储。
 *
 * 配对码：8 位数字，10 分钟有效、一次性（内存态，不落盘）。
 * 设备令牌：32 字节随机 hex，Cookie 下发一次；磁盘只存 SHA-256 摘要。
 * 持久化：~/.dsh/remote-control-state.json（tmp + rename 原子替换）。
 */
import type { DeviceInfo } from '../core/types.ts';
export declare class PairingStore {
    private readonly file;
    private devices;
    private readonly pendingCodes;
    private loaded;
    /** 内存中的 lastSeen 变更；flush 时落盘。 */
    private dirty;
    constructor(file?: string);
    /** 懒加载持久化状态；文件缺失或损坏时从空表开始。 */
    private ensureLoaded;
    private flush;
    /** 生成一条新配对码。 */
    createPairCode(): {
        code: string;
        expiresAt: string;
    };
    /** 用配对码换设备令牌；码无效/过期/已用返回 null。 */
    consumePairCode(code: string, deviceName: string): Promise<{
        token: string;
        device: DeviceInfo;
    } | null>;
    /** 校验设备令牌；命中则刷新 lastSeen（内存态，惰性落盘）。 */
    verifyToken(token: string): Promise<DeviceInfo | null>;
    listDevices(): Promise<DeviceInfo[]>;
    revokeDevice(id: string): Promise<boolean>;
    /**
     * 按令牌吊销（手机端「退出配对」）：设备只持有自己的令牌、不知道 id，
     * 所以自助退出走摘要匹配。命中即从磁盘移除，令牌立刻失效。
     */
    revokeByToken(token: string): Promise<boolean>;
    /** lastSeen 惰性落盘入口（宿主关闭时调用；无变更时是 no-op）。 */
    flushIfDirty(): Promise<void>;
}
//# sourceMappingURL=pairing.d.ts.map