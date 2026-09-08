/**
 * dsh-remote-control 共享类型：host 半与浏览器半之间的数据形状。
 * 浏览器半只消费 admin JSON 信封，不依赖任何宿主内部类型。
 */
/** 插件配置（profile patch 的 config 对象，缺省项用运行时默认值补齐）。 */
export interface RemoteControlConfig {
    /** 网关绑定地址；0.0.0.0 = 对局域网开放（默认），127.0.0.1 = 仅本机。 */
    host: string;
    /** 网关端口；默认 30880，被占用自动 +1（最多 +20）。 */
    port: number;
    /** 额外信任的 Host 主机名（公网反代域名场景）。 */
    trustedHosts: string[];
    /** 公网入口（如 https://xxx.dpdns.org，经隧道反代到网关）。
     *  非空时设置页地址列表与二维码优先展示它（微信可直接扫 HTTPS 域名）。 */
    publicUrl: string;
}
/** 运行时默认配置。 */
export declare const DEFAULT_CONFIG: RemoteControlConfig;
/** 已配对设备（持久化形态；令牌只存 SHA-256 摘要）。 */
export interface StoredDevice {
    id: string;
    name: string;
    tokenHash: string;
    createdAt: string;
    lastSeen: string;
}
/** 持久化状态文件（~/.dsh/remote-control-state.json）。 */
export interface RemoteControlState {
    devices: StoredDevice[];
}
/** 浏览器半可见的设备信息（不含令牌摘要）。 */
export interface DeviceInfo {
    id: string;
    name: string;
    createdAt: string;
    lastSeen: string;
}
/** admin GET /status 的聚合状态。 */
export interface GatewayStatus {
    listening: boolean;
    /** 实际监听端口（配置 port 被占用时会 +1 重试）。 */
    port: number;
    host: string;
    /** 手机能访问的地址：公网入口（若配置）在前，局域网 http://ip:port 在后。 */
    urls: string[];
    /** 公网入口（配置 publicUrl；空串 = 未配置）。 */
    publicUrl: string;
    devices: DeviceInfo[];
}
/** admin POST /pair-code 的响应。 */
export interface PairCodeIssued {
    code: string;
    expiresAt: string;
    /** 可达地址深链（?code=xxx）：公网入口（若配置）排最前，二维码取第一条。 */
    urls: string[];
}
//# sourceMappingURL=types.d.ts.map