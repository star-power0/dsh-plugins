/**
 * dsh-remote-control — 浏览器半侧：向设置页注册「远程控制」分区。
 * 数据走宿主官方 webServer 上的 /remote-control/* 管理面（回环围栏），
 * 相对路径 fetch 由 client 连接层承载。
 */
import { Panel } from "./Panel.js";
import { en, zh } from "./locales.js";
/** 本插件拥有的词典命名空间。 */
export const NS = 'remoteControl';
/** 需要的客户端服务：slot 注入与本地化。 */
export const inject = ['slots', 'locale'];
/** 注册「远程控制」设置分区（order 18：排在插件 15 / MCP 16.5 之后）。 */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-remote-control: dictionaries');
    const t = ctx.locale.bind(NS);
    ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'remote-control',
        order: 18,
        label: () => t('nav'),
        locale: NS,
    }, Panel));
}
