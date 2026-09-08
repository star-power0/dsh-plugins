/**
 * dsh-remote-control — 管理面路由（挂在宿主官方 webServer 上）。
 *
 * 桌面端设置页从这里取网关状态、生成配对码、管理设备。安全模型与
 * dsh-plugin-manager 一致（MIT，参考其实现）：整棵前缀树只对回环请求
 * 放行——坐在这台电脑前的人才能发配对码、吊销设备。
 */
import type { Context } from '@deepseek-ai/cordis';
import type { PairingStore } from './pairing.ts';
import type { GatewayHandle } from './gateway.ts';
export interface AdminDeps {
    /** 网关句柄是异步就绪的；未就绪时管理面对外报 503。 */
    getGateway(): GatewayHandle | undefined;
    pairing: PairingStore;
    /** 网关绑定的对外地址（0.0.0.0 时用本机网卡地址拼 URL）。 */
    configHost: string;
    /** 公网入口（配置 publicUrl；空串 = 未配置，仅局域网直连）。 */
    publicUrl: string;
}
export declare function registerAdminRoutes(ctx: Context, deps: AdminDeps): () => void;
//# sourceMappingURL=admin-routes.d.ts.map