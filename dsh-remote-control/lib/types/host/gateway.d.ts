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
import { type Server } from 'node:http';
import type { RemoteControlConfig } from '../core/types.ts';
import type { PairingStore } from './pairing.ts';
import type { ProxyBridge } from './proxy.ts';
export interface GatewayDeps {
    config: RemoteControlConfig;
    pairing: PairingStore;
    proxy: ProxyBridge;
    /** 打日志用（宿主 logger 的结构性子集）。 */
    logger: {
        info(message: string): void;
        warn(message: string): void;
    };
}
export interface GatewayHandle {
    server: Server;
    port: number;
    close(): Promise<void>;
}
/** 收集本机可达主机名（Host 校验 + 局域网地址展示共用）。 */
export declare function collectLocalHostnames(): string[];
export declare function startGateway(deps: GatewayDeps): Promise<GatewayHandle>;
//# sourceMappingURL=gateway.d.ts.map