# dsh-ide-layout

`dsh-ide-layout` 是 **DeepSeek Harness（DSH）** 的独立三区 IDE 插件，不依赖任何其他插件。

当前布局由本插件直接创建：

```text
DSH
├── 左侧：资源管理器（文件树 / Git / 问题）—— 覆盖原生侧栏，独立面板
├── 中间：CodeMirror 编辑器、Markdown/图片/PDF 预览、终端
└── 右侧：DSH 原生对话区（被挤压保留，原功能完整）
```

## 本地改动（Local modifications）

基于上游 v0.2.0 本地迭代至 0.4.0，主要改动：

- **独立三区布局**：不依赖 `dsh-better-sidebar`，自建「左文件树 + 中编辑器/终端 + 右对话」布局控制器
- **23 种语法高亮**：含自写的 Batch/cmd StreamParser
- **编码选择**：状态栏切换 UTF-8 / 自动检测 / GB18030 / GBK / Big5 / UTF-16 LE / ISO-8859-1（host 侧 iconv-lite 编解码）
- **Java / Rust LSP**：JDTLS 与 rust-analyzer 本机发现（环境变量 → 常见安装路径 → PATH），未找到自动降级纯高亮
- **LSP 懒加载**：首次打开文件才派生语言服务器进程（不再启动即全连）
- **LSP 资源池**：语言服务器进程上限 4 个，池满 LRU 回收最久未活动连接
- **workspaces 可选降级**：部分 profile 不提供该服务时按会话 cwd 工作，不崩溃
- **信任栅栏**：loopback / Host / Origin / Sec-Fetch-Site 校验 + LSP 文档 URI 门禁

## 致谢 / Credits

本插件基于以下开源项目（按依赖深度排序）：

- **[myzane678/dsh-ide-suite](https://github.com/myzane678/dsh-ide-suite)**（MIT，作者：myzane678）—— 编辑器外壳架构（三区布局、CodeMirror 工作台、文件树、终端、Git/问题面板）、LSP WebSocket 桥（host URI 门禁 / loopback 校验）、PowerShell Editor Services vendor 分发模式。本插件从该项目 `dsh-ide-layout` v0.2.0 移植并独立迭代。
- **[omdsh-dev/dsh-web-ui](https://github.com/omdsh-dev/dsh-web-ui) / aionui-panel**（Apache-2.0）—— IDE 布局参考实现、路由层 JSON envelope（ok/error）风格。
- **[PowerShell Editor Services](https://github.com/PowerShell/PowerShellEditorServices) + [PSScriptAnalyzer](https://github.com/PowerShell/PowerShellEditorServices)**（MIT，vendor/ 随插件分发）—— PowerShell 语言服务器。
- **[CodeMirror 6](https://codemirror.net)**（MIT）—— 编辑器引擎。
- **[marked](https://github.com/markedjs/marked)**（MIT）—— Markdown 渲染。
- **[pdfjs-dist](https://github.com/mozilla/pdf.js)**（Apache-2.0）—— PDF 画布渲染。
- **[xterm.js](https://xtermjs.org)**（MIT）—— 浏览器终端。
- **[node-pty](https://github.com/microsoft/node-pty)**（MIT）—— PTY 子进程。
- **[pyright](https://github.com/microsoft/pyright)**（MIT）—— Python 语言服务器。
- **[typescript-language-server](https://github.com/typescript-language-server/typescript-language-server)**（MIT）—— TypeScript 语言服务器。
- **[iconv-lite](https://github.com/ashtuchkin/iconv-lite)**（MIT）—— 多编码（GBK/GB18030/Big5/UTF-16LE）编解码。

---

## 功能

### 三区布局

- 左：资源管理器面板（文件树 / Git / 问题）—— 覆盖原生侧栏的独立面板，**不修改 DSH 官方源码**
- 中：CodeMirror 编辑器 + Markdown 渲染 + 图片预览 + PDF 画布预览 + 终端
- 右：DSH 原生对话区（被挤压保留，原功能完整）
- 资源管理器入口**注入原生侧栏工具栏**（宽栏 28px 跟随「添加工作区」按钮组，窄轨 36px 插在添加工作区与搜索之间），继承原生轨道的尺寸、圆角、间距和颜色，**与原生图标视觉对齐**
- 打开资源管理器时原生侧栏整体隐藏（保留几何占位），文件树覆盖其上；关闭后原生侧栏立即恢复
- 编辑器左边界 = 原生侧栏右边界（ResizeObserver 实时跟踪），收起态不重叠、不双线

### IDE 代码 Viewer

- 接管 50+ 种文件扩展名（`.js` `.ts` `.tsx` `.jsx` `.py` `.java` `.rs` `.go` `.c` `.cpp` `.h` `.html` `.css` `.vue` `.scss` `.less` `.md` `.json` `.yaml` `.xml` `.sql` `.sh` `.ps1` `.cmd` `.bat` `.toml` `.php` `.svg` 等）
- 23 种语法高亮（含自写的 Batch/cmd StreamParser）
- 高对比 IDE 配色（`--ide-hl-*` CSS 变量承载，可随皮肤覆盖）
- CodeMirror 6：行号、代码折叠、编辑历史、bracket matching
- `Ctrl/Cmd+滚轮` 调整字号（9–24px，localStorage 记忆），状态栏显示当前字号
- `Ctrl/Cmd+S` 保存，带 `mtime + SHA-256` 版本校验，外部修改拒绝覆盖
- 超过 512 KiB、二进制、符号链接拒绝进入可写编辑器（截断文件只读，防尾部覆盖）

### Markdown / 图片 / PDF 预览

- Markdown：`marked`（GFM，raw HTML 关闭，脚本被丢弃），编辑器工具栏「预览」按钮切换编辑/预览，样式含标题边框、代码块、引用、表格、图片 max-width
- 图片：通过 `/dsh-ide/media` 拉二进制 → Blob URL → `<img>`，9 种格式（png/jpg/jpeg/gif/webp/bmp/ico/avif/svg）
- PDF：`pdfjs-dist` 将每页渲染到 `<canvas>`（不走 iframe，解决 X-Frame-Options 空白问题），10 页均生成可见画布

### 编码选择

- 状态栏编码按钮：UTF-8 / 自动检测 / GB18030 / GBK / Big5 / UTF-16 LE / ISO-8859-1
- 切换时以新编码重新加载文件（未保存修改先确认丢弃），解决中文旧文件（记事本 ANSI = GBK）乱码
- 保存按当前编码写回
- 自动检测：严格 UTF-8 校验 → GB18030 → UTF-8 保底

### LSP（语言服务）

- TypeScript：`typescript-language-server`
- Python：`pyright`
- PowerShell：PowerShell Editor Services 4.7.0（vendor/ 随插件分发，来源和 SHA-256 见 `vendor/VERSION.txt`）
- Java：Eclipse JDTLS，本机发现（`DSH_JAVA_LS_HOME` → `~/.eclipse/jdtls` → PATH），未找到自动降级纯高亮
- Rust：rust-analyzer，本机发现（`DSH_RUST_LS_HOME` → `~/.cargo/bin` → PATH），未找到自动降级纯高亮
- 支持：诊断波浪线、自动补全、hover 悬停、F12 / Ctrl+点击跳转定义（当前符号加**虚线下划线**，跳转后目标加**黄色高亮** 1.8s）、F2 重命名、Shift+Alt+F 格式化、快速修复（codeAction）
- 每个 root 同时维护 5 个语言服务器客户端，按当前文件类型选用；状态栏按 ts/py/ps/java/rust 分槽，互不污染
- Host 端校验：loopback / Host / Origin / `Sec-Fetch-Site` / workspace root URI / 文档 URI 工作区内 / 连接上限 8 / 帧上限 4 MB

### 终端、Git 和运行

- 终端：`xterm.js` + `node-pty`，WebSocket 连接，面板高度可拖拽（拖拽中直接改 DOM，不抖），右键菜单（复制/粘贴/清屏/重启），背景色跟随主题变量
- Git 面板：状态列表、暂存/取消暂存/放弃修改、inline diff、提交框（Ctrl+Enter 提交）、历史列表+点击展开 commit diff、嵌套仓库自动发现与切换，全走 host git 服务（`/dsh-ide/git/*`），不开 shell
- 问题面板：聚合全部打开文件的 LSP 诊断，点击跳回编辑器对应文件
- 文件树拖拽到对话输入框（文件写 `@相对路径`，目录写 `@相对路径/`），自动追加到当前会话草稿
- 选中代码右键 → 追加到对话输入框，由用户确认后发送

## 维护记录

独立三区架构迁移、`workspaces` 注入故障、预览修复和历史验证记录见 [`docs/architecture-and-incidents.md`](./docs/architecture-and-incidents.md)。

前置条件：目标 Profile 已安装本插件的运行依赖；Windows PowerShell LSP 还需要 `vendor/PowerShellEditorServices/` 与 `vendor/PSScriptAnalyzer/`（已打包在 vendor/ 内）。`dsh-better-sidebar` 不需要安装。Java 需要本机 JDTLS，Rust 需要本机 rust-analyzer（均未找到时降级纯高亮，不影响其他语言）。

推荐先构建，再以本地插件形式接入 Web 与 Desktop 两个 profile：

```powershell
pnpm install --ignore-scripts
pnpm test
pnpm typecheck
pnpm build
```

将构建后的插件目录放入 DSH 插件目录，并在两个 profile 中使用相同的 link 依赖和 patch 实例。patch 实例只登记一次，避免同时使用 bundle 自动挂载和手工 patch 造成重复加载。

建议实例：

```yaml
- insert:
    - id: ide-layout
      name: 'dsh-ide-layout'
```

修改 profile 前先执行 DSH 插件安全快照；修改后执行 `plugin-safety check`。Host 半区更新需要重启 DSH，Client 更新需要刷新页面。

## 开发

```powershell
pnpm install --ignore-scripts
pnpm test
pnpm typecheck
pnpm build
pnpm watch
```

构建产物：

- `lib/index.js`：会话范围文件 API 与 LSP WebSocket Host 半区
- `lib/client.js`：通过 DSH ModuleLoader 加载的浏览器半区

## 测试覆盖

当前回归测试覆盖：

- LSP workspace root 和外部 URI 拒绝
- 未打开文档请求拒绝
- 任意 JSON-RPC 方法拒绝
- 会话诊断隔离和清理
- loopback / Origin / cross-site 信任栅栏

## 已知限制

- Windows junction、reparse point 和并发替换仍需要目标环境专项测试；当前实现使用 canonical path、逐层符号链接拒绝和保存前后版本校验进行防御，但不宣称消除所有 TOCTOU 竞态。
- LSP server 依赖目标 profile 中可解析的 `typescript-language-server` 和 `pyright`。
- 当前 GUI 若存在其他插件启动错误，不能据此判断本插件挂载失败；应先查看 Host 启动日志和实际 bundle 清单。

## 许可证

[MIT](LICENSE)
