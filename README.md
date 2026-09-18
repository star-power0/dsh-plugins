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
| dsh-mcp-background | MCP | 7 个 MCP 服务后台连接管理；错峰启动队列（首屏让行 + 单服务 4s 熔断） |
| dsh-client-ui-custom | 主题 | 客制化外观：壁纸 / 毛玻璃 / 强调色、快捷键、用量统计、动效 |
| dsh-talk-map | 界面 | 可视化对话地图：会话即白板卡片，拖拽排布、画边 fork 注入上下文 |
| dsh-remote-control | 手机 | 手机远程控制：配对码接入，看会话 / 发指令 / 切模型与档位 |
| dsh-pocket | 手机 | 手机同屏镜像：局域网 + 公网访问同一 DSH 实例，含手机窄屏适配 |

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
| dsh-reasoning-slider | 原创；滑块动画效果参考 [flyemFSB/dsh-reasoning-effort-hdbzq](https://github.com/flyemFSB/dsh-reasoning-effort-hdbzq)（其仓库未附 LICENSE 文件；沿用 3 张档位头像图） | MIT | 原创为主 |
| dsh-tool-memory-lite | 原创 | — | MIT |
| dsh-model-enhancer | 原创 | — | MIT |
| dsh-session-manager | 原创 | — | MIT |
| dsh-native-session-window | 原创 | — | MIT |
| dsh-workspace-picker | 原创 | — | MIT |
| dsh-mcp-background | 原创 | — | MIT |
| dsh-client-ui-custom | [Yoli-mi/dsh-client-ui-custom](https://github.com/Yoli-mi/dsh-client-ui-custom)（`@ha-na-bi/dsh-client-ui-custom`） | MIT | 本地构建链（自研 `build.mjs`）；文字颜色调节、玻璃档位联动修复、设置页视觉层次 |
| dsh-talk-map | [Tasihi89/dsh-talk-map](https://github.com/Tasihi89/dsh-talk-map) | MIT | 固定 commit `b2d36d6`（= v0.1.0）；本地增强：会话卡片自动同步（local.1/local.2） |
| dsh-remote-control | [myzane678/dsh-remote-control](https://github.com/myzane678/dsh-remote-control) | MIT | 固定 commit `ca297b3`（= v0.2.0）；大幅本地增强：配对认证、手机布局、SSE 保活、页面 v62 围栏修复 |
| dsh-pocket | [shaobeichen/dsh-pocket](https://github.com/shaobeichen/dsh-pocket) | GPL-2.0 | npm `2.10.6` tarball 接入；5 项本地定制 + 手机窄屏全套修复（详见 `LOCAL.md`） |

## 开发约定

- 插件运行时依赖安装：各插件目录内 `pnpm install --prod --ignore-scripts`
- `node_modules/`、构建缓存不入库；`vendor/`（如 PowerShell Editor Services）随库分发
- 修改插件前请参考各插件 README 与 CHANGELOG 的构建说明
