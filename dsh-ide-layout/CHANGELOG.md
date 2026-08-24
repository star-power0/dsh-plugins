## 2026-08-23 - 编码选择与 Java / Rust LSP 支持

### Added

- **编码选择**：状态栏新增编码切换按钮（UTF-8 / 自动检测 / GB18030 / GBK / Big5 / UTF-16 LE / ISO-8859-1），切换时以新编码重新加载文件，解决中文旧文件（记事本 ANSI = GBK）乱码问题。host 侧用 iconv-lite 解码/编码，`auto` 先做严格 UTF-8 校验，再试 GB18030，最后 UTF-8 保底；保存时按当前编码写回。
- **Java LSP**：Eclipse JDTLS 本机发现（`DSH_JAVA_LS_HOME` → `~/.eclipse/jdtls` → PATH），支持补全/诊断/跳转/重命名/格式化；未找到自动降级纯高亮。
- **Rust LSP**：rust-analyzer 本机发现（`DSH_RUST_LS_HOME` → `~/.cargo/bin` → PATH），支持补全/诊断/跳转/重命名/格式化；未找到自动降级纯高亮。
- **LSP 懒加载（2026-08-23，多窗口资源优化）**：LSP 服务器不再在编辑器面板挂载时全量 `connect()`（原来 5 个语言服务器每个窗口一启动就连，即使从没打开文件），改为 `LspClient.openDocument()` 在**第一个文件真正打开时**才 `start()` 对应语言的服务器（幂等；`initialize()` 会重放已登记文档，打开即用）。会话视图窗口（只看对话、不编辑文件）不再派生任何语言服务器进程——每个新窗口省下约 750MB 的 LSP 进程开销，多窗口更省资源。
- **LSP 资源池 + 自动回收（2026-08-23，多窗口编辑也不卡）**：`host/lsp-service.ts` 把 LSP 连接从「硬上限 8、超限直接拒绝」改成**有界进程池**：`LSP_MAX_CONNECTIONS = 4`，池满时新连接**回收「最久未活动」的连接（LRU，`evictBridge`）**，把语言服务器让给正在使用的窗口；被回收窗口的服务器进程被杀掉、socket 关闭（1013），客户端按现有指数退避（0.5s→4s）稍后自动重连，活动窗口的 LSP 始终保留。多窗口同时看/编辑文件时，语言服务器进程总数被钉在 4 个以内，不再随窗口数翻倍。

### Changed

- `core/encoding.ts` + `host/encoding.ts`：新增文本编解码模块（参考 dsh-ide-suite，单包副本）。
- `host/fs-service.ts`：`read()` / `write()` 支持 encoding 参数，返回实际解码编码。
- `host/lsp-service.ts`：SERVER_LAUNCHERS 新增 `java` / `rust` 启动器（可空 = 本机不可用）。
- `core/types.ts`：`languageIdForPath` 新增 java / rust；FileRead 加 encoding 字段。
- `EditorPane.tsx`：LSP 客户端从 3 个扩展到 5 个（加 javaLsp / rustLsp 分槽），状态栏按当前文件语言对应服务器显示状态。
- `client/lsp-client.ts`：新增幂等 `start()`；`openDocument()` 首用触发懒连接。
- `EditorPane.tsx`：移除挂载时 `ts/py/ps/java/rust.connect()`，状态初始为「未连接」。
- `host/lsp-service.ts`：LSP 连接改为有界资源池（`activeBridges` LRU 回收，cap 8→4）；Bridge 记录 `lastActive`；被回收连接标记 `evicted` 由池清理，不重复 kill。

### Verification

- `pnpm typecheck` 通过。
- `pnpm test` 通过（3 个测试文件，24 个测试）。
- `pnpm build` 通过。

## 2026-08-22 - 资源管理器原生侧栏完整隔离

### Fixed

- 资源管理器打开时隐藏整个原生侧栏的绘制与交互，仅保留其几何占位，避免工作区标题、工具栏、目录、会话列表和分隔线从插件文件树周围残留。
- 插件资源管理器继续使用独立覆盖层显示，不受原生侧栏隐藏规则影响。
- 资源管理器关闭或插件卸载时自动移除状态标记，原生侧栏完整恢复显示与交互。

### Verification

- `pnpm typecheck`、`pnpm test`（3 个测试文件，24 个测试）、`pnpm build` 通过。
- PSES v4.7.0 vendor 已部署并通过真实 `initialize` LSP 握手。
- Desktop 调试端口 `9333` 未监听，真实界面验收尚未执行。

## 2026-08-22 - 资源管理器原生内容区隔离

### Fixed

- 资源管理器打开时，仅收起原生侧栏的 `regionArea` 内容区，避免工作区标题、目录与会话列表残留在插件文件树下方。
- 保留原生侧栏外框及底部区域的尺寸，避免影响插件资源管理器的覆盖宽度和关闭后的侧栏恢复。
- 资源管理器关闭或插件卸载时自动移除状态标记，原生内容区立即恢复显示与交互。

### Verification

- `pnpm typecheck`、`pnpm test`（3 个测试文件，24 个测试）、`pnpm build` 通过。
- Desktop 调试端口 `9333` 未监听，真实界面验收尚未执行。

## 2026-08-22 - 非 Aqua 侧栏遮挡修正

### Fixed

- 资源管理器展开时，非 Aqua 模式改用不透明的原生第一层背景，避免底层工作区与会话列表文字穿透面板并与文件树重叠。

### Verification

- `pnpm typecheck`、`pnpm test`（3 个测试文件，24 个测试）、`pnpm build` 通过。
- `plugin-safety check` 通过（15 个插件全部正常）。
- Desktop 调试端口 `9333` 未监听，尚未将交互验收标记为通过。

## 2026-08-22 - 窄轨入口节奏校正

### Changed

- 收起侧边栏时，资源管理器入口补齐与原生轨道一致的下方 12px 间距，使其与添加工作区、搜索会话三项形成等距纵向节奏。
- 窄轨入口改用原生主标签色；资源管理器图标线宽由 1.15 提升到 1.35，匹配相邻深色图标的视觉重量。

### Fixed

- 修复资源管理器入口与添加工作区距离过大、与搜索会话距离过近的视觉不均衡。
- 修复入口图标颜色偏灰、轮廓偏细而显得比原生轨道图标更轻的问题。

### Verification

- `pnpm typecheck` 通过。
- `pnpm test` 通过（3 个测试文件，24 个测试）。
- `pnpm build` 通过（仅保留 tsdown 的弃用提示）。
- `plugin-safety check` 通过（15 个插件全部正常）。
- Desktop CDP 真实验收：窄轨的添加工作区、资源管理器、搜索会话均为约 36px；添加工作区至资源管理器、资源管理器至搜索会话的间距均为约 12px，三者均使用主色，入口 SVG 为 18px。

## 2026-08-22 - 资源管理器入口视觉对齐

### Changed

- 宽侧栏入口从固定宽度的原生双按钮容器移至同级工具栏流，确保不会被裁切，并保留原生搜索、视图选项和添加工作区的间距节奏。
- 收起态入口由文件夹改为资源管理器栏位图标，与“工作区”文件夹语义区分；颜色改与原生轨道主图标一致。

### Fixed

- 修复宽侧边栏下资源管理器入口已渲染但被原生 `headerActions` 容器裁切、视觉上缺失的问题。
- 修复窄轨入口与原生图标颜色层级不一致、文件夹图标语义重复的问题。

### Verification

- `pnpm typecheck` 通过。
- `pnpm test` 通过（3 个测试文件，24 个测试）。
- `pnpm build` 通过（仅保留 tsdown 的弃用提示）。
- Desktop CDP 真实验收：宽栏入口显示为 28px 同级工具栏按钮；窄轨入口为 36px，位于添加工作区与搜索之间，分别保持 12px 与 0px 的原生流式相邻边界。

## 2026-08-22 - 原生侧栏入口与收起边界修正

### Changed

- 资源管理器入口改为渲染进 Harness 原生工作区工具栏：宽栏跟随「添加工作区 / 视图选项」按钮组，窄轨插入「添加工作区」与「搜索」之间，不再使用插件浮层坐标。
- 入口尺寸、圆角、间距完全继承原生轨道节奏：宽栏 28px、窄轨 36px、圆角 8px。
- 编辑器、资源管理器覆盖层的起点改按原生侧栏真实右边界计算，而不是只取侧栏内容宽度。

### Fixed

- 修复宽栏中资源管理器入口漂在「工作区」文字旁、与原生操作按钮不成组的问题。
- 修复窄轨中资源管理器入口与「添加工作区」图标重叠的问题。
- 修复收起原生侧边栏后编辑器左边框侵入卡片内侧 11px、造成双线重叠的问题。

### Verification

- `pnpm typecheck` 通过。
- `pnpm test` 通过（3 个测试文件，24 个测试）。
- `pnpm build` 通过（仅保留 tsdown 的弃用提示）。
- `plugin-safety check` 通过（15 个插件全部正常）。
- Desktop 通过 CDP 真实验收：宽栏入口与原生按钮同行排列；窄轨入口位于添加工作区和搜索之间，未重叠；打开文件后，收起态原生侧栏右缘、覆盖层右缘与编辑器起点均为同一边界，只有正常 1px 分隔线。

## 2026-08-22 - 资源管理器入口与下拉菜单细节修正

### Changed

- 收起资源管理器后，入口按原生侧栏的 28px 宽栏 / 36px 窄轨图标节奏定位，移除独立边框和浮动底色，避免遮挡原生工作区图标。
- 打开资源管理器后标题栏提供返回对话入口，关闭面板即可恢复工作区与会话列表。
- 文件树标题栏增加一键折叠全部子目录的操作，保留根目录并清除多层展开状态。
- Aqua 主题下原生权限选择菜单改用不透字的 DSH 菜单表面令牌，与模型和工作区下拉菜单保持一致。

### Fixed

- 修复资源管理器入口与原生侧栏图标轨道错位、间距不一致及外层按钮外壳突兀的问题。
- 修复打开资源管理器后缺少返回对话路径的问题。
- 修复权限下拉菜单透明导致壁纸文字穿透、阅读困难的问题。

### Verification

- `pnpm typecheck` 通过。
- `pnpm test` 通过（3 个测试文件，24 个测试）。
- `pnpm build` 通过（仅保留 tsdown 的弃用提示）。
- `plugin-safety check` 通过（15 个插件全部正常）。
- Desktop 重启后主窗口正常响应。
- Web 端验收未执行：`start-dsh.cmd` 在当前环境中立即退出，3080 未监听；未将其误报为通过。


- 收起后只保留紧凑文件夹图标入口，原生工作区、会话列表和设置区恢复完整可用，不再残留半截资源管理器或白色矩形。
- 打开资源管理器时以原生侧栏宽度为基准并保留最小宽度，文件、问题和 Git 视图集中在同一面板内；关闭状态保留面板开关记忆。
- 面板打开态继续使用 DSH/Aqua 主题表面，关闭态透明穿透宿主壁纸和原生侧栏交互。

### Fixed

- 修复资源管理器与会话区同时显示造成的拥挤，以及原生侧栏收窄后文件树被压成残片的问题。


### Changed

- 资源管理器和编辑器表面改为跟随 DSH/Aqua 主题令牌，移除插件层的实心白色背景，允许壁纸在工作区、文件树和 Markdown/源码区域连续透出。
- 资源管理器收起后不再保留白色矩形；编辑器标签、终端和预览区域统一使用透明或半透明主题表面。
- 文件树、资源管理器按钮和编辑器工具栏改用统一的细线图标，替换与 Harness 原生控件不一致的 emoji glyph。
- 统一补齐 IDE 自定义边框、强调色、悬停色和标签表面到 DSH 主题变量，并修正资源管理器展开高度下限为 180px。

### Fixed

- 修复 Aqua 壁纸模式下资源管理器、代码区和 Markdown 预览出现突兀白块的问题。

## 2026-08-21 - 资源管理器收起与高度控制

### Added

- 资源管理器标题栏增加紧凑的一键收起/展开按钮；收起后保留标题栏，不占用上方工作区和会话列表空间。
- 记忆资源管理器的收起状态，并保留文件树高度调整能力。

## 2026-08-21 - 文件树拖放路径引用

### Added

- 文件树中的文件和目录可拖入对话输入框；文件写入 `@相对路径`，目录写入 `@相对路径/`，复用现有工作区引用校验。

## 2026-08-21 - 跳转反馈与窄栏权限图标

### Fixed

- 最窄对话栏不再隐藏访问权限控件，保留可点击的权限图标并收紧占用宽度。
- 修复 Ctrl/Cmd+点击跳转使用当前光标而非鼠标落点的问题；跳转前给源符号加点划线提示，跳转后滚动到目标范围并短暂高亮、选中目标符号。

## 2026-08-21 - 移除无效内嵌浏览器

### Removed

- 移除 IDE 工具栏和编辑器标签中的沙箱浏览器入口。该实现依赖 iframe，Bing 等站点通过 X-Frame-Options / CSP 拒绝嵌入时只会显示空白页面，无法提供可靠的浏览体验；需要浏览网页时使用系统浏览器或 DSH 自带终端。


### Fixed

- **PDF 预览**：移除对 Electron 内置 PDF viewer 的依赖，改用内置 PDF.js 将真实 PDF 页面渲染到 canvas；Desktop 实测 10 页均生成可见画布，无 iframe 空白和控制台错误。
- **依赖声明**：将 `pdfjs-dist` 加入 ide-layout 直接依赖并同步锁文件，worker 代码随客户端 bundle 内联。


### Fixed

- **文件树偶发报错**（`path is not inside a live session workspace`）：workspace 兜底从未生效——`optionalService` 用属性访问读未声明进 inject 的服务时 cordis 抛错被吞；且服务在 `apply()` 时一次性探测有就绪时序问题。改为 cordis 官方无 inject 读取 `ctx.get()` + 每次 gate 调用动态探测，`workspaceRegistry.list()` 兜底命中注册工作区（根因排查见 [`docs/architecture-and-incidents.md`](./docs/architecture-and-incidents.md) 第七节）。
- **图片/PDF 预览**：改为先通过 `/dsh-ide/media` fetch 二进制，再用 Blob URL 交给 `<img>` / PDF viewer；补充加载中和失败状态，兼容 Desktop 的 file:// 承载。

### Removed

- **「▶ 运行」**：编辑器工具栏运行脚本入口 + host `/dsh-ide/run` 路由 + 输出面板。DSH 自带终端已覆盖该场景。
- **「○ Blame」**：GitLens 式行内 blame（gutter / 悬停浮层 / 状态栏） + host `/dsh-ide/git/blame` 路由 + git 侧 `blame` / `parseBlamePorcelain` / `findRepoRootForFile` + `tests/blame.test.ts`。

## 2026-08-20 - 0.4.0

### Added

- **独立三区布局**：移植 `myzane678/dsh-ide-layout` v0.2.0（commit 见 CUSTOM-PLUGINS.md）的独立 shell——左侧文件树注入 DSH 原生左侧栏（工作区+树同栏）、中间 CodeMirror 编辑器 workbench、右侧 agent 对话（centerCol 右挤 + 拖拽手柄）。本插件不再依赖 `dsh-better-sidebar` 右侧栏。
- **文件树**：`bindRoot` 跟随活动会话 cwd（`sessions` 优先，`workspaces` 可选降级）；fs 变更 SSE 订阅 + 400ms 防抖刷新；`openFile(path, line?)` 支持带行号打开。
- **编辑器增强**：跳转定义（F12 / Ctrl+点击 → `textDocument/definition`）、hover 悬停、F2 重命名、格式化、快速修复、GitLens 式 blame、askAgent（选中代码 → 追加到对话输入框）、ProblemsPanel / GitPanel / TerminalPane。
- **PreviewPane（viewer 分发）**：Markdown 渲染（marked，工具栏「预览」按钮切换编辑/预览）、图片（png/jpg/jpeg/gif/webp/svg）、PDF 预览；配套 `fs-service.readBinary` + `GET /dsh-ide/media` 媒体路由（浏览器 img/iframe 用）。
- **BrowserPane**：沙箱浏览器 tab（`sandbox="allow-scripts allow-same-origin"`），工具栏「🌐 浏览器」按钮。
- host 入口补 `export const name = 'dsh-ide-layout'`（cordis 以包名识别实例）。

### Changed

- 源码替换为 `myzane678/dsh-ide-layout` v0.2.0 结构（`src/client/{layout.ts,mount.tsx,EditorPane.tsx,FileTree.tsx,...}`），本地旧版备份在 `.tmp/ide-layout-local-src-bak`。
- host inject 适配为已验证的 `['webServer', 'sessions', 'webRuntime']`（上游用 `workspaceRegistry`，本 DSH 运行时用会话 cwd 模型）。
- `dsh-better-sidebar` peer 依赖移除；新增运行时依赖（xterm、node-pty、marked 等，见 package.json）。
- 停用 `dsh-better-sidebar`：插件目录移入 `dsh-home/retired-plugins/`，Web/Desktop 双端 `cordis.patch.yml` insert 注释 + `package.json` link 依赖移除（保留恢复说明）。

### Fixed

- **`cannot get property "workspaces" without inject`（桌面端打不开）**：上游 `src/client/index.ts` 的 `ctx.workspaces` 裸访问在 inject 只声明 `sessions` 时被 Cordis 注入代理直接抛错。用 `optionalService`（`ctx.reflect.get` + try/catch）包裹两处 workspaces 访问，可选降级为 `undefined`（2026-08-20 晚 `886aa10d` 会话修复，构建产物 `lib/client.js` 22:13 重建）。

### Verification

- `pnpm typecheck`、`pnpm test`（29/29）、`pnpm build`（client.js 2.40MB 含 marked）全绿。
- `plugin-safety check` 全绿：15 个插件双端一致（better-sidebar 移出后）。
- 注意：白天会话在「重启 Desktop 实测布局与功能」一步被中断，三区布局/MD 渲染/图片 PDF 预览/浏览器 tab 的实际渲染尚未在真实实例逐项实测；workspaces 修复后 Desktop 已恢复并可正常打开。

## 2026-08-19 - 0.3.0

### Added

- 语法高亮从 12 种扩展到 23 种：新增 Markdown / HTML / CSS / YAML / XML / SQL / Java / C/C++ / Rust / Go / PHP / Vue / SCSS / LESS / TOML / Batch（.cmd/.bat）/ PowerShell / Shell（移植自 `myzane678/dsh-ide-layout` v0.1.0，MIT）。
- 自写 batch/cmd StreamParser（`src/client/batch-mode.ts`），覆盖注释、@ 指令、命令关键字、%变量%、双引号字符串与标签。
- 高对比 IDE 高亮样式（`ideHighlight`）：关键字深蓝加粗 / 注释绿斜体 / 字符串深红 / 数字深绿，含 Markdown 标题/强调/链接/引用/删除线配色；颜色由 `--ide-hl-*` CSS 变量承载，可随皮肤覆盖。
- 编辑器字号缩放：Ctrl/Cmd + 滚轮（9–24px），localStorage 记忆（`dsh-ide-editor-font-size`），状态栏显示当前字号。
- viewer 接管扩展名从 12 种扩展到 40+（覆盖全部 23 种语言的文件类型）。

### Changed

- `dsh-better-sidebar` peer 依赖从 `0.12.2` 升到 `^0.12.3`（与升级后的底座对齐）。
- `package.json` 新增 14 个 CodeMirror 语言包依赖（lang-markdown/html/css/yaml/xml/sql/java/cpp/rust/go/php/vue/sass/less + legacy-modes）。

### Security

- 保留扩展版安全模型不变：trust-fence、LSP policy、run policy、mtime+SHA-256 冲突检测、原子临时文件写入、符号链接拒绝、512 KiB 编辑器上限。

### Verification

- `pnpm typecheck`、`pnpm test`、`pnpm build` 全绿（见本次验证记录）。
- 底座 `dsh-better-sidebar` 同步升级到 v0.12.3（rc.6 兼容最新：皮肤令牌兼容、xterm 迁移、node-pty 懒加载、设置导航图标等）。
