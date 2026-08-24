# dsh-plugins

DeepSeek Harness 本地插件集合，本仓库是 `profiles/plugins` 目录的**唯一真源**（single source of truth）。

## 插件清单

| 插件 | 类别 | 说明 |
|---|---|---|
| dsh-ide-layout | IDE | 独立三区 IDE 布局：文件树 / 编辑器 / 终端 / Git / LSP |
| dsh-genui | 界面 | 生成式 UI：对话内渲染 dsh-ui 交互组件 |
| dsh-files | 文件 | 回形针文件上传 + `read_document` 文档解析 |
| dsh-at-file | 文件 | 输入框 `@` 引用工作区文件 |
| dsh-workspace-picker | 工作区 | Windows 跨盘文件夹选择器 |
| dsh-session-manager | 会话 | 会话列表与彻底删除 |
| dsh-native-session-window | 会话 | 桌面端会话独立窗口（多窗口 + 分屏） |
| dsh-plugin-msg-nav | 导航 | 对话消息节点导航条 |
| dsh-client-ui-aqua | 主题 | Aqua 玻璃拟态主题 |
| dsh-plugin-wallpaper-engine | 主题 | Wallpaper Engine 动态壁纸背景 |
| dsh-reasoning-slider | 模型 | 5 档思考强度滑块 |
| dsh-model-enhancer | 模型 | 模型设置增强（图片输入开关等） |
| dsh-modlens | 视觉 | ModLens 视觉桥 + 图片分流守卫 |
| dsh-tool-memory-lite | 记忆 | `memory_save` / `memory_read` / `memory_list` / `memory_forget` |
| dsh-plugin-marketplace | 平台 | 插件市场与安装管理 |
| dsh-mcp-background | MCP | 7 个 MCP 服务后台连接管理 |

## 来源与许可（Attribution）

每个插件的完整来源、上游许可证与本地改动说明见各插件目录下的 `README.md` 顶部「来源与许可」小节，汇总如下：

| 插件 | 来源 | 上游许可证 | 本地状态 |
|---|---|---|---|
| dsh-ide-layout | [myzane678/dsh-ide-suite](https://github.com/myzane678/dsh-ide-suite)（dsh-ide-layout） | MIT | 大幅增强：编码选择、Java/Rust LSP、LSP 懒加载与资源池 |
| dsh-genui | [omdsh-dev/dsh-genui](https://github.com/omdsh-dev/dsh-genui) | MIT | 本地适配：rc.6 双通道渲染、slash 过滤 |
| dsh-at-file | [omdsh-dev/dsh-at-file](https://github.com/omdsh-dev/dsh-at-file) | MIT | 按 Registry verified 固定 commit 接入 |
| dsh-files | [taxueseek/dsh-files](https://github.com/taxueseek/dsh-files) | MIT | 固定提交接入，仅保留回形针上传 + read_document |
| dsh-plugin-msg-nav | [SherUnlocked-4869/dsh-plugin-msg-nav](https://github.com/SherUnlocked-4869/dsh-plugin-msg-nav) | MIT | 固定 0.2.0（含两个未被 Registry 收录的修复） |
| dsh-plugin-wallpaper-engine | [elysia395/dsh-wallpaper-engine](https://github.com/elysia395/dsh-wallpaper-engine) | MIT | 本地增强：独立设置页、自绘图标、隐藏不可渲染壁纸 |
| dsh-client-ui-aqua | [WYH66666666/DSH-Transparent-UI-Plugin](https://github.com/WYH66666666/DSH-Transparent-UI-Plugin)（`@deepseek-ai/dsh-client-ui-aqua`） | MIT | 本地适配：独立设置页、本地构建链 |
| dsh-plugin-marketplace | [YELEBAI/dsh-plugin-marketplace](https://github.com/YELEBAI/dsh-plugin-marketplace) | MIT | 固定 v0.9.1，禁用自更新；本地修复目录选择 RPC |
| dsh-modlens | [liustack/modlens](https://github.com/liustack/modlens)（`@liustack/modlens`）+ dsh-modlens-guard | MIT | 合体插件：视觉引擎 + 请求时图片分流守卫 |
| dsh-reasoning-slider | 原创；滑块动画效果参考 [flyemFSB/dsh-reasoning-effort-hdbzq](https://github.com/flyemFSB/dsh-reasoning-effort-hdbzq) | MIT（参考部分） | 原创为主 |
| dsh-tool-memory-lite | 原创 | — | MIT |
| dsh-model-enhancer | 原创 | — | MIT |
| dsh-session-manager | 原创 | — | MIT |
| dsh-native-session-window | 原创 | — | MIT |
| dsh-workspace-picker | 原创 | — | MIT |
| dsh-mcp-background | 原创 | — | MIT |

## 开发约定

- 插件运行时依赖安装：各插件目录内 `pnpm install --prod --ignore-scripts`
- `node_modules/`、构建缓存不入库；`vendor/`（如 PowerShell Editor Services）随库分发
- 修改插件前请参考各插件 README 与 CHANGELOG 的构建说明
