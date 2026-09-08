/**
 * dsh-remote-control — 进程内官方 API 桥。
 *
 * 复用宿主 API 网关的宿主侧 fetch 载体（toFetchHandler(ctx.apiProxy)），
 * 手机侧请求在插件进程内直接变成一次官方 client-request 调用：
 * 不反代、不触网、不经过官方 /api 的回环 fence。
 */
/** server-response 业务载荷（ok/error 分支）。 */
export interface RpcOutcome<T = unknown> {
    ok: boolean;
    value?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
}
/** M2 暴露给已配对设备的方法白名单（控制面：列表 / 历史 / 发话 / 中止 / 模型目录与切换 / 工作区清单 / 队列管理）。 */
export declare const REMOTE_METHOD_ALLOWLIST: readonly string[];
/** 结构性最小接口：ctx.apiProxy 的本插件视角（避免类型版本耦合）。 */
export interface ApiProxyLike {
}
export interface ProxyBridge {
    /** 调一个官方 RPC 方法；返回信封内的 result 分支与 HTTP 语义无关。 */
    call(method: string, payload: unknown): Promise<RpcOutcome>;
    /** 打开 /api/events.mux 的 SSE 实时事件流；signal 中止时上游断开。 */
    openEventStream(signal?: AbortSignal): Promise<Response>;
    /** 投递 client-response 信封到 /api/respond（审批/提问应答，与 SSE 流同一张 pending 表）。 */
    respond(message: unknown): Promise<unknown>;
}
export declare function createProxyBridge(apiProxy: unknown): ProxyBridge;
//# sourceMappingURL=proxy.d.ts.map