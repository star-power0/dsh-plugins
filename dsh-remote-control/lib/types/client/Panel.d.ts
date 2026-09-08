/**
 * dsh-remote-control — 「远程控制」设置分区面板。
 *
 * 网关状态与地址展示、生成配对码（二维码 + 数字码）、设备列表与吊销。
 * 数据全部来自 /remote-control/* 管理面（回环围栏内的相对路径 fetch）。
 * 样式沿用官方设置页 DSW CSS 变量，无第三方 UI 依赖（二维码用 qrcode 库）。
 */
interface PanelProps {
    /** slot 注入的本地化翻译（命名空间由注册时的 locale 声明提供）。 */
    t: (key: string) => string;
}
export declare function Panel({ t }: PanelProps): React.JSX.Element;
export {};
//# sourceMappingURL=Panel.d.ts.map