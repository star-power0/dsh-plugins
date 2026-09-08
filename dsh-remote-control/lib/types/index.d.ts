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
import type { Context } from '@deepseek-ai/cordis';
import type { RemoteControlConfig } from './core/types.ts';
/** 需要的宿主服务：官方 API 网关（进程内桥）与 webServer（管理面路由）。 */
export declare const inject: string[];
/** 可选配置（profile patch 的 config 对象）。 */
export type Config = Partial<RemoteControlConfig>;
export declare function apply(ctx: Context, config?: Config): void;
//# sourceMappingURL=index.d.ts.map