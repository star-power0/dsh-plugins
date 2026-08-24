# DSH ide-layout 0.4.0 改造：跨会话串联分析与任务完成度

- **日期**：2026-08-20
- **涉及会话**：
  - 会话一（IDE 改造工程）：`dsh-session-session-d7215368-ef8a-4419-b4c7-41d737fca209`（白天）
  - 会话二（排查桌面端打不开 + 修复）：`886aa10d-15d4-48ce-8b97-eb1be3b3e052`（当晚 21:41–22:20）
- **涉及插件**：`dsh-ide-layout`（0.3.0 → 0.4.0）、`dsh-better-sidebar`（停用）

---

## 一、会话一：IDE 插件改造（白天，d7215368）

### 用户需求（会话最后一条长消息，8 项）

1. 布局要 **左侧文件树 + 右侧对话**（不要 better-sidebar 的右侧栏），参考开源项目 `myzane678/dsh-ide-layout` 最新版
2. 代码跳转：Ctrl+点击跳转定义/声明（类 VS Code）
3. 问「LSP 补全代码」是不是 AI 补全
4. 插件功能跟编辑器差距太大，要「成熟」
5. 最简单的 **MD 文档渲染** 都没有
6. **图片 / PDF 等二进制打不开**
7. 浏览器能否在旁边打开
8. 参考 `myzane678/dsh-ide-layout` 精华 + 联网搜索资料

### 助手执行过程（关键节点）

| 阶段 | 内容 | 状态 |
|---|---|---|
| 现状分析 | 定位 `dsh-better-sidebar` + `dsh-ide-layout`，确认本地 0.3.0 只有语法高亮 + LSP 基础，无布局/跳转/终端/Git | ✅ |
| 根因定位 | 本地 ide-layout 的 `CODE_EXTENSIONS` 含 `md/markdown`，高优先级 viewer 抢走 MD，MD 变纯代码高亮；图片/PDF 本应走 better-sidebar viewer | ✅ |
| 上游调研 | 克隆 `myzane678/dsh-ide-layout`：三区布局（左树+中编辑+右对话）、`openFile(path, line?)` 带行号、`askAgent` 发代码给对话、F12/Ctrl+点击跳转定义、完整 LSP、GitPanel/TerminalPane | ✅ |
| 方案决策 | 采用 `myzane678/dsh-ide-suite` 的三区布局，取其精华优化，最后**只保留一个插件**；依赖加在 ide-layout 自身目录；双端部署；停用 better-sidebar | ✅ |
| 源码替换 | `myzane678/dsh-ide-layout` v0.2.0（24 文件）复制到本地 ide-layout，旧版备份 `.tmp/ide-layout-local-src-bak` | ✅ |
| inject 适配 | 上游 `['webServer','workspaceRegistry']` → 本地已验证的 `['webServer','sessions','webRuntime']`，根目录用会话 cwd 模型 | ✅ |
| workspaces 处理 | 上游 `src/client/index.ts` 中 `ctx.workspaces.list.getSnapshot()` 裸访问 → 计划改可选降级（**此为埋雷点，见下**） | ⚠️ 只计划未彻底验证 |
| PreviewPane | MD（marked）+ 图片 + PDF 预览；`fs-service.readBinary` + `GET /dsh-ide/media` 媒体路由；工具栏「预览」按钮切换 | ✅ |
| BrowserPane | 沙箱浏览器 tab（`sandbox`，拒绝 javascript:/data:/file:）| ✅ |
| package.json | 0.3.0 → 0.4.0，去 better-sidebar peer，加 xterm/node-pty/marked 依赖 | ✅ |
| 构建链 | pnpm install → typecheck ✅ → test（29/29）✅ → build（client.js 2.40MB）✅ | ✅ |
| 停用 better-sidebar | 双端 `cordis.patch.yml` insert 注释 + `package.json` link 移除 + 目录移入 `retired-plugins/` | ✅ |
| 体检 | `plugin-safety check` 全绿（15 插件双端一致） | ✅ |
| host 入口 | 补 `export const name = 'dsh-ide-layout'`，重新构建 | ✅ |
| **重启验证** | **「重启 Desktop 加载新版本」发出 Stop-Process 后，会话被中断（`TURN-END reason: interrupted`）** | ❌ 中断 |

### 会话一结论

- **代码改造 100% 完成**（目标/todo 中除「重启实测」外全部 completed）
- **唯一未完成项：「重启 Desktop 实测布局与功能」**——会话恰好停在这里被中断
- **埋下一个雷**：client 端 `ctx.workspaces` 裸访问未被彻底修复/验证

---

## 二、会话二：排查桌面端打不开 + 修复（当晚，886aa10d）

### 现象
用户 21:36 启动 DSH Desktop，进程存活但窗口不出现，多次重开无效。

### 排查过程
1. 排除 userData 损坏（A/B 测试新旧 userData 均能开窗）
2. 排除插件配置（21:22 改过的 cordis.patch.yml 恢复后依旧正常）
3. 定位到 `Failed to load plugins`：`dsh-ide-layout` 的 loader 无法 apply

```
failed to apply loader entry 8ce889af (dsh-ide-layout):
cannot get property "workspaces" without inject
```

4. 根因：`src/client/index.ts` 的 `ctx.workspaces` 裸访问，`inject` 只声明 `['sessions']`；Cordis 注入代理对未声明属性**直接抛错**，`?.` 挡不住 getter 抛错 → loader apply 失败 → 插件加载失败 → Desktop boot 卡住、无窗口

### 修复
- 新增 `optionalService` helper（`ctx.reflect.get` + try/catch 探测）
- 替换 `src/client/index.ts` 两处 `ctx.workspaces` 裸访问
- typecheck + tsdown 构建成功，产物 `lib/client.js` 无裸访问
- 排查其余插件无同类隐患
- 重启 Desktop 验证：窗口正常出现，插件加载成功

### 附带发现
`ELECTRON_RUN_AS_NODE=1` 环境变量会让 exe 秒退无窗口（来自 VS Code 进程链注入，双击启动不受影响）——白天会话重启前已注意清理此变量。

---

## 三、两会话串联关系（崩溃因果链）

```
白天会话（d7215368）改造 ide-layout → 0.4.0
        │
        ├─ 完成：布局/预览/浏览器/构建/体检（todo 9/10 completed）
        ├─ 遗留：client 端 ctx.workspaces 裸访问（上游代码带入，助手只计划改可选降级、未彻底修复验证）
        └─ 中断：重启 Desktop 时会话 interrupted
                 │
                 ▼
        Desktop 重启 → dsh-ide-layout loader apply 失败
        → "cannot get property workspaces without inject"
        → 插件加载失败 → Desktop 进程在、窗口不出现（21:36）
                 │
                 ▼
晚上会话（886aa10d）排查 → 定位 workspaces 注入问题 → 修复
→ 重建 lib/client.js → 重启 Desktop 验证通过 → 桌面恢复
```

**一句话**：白天改造工程本身完成度很高，但因 `ctx.workspaces` 注入 bug 未根治，重启时把 Desktop 搞崩；当晚会话修复后才真正可用。

---

## 四、用户需求逐条对照（当前状态）

| # | 需求 | 状态 | 依据 |
|---|---|---|---|
| 1 | 左文件树 + 右对话布局 | ✅ 已实现 | mount.tsx 注入原生左侧栏；CUSTOM-PLUGINS.md 已更新 |
| 2 | Ctrl+点击跳转定义 | ✅ 已实现 | EditorPane `textDocument/definition`（F12/Ctrl+点击） |
| 3 | LSP 补全是什么 | ✅ 已解答 | LSP 是**语义级补全协议**（Language Server Protocol），非 AI 补全；CodeMirror + LSP client 提供 |
| 4 | 成熟编辑器 | ✅ 大幅增强 | 跳转/hover/重命名/格式化/快速修复/blame/终端/Git/askAgent |
| 5 | MD 渲染 | ✅ 已实现 | PreviewPane + marked，工具栏「预览」切换 |
| 6 | 图片/PDF 预览 | ✅ 已实现 | PreviewPane + readBinary + media 路由 |
| 7 | 浏览器打开 | ✅ 已实现 | BrowserPane 沙箱 iframe |
| 8 | 参考上游项目精华 | ✅ 已采用 | 同步 `myzane678/dsh-ide-layout` v0.2.0 + 本地增强 |

**崩溃情况**：1 次——改造后重启 Desktop 因 workspaces 注入 bug 打不开（21:36），当晚已修复。

---

## 五、当前磁盘状态（2026-08-20 晚核实）

- ✅ `dsh-ide-layout`：package.json **0.4.0**，采用 `myzane678/dsh-ide-layout` v0.2.0 的 src 结构（client/core/host + layout.ts/mount.tsx），PreviewPane.tsx + BrowserPane.tsx 就位
- ✅ `src/client/index.ts`：workspaces 已用 `optionalService` 包裹（0 处裸 `ctx.workspaces`）
- ✅ `lib/client.js`：22:13 修复后构建产物
- ✅ `dsh-better-sidebar`：已移入 `retired-plugins/`
- ✅ 双端 `cordis.patch.yml`：better-sidebar insert 已注释（含恢复说明）
- ✅ 双端 `package.json`：better-sidebar link 依赖已移除
- ✅ `plugin-safety check`：15 插件双端一致
- ✅ DSH Desktop：运行中，5 进程，主窗口正常

---

## 六、遗留事项（建议下一步）

1. **实测新布局/新功能**：三区布局（左树+中编辑+右对话）、MD 渲染、图片/PDF 预览、浏览器 tab、代码跳转——这些**尚未在真实实例逐项点击验证**（白天会话被中断在重启前）。建议打开 Desktop 实测一轮并截图确认。
2. **LSP 补全范围**：改造后 LSP 支持语言范围以 `myzane678/dsh-ide-layout` 为准（需实测确认 JS/TS 等），用户问过「是不是 AI 补全」——不是，是 LSP 语义补全。
3. **文档一致性**：本项目 CUSTOM-PLUGINS.md 与 ide-layout CHANGELOG.md 已补 0.4.0 记录；若后续实测发现问题需回滚，用插件目录 `.tmp/ide-layout-local-src-bak`。

---

## 七、会话三：workspace 兜底根因与修复（2026-08-21 上午）

### 现象

会话二修复后，文件树仍**偶发**报错「path is not inside a live session workspace」——丞相反馈「短暂出现过一阵子好的，结果又没了」。

### 排查过程

1. **对比上游项目**（`myzane678/dsh-ide-layout` HEAD `0296633`）：该项目 `inject = ['webServer', 'workspaceRegistry']` 直接注入 workspaceRegistry，gate 用 `ctx.workspaceRegistry.list()` 校验。
2. **初判本地无 workspaceRegistry 服务**（推理，被实测推翻）：
   - app.asar 主进程 JS 里 `workspaceRegistry` 字符串 0 次
   - 全 `@deepseek-ai` 包只有 `dsh-client-runtime`（浏览器端）provide `"workspaces"`
   - `dsh-host-apiproxy` 只 import dsh-workspace 的类型/schema/错误类，不实例化 WorkspaceRegistry
3. **实测（gate 临时日志写 `dsh-home/.tmp/ide-gate-debug.log`）一锤定音**：
   - `wr=true` —— host 端 workspaceRegistry 服务**确实存在**（`ctx.get` 能拿到）
   - `live=0` —— `sessions.list()` 纯内存 store 为空
   - `candidate=A:\ClaudeWorkspace`、`realpath=A:\ClaudeWorkspace match=true` —— `list()` 与路径匹配都正常

### 根因（三连环）

1. **属性访问抛错**：`optionalService` 用 `(ctx as unknown as Record<string,T>)[key]` 访问**未声明进 inject** 的服务 → cordis 注入代理**直接抛错**（同会话二 Desktop 崩溃机制）→ 被 try/catch 吞掉 → 恒返回 `undefined` → workspace 兜底从未生效。
2. **服务就绪时序**：即使改用 `ctx.get()`，若在 `apply()` 时一次性探测并**闭包缓存**，服务 fiber 尚未 active 时拿到 `undefined` 且永不再试。
3. **sessions 为空**：`sessions.list()` 是纯内存 SessionStore，无 live session 时为空 → session cwd 匹配失败。

「短暂好过又没了」= 当时恰好有 live session 的 cwd 匹配；session 列表变化后兜底没接住。

### 修复（`src/index.ts`）

- `optionalService` 改用 cordis 官方**无 inject 读取** `ctx.get(key)`（reflection 层直接读服务 store，未提供返回 `undefined` 不抛错）。
- workspace 兜底改为**每次 gate 调用时动态探测**（不再闭包缓存），服务后挂载也能命中。
- 验证：typecheck → build → 重启 Desktop → OCR 截图确认文件树渲染出 `A:\ClaudeWorkspace` 真实目录树（`ClaudeWorkspace` / `.Claude` / `Codex` / `.aWS-article`），无报错。
- 清理临时日志代码后重建重启，文件树依旧正常。

### 与上游方案的差异

上游 `inject ['webServer', 'workspaceRegistry']` 依赖该服务在宿主 profile **稳定存在**；本地改用 `ctx.get` + 动态探测更稳——服务存在即用，不存在不崩，也不依赖 inject 声明（避免某些 profile 缺服务时 apply 失败）。

### 当前磁盘状态（2026-08-21 上午核实）

- ✅ `lib/index.js` / `lib/client.js`：workspace 兜底修复构建产物（`ctx.get` + 动态探测）
- ✅ `dsh-home/.tmp/`：临时调试日志已清
- ✅ DSH Desktop：运行中，文件树正常显示工作区目录

### 遗留事项更新

- ✅ **文件树已实测**：本次修复后左侧文件树正常渲染 A:\ClaudeWorkspace 目录树
- ⏳ **其余新功能实测**：MD 渲染 / 图片 / PDF / 浏览器 tab / 代码跳转——仍建议逐项点验
- ⏳ **LSP 补全范围**：改造后支持语言以 `myzane678/dsh-ide-layout` 为准，需实测确认

### 会话四：二进制预览与对话栏收尾（2026-08-21）

- 图片/PDF 原先把 `/dsh-ide/media` 直接交给 `<img>` / `<iframe>`；在 Desktop 的 `file://` 承载下，Markdown 的 fetch 链路正常而原生媒体资源请求不稳定，表现为图片空白、PDF只显示内置 viewer 外壳。
- `PreviewPane` 改为先 fetch 媒体响应，再创建 Blob URL；加入加载中和错误提示，统一走 Desktop 已验证的 fetch 桥。
- 右侧对话区底部统计栏被 Aqua 的固定底部 fade 覆盖；`dsh-client-ui-aqua` 隐藏 bottom fade，保留顶部 fade。
### 会话五：PDF.js 渲染与统计栏完整显示（2026-08-21）

- 内置 Chromium PDF viewer 在 Desktop 的 `file://` + Blob iframe 承载下只显示空壳，改用 `pdfjs-dist` 直接渲染 PDF 页面到 canvas；worker 代码内联进 ide-layout 客户端 bundle，避免额外 worker URL 和 file:// 限制。
- `PreviewPane` 通过 `/dsh-ide/media` 读取二进制，PDF.js 实测真实 `百年孤独_前10页.pdf` 生成 10 张可见 canvas（约 453×587），无 iframe、无 PDF 错误提示、无控制台错误。
- Aqua 统计栏覆盖宿主 `white-space: nowrap`、`text-overflow: ellipsis`、`overflow: hidden`，改为允许换行；真实 Desktop 中完整显示“轮数、步数、LLM、工具调用、首 token、token 速率、缓存命中、输入/输出 token”。
- 进一步定位到右侧对话区本身的横向裁剪：ide-layout 打开编辑器后将 centerCol 挤窄，而 Aqua 的输入栏/统计栏仍使用 `calc(var(--dsh-chat-content-width) + 32px)` 且取消最大宽度，导致约 496px 对话列中实际宽度达到 780px，右侧约 48px 被宿主 `overflow:hidden` 截掉。修复为 `min(..., 100%)` + `max-width: 100%` + `box-sizing: border-box`，窄列实测输入栏收缩至约 488px，统计栏完整换行且无横向溢出。
- ide-layout `typecheck`、`test`（24/24）、`build` 全部通过；客户端 bundle 约 5.20 MB。Aqua 独立构建仍受历史缺失 workspace 依赖阻断，因此同步修改源码与当前 `lib/client.js` runtime bundle。

### 会话六：对话区容器横向裁剪修正（2026-08-21）

- 根因不是单纯统计文字的 ellipsis，也不是 PDF 预览：`dsh-ide-layout/src/client/layout.ts:290-315` 通过 `centerCol` 的 `margin-left` 为编辑器让出空间后，聊天列变窄；Aqua 两个玻璃规则仍以 `--dsh-chat-content-width + 32px` 且 `max-width: none` 渲染输入栏和统计栏，实际宽度超过 composer/centerCol，宿主 `overflow: hidden` 将右侧控件直接裁掉。
- 修改 `dsh-client-ui-aqua/src/client/aqua.module.css` 与当前 Desktop runtime bundle：输入栏和非 fused 统计栏改用 `width: min(calc(var(--dsh-chat-content-width) + 32px), 100%)`、`max-width: 100%`、`box-sizing: border-box`；保留统计栏换行规则。
- 真实 Desktop 打开 PDF 使编辑器再次挤压聊天列后，右侧对话列约 496px，输入栏约 488px，统计栏自动变为两行，所有元素右边界落在 composer 内，无新增控制台错误（仅既有字体 OTS warning）。

### 会话七：移除无效内嵌浏览器（2026-08-21）

- 用户实测 IDE 的浏览器标签打开 Bing 后只有空白内容，确认原因不是地址栏或 Desktop 网络故障，而是实现采用普通 sandbox iframe；Bing 等站点通过 `X-Frame-Options` / CSP `frame-ancestors` 拒绝被嵌入。
- 旧版 `dsh-better-sidebar` 曾有 `browser.probe` 诊断和“在系统浏览器中打开”兜底，但 `dsh-ide-layout` 未迁移这套链路；继续保留 iframe 只会产生不可靠的空白页面，改成无沙箱也会扩大网页对 DSH 会话数据的访问风险。
- 按用户判断移除 dsh-ide-layout 的浏览器工具栏入口、浏览器 tab 状态和 `BrowserPane` 渲染分支；文件编辑、终端、Markdown/图片/PDF 预览及右侧对话布局不变。
- Desktop 重载后文件树和编辑器正常，工具栏保留“预览、保存、终端、关闭编辑区”，控制台无新增错误；`pnpm typecheck`、`pnpm test`（24/24）、`pnpm build` 全部通过。
