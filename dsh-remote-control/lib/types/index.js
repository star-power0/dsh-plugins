/**
 * dsh-remote-control — host 半侧入口。
 *
 * 两件事：
 * 1. 自起手机网关（node:http，默认 0.0.0.0:30880，占用 +1 重试），
 *    配对认证 + 官方 RPC 白名单进程内转发（toFetchHandler(ctx.apiProxy)）；
 * 2. 在宿主官方 webServer 上挂 /remote-control/* 管理面（回环围栏），
 *    桌面端设置页从这里取状态、发配对码、管设备。
 *
 * 浏览器半侧（exports "./client"）由 dsh.client 声明注入设置页分区。
 */
import { DEFAULT_CONFIG } from "./core/types.js";
import { PairingStore } from "./host/pairing.js";
import { createProxyBridge } from "./host/proxy.js";
import { startGateway } from "./host/gateway.js";
import { registerAdminRoutes } from "./host/admin-routes.js";
/** 需要的宿主服务：官方 API 网关（进程内桥）与 webServer（管理面路由）。 */
export const inject = ['apiProxy', 'webServer'];
export function apply(ctx, config) {
    const merged = { ...DEFAULT_CONFIG, ...config };
    const pairing = new PairingStore();
    let gateway;
    ctx.inject(['apiProxy', 'webServer'], (hostCtx) => {
        const logger = hostCtx.logger;
        const proxy = createProxyBridge(hostCtx.apiProxy);
        // 手机网关：随插件 fiber 释放（cordis effect disposer）。
        ctx.effect(() => startGateway({ config: merged, pairing, proxy, logger }).then((handle) => {
            gateway = handle;
            return async () => {
                await handle.close();
                await pairing.flushIfDirty();
                gateway = undefined;
            };
        }), 'dsh-remote-control: gateway');
        // 管理面（回环）：桌面端设置页的取数入口。网关句柄异步就绪，
        // 就绪前管理面统一回 503。
        ctx.effect(() => registerAdminRoutes(hostCtx, {
            getGateway: () => gateway,
            pairing,
            configHost: merged.host,
            publicUrl: merged.publicUrl,
        }), 'dsh-remote-control: admin routes');
    });
}
