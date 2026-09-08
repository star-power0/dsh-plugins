/**
 * dsh-remote-control — 浏览器半侧：向设置页注册「远程控制」分区。
 * 数据走宿主官方 webServer 上的 /remote-control/* 管理面（回环围栏），
 * 相对路径 fetch 由 client 连接层承载。
 */
/** 本插件拥有的词典命名空间。 */
export declare const NS = "remoteControl";
/** 翻译函数形状（与框架注入的 t 结构兼容）。 */
export type Translate = (key: string) => string;
/** locale 服务的结构性子集。 */
interface LocaleService {
    register(namespace: string, dicts: {
        zh: Record<string, string>;
        en: Record<string, string>;
    }): unknown;
    bind(namespace: string): Translate;
}
/** slots 服务的结构性子集。 */
interface SlotsService {
    inject(slot: string, register: () => unknown): void;
    register(meta: Record<string, unknown>, component: unknown): unknown;
}
/** 浏览器侧 cordis context 的本插件视角。 */
interface RemoteControlClientContext {
    effect(callback: () => unknown, label?: string): void;
    locale: LocaleService;
    slots: SlotsService;
}
/** 需要的客户端服务：slot 注入与本地化。 */
export declare const inject: string[];
/** 注册「远程控制」设置分区（order 18：排在插件 15 / MCP 16.5 之后）。 */
export declare function apply(ctx: RemoteControlClientContext): void;
export {};
//# sourceMappingURL=index.d.ts.map