/**
 * dsh-remote-control — 手机端页面（服务端渲染的单文件 HTML）。
 *
 * 两个状态：未配对 → 配对页（输码换令牌）；已配对 → M2 控制面
 * （会话列表 / 消息流 / 发指令 / 中止 / 模型切换）。零外部资源：
 * 内联 CSS/JS，系统字体，深色优先；消息内容一律用 DOM textContent
 * 渲染（不走 innerHTML），天然免疫注入。
 */
/** 配对页：输入 8 位配对码，POST /remote/pair 换设备令牌。 */
export declare function renderPairPage(prefilledCode: string, errorText: string): string;
/** 已配对控制页（M2）：会话列表 → 消息流 + 发指令 / 中止 / 模型切换。与设备无关（名字前端拉 /remote/me），可协商缓存。 */
export declare function renderConnectedPage(): string;
//# sourceMappingURL=page.d.ts.map