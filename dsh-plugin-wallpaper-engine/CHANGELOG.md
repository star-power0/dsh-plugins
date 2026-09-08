# Changelog

## 2026-09-08 - CSS 注释反引号导致 client.js 语法错误 / 全站插件加载失败修复

- 症状（丞相报告「dsh 打不开了，修坏了」）：web 3080 首页 HTTP 200 但整页白屏，仅 "Failed to load plugins"；控制台主错误 `Uncaught SyntaxError: Unexpected identifier '_modelList'`（定位 index-Dqw48FrP.js 内嵌的 wallpaper-engine bundle），连锁报 `bundle loaded without registering "dsh-plugin-wallpaper-engine" via __ModuleLoader__.load`，所有插件注册链全断。
- 根因：昨日「弹窗可读性修复」写入 CSS 注释时，`src/client.js` 1212-1213 行注释内使用了反引号包裹 `` `[class*=` `` 与 `` `"_modelList"]` ``，而该注释位于 `const CSS = \`...\`` 模板字符串内部——反引号提前终止模板字符串，其后内容变成裸 JS 代码产生语法错误；构建脚本不做语法校验，坏 bundle 直接上线。
- 修复：仅删除该注释内的两处反引号（注释语义不变）；`node scripts/build-client.mjs` 重建（58556 bytes），`verify-client.mjs` 通过，`new Function(bundle)` 解析校验 OK。
- 验证：重启 web 3080（stop-dsh.cmd → start-dsh.cmd），Chrome 无头实测——页面完整渲染（侧边栏会话树/输入框/模型选择器全部就位），SyntaxError 与 "Failed to load plugins" 消失，仅剩无害警告（Deprecated feature / form field id）。
- 教训：模板字符串内的注释严禁出现反引号；构建脚本建议后续加 `new Function` 冒烟校验。

## 2026-09-08 - 弹窗可读性精准修复（模型选择器 / Full access / 斜杠命令）

- 症状（丞相报告）：壁纸主题或 aqua 玻璃主题下，模型选择器弹窗、Full access（访问模式）弹窗、`/` 哔令菜单三个弹窗背景 45~55% 半透明，壁纸透过弹窗与黑色文字重叠，文字看不清。
- 栦因（chrome-devtools MCP @9223 + desktop-mode URL 参数实测）：三个弹窗背景同源——壁纸主题浅色 `rgba(255,255,255,0.55)`（45% 透入）、aqua 浗色 `rgba(255,255,255,0.45)`（55% 透入更严重）、aqua 淖色外层 `rgba(17,26,39,0.55)` 而内层 modelList menu 仍白 0.55（深色下白内层最怪）；叠加壁纸 scrim 极低暗化(0.05)，黑字糊掉。
- 修复（精准，只动这三个弹窗，不碰其他玻璃面）：在 client CSS 迫加两组规则（浅色 `rgba(255,255,255,0.94)` / 淖色 `rgba(22,26,34,0.94)`，均 `!important` + `backdrop-filter: blur(24px) saturate(1.4)` + inset 高光与投影，保留玻璃质感）。选择器用 CSS-module 语义后缀锚点（`_modelList` / `_sideTop_` / `_menu`），不依赖 hash 前缀，抗重建：模型选择器外层 `[role="dialog"]:has([class*="_modelList"])` + 内层 `[class*="_modelList"]`（双层）、Full access `[role="menu"][class*="_sideTop_"]`、斜杠命令 `[role="listbox"][class*="_menu"]`。
- 同步修复 aqua（壁纸未开时）：`dsh-client-ui-aqua/src/client/aqua.module.css` 末尾以 `[data-dsh-aqua]` 前缀加同款规则（含 `[data-dsh-aqua] body[data-ds-dark-theme]` 淖色分支）。
- 验证：两产物重建（`npm run build` / `node build.mjs`）；刷新页面后弄动加载新产物；弁纸主题津色下模型选择器 dialog+menu、Full access menu、`/` 哔令 listbox 计算背景均 0.94（截图确认清晰可读）；手动置 dark 属性实测拰色 0.94 生效；主界面其余玻璃效果未受影响。
- 备注：模型选择器 class 前缀（如 `CkKexa_`）随构建变化，故锚点只取语义后缀；aqua 在本环境未实际启用（`data-dsh-aqua=false`），其规则启用后自动生效。

## 2026-09-03 - 启动玻璃深浅不一致巡检修复 + 诊断落盘

- 症状（丞相报告 + 两张对比截图确认）：Desktop 重启后，深色模式下「新会话」按钮等玻璃表面呈**浅色**（`rgba(255,255,255,0.55)` 系），打开设置动一下任意滑条后立即恢复正确的深色玻璃（`rgba(16,21,29,0.55)` 系）；每次重启 100% 复现；换壁纸同样出现。Chrome（headless 与 headed、软件与 GPU 合成、含「启动时被遮挡再还原」模拟）均无法复现——错误仅存在于 Desktop Electron 的启动时序中。
- 机理：玻璃覆盖分深浅两套（`GLASS_SURFACES.light/dark`），`applyEffects()` 按 `body[data-ds-dark-theme]` 属性当场二选一以 `!important` 内联写入。错误态 = 某次 `applyEffects` 在主题属性未定型（读到无 dark 属性）的窗口内把 light 套钉进了内联，而此后的纠偏路径（MutationObserver 推回）在该场景下未生效。本次以「行为级兜底 + 现场取证」处理，未强行猜测观察者失效的确切原因：
  1. **巡检**：启动后 ~60s 内每 500ms 校验不变量「玻璃 token 值+`!important` 与 dark 属性所选套一致、`--we-*` 核心变量齐全」；发现矛盾立即 `applyEffects()` 纠正；60s 后自动停止，无常驻开销。`apply()` 挂层后也同步校验一次。
  2. **观察者增强**：`MutationObserver` 的 `attributeFilter` 从 `["style"]` 扩为 `["style", "data-ds-dark-theme"]`——主题属性翻转本身立即触发重算。
  3. **诊断落盘**：矛盾现场（dark 属性、html color-scheme、readyState、we-* 与玻璃 token 当前值、滑条输入值）POST 到新路由 `POST /wallpaper-engine/diag`，host 追加到 `storages/wallpaper_engine_diag.jsonl`（16KB/行、256KB 文件上限、纯 CSS 变量名/值无敏感内容）。根因实锤以该文件数据为准。
- 验证：`node --check` host 通过；`build-client.mjs` + `verify-client.mjs` 全绿；web 实例实测——人为写入 light 玻璃 `!important` 并删 `--we-blur`，观察者路径立即纠正（500ms 内恢复 dark 套与 17px）；诊断路由 `POST /diag` 手动与页内 fetch 均 204 + JSONL 落盘；`plugin-safety check` 全绿（19 插件双端一致）。

## 2026-09-03 - EMFILE 崩溃修复（Host 媒体流句柄泄漏）

- 症状：Desktop 主进程周期性弹出 `Uncaught Exception: Error: EMFILE: too many open files`，报错文件为 `E:\SteamLibrary\...\workshop\content\431960\<project>\*.mp4`；关掉 DSH 重开才恢复，已复发两次。
- 根因：host `lib/index.js` `serveFile()` 用 `createReadStream(absPath).pipe(res)` 流式服务壁纸视频/预览，但**没有监听流的 `error` 或响应的 `close`**：
  1. 客户端中断（切标签页/快速切换壁纸/视频 seek/取消）时 `res` 关闭，但底层文件句柄的读流不被销毁 → 句柄只增不减，累积到系统上限触发 EMFILE；
  2. `createReadStream` 打开失败（EMFILE 等）时 `error` 事件无监听，错误冒泡成 `uncaughtException` → 直接崩主进程（弹窗报错）。
- 修复：`serveFile()` 内改为受管流——`rs.on('error')` 兜底销毁响应（错误不再冒泡崩溃），`res.on('close')` 时 `rs.destroy()` 释放句柄；`statSync` 失败也走 404 而非抛异常。
- 验证：`plugin-safety check` 全绿；`verify-emfile-http.mjs`（30 次客户端中途 abort 循环，无未捕获异常、无崩溃）通过；`verify-emfile-contrast.mjs` 对照——旧代码打开失败 → uncaughtException，新代码 → 进程存活。
- 生效方式：host 半边为 Cordis 源码，DSH 重启即加载修复后文件；无需重建客户端 bundle。

## 2026-08-28 - 冗余触发与 Host 阻塞优化（功能不变）

- 纯性能梳理，无行为变化；起因同 aqua（Desktop 流式输出期间的主线程/Host 事件循环开销）。
- client `src/client.js` `applyEffects()`：原本每次触发都全量重写 ~12 个 CSS 变量 + 7 个 `!important` 玻璃覆盖，并对 `<body>` 强制同步 reflow；触发源包括每次 `<body>` style 突变（主题 presenter 每次应用快照都会重写）与滑条 input。现在 dirty-check：内联值与 priority 均一致则整体跳过；scrim 直写 + 强制 reflow 只在解析色真正变化时执行（`appliedScrimColor` 脏标记，`clearEffects` 复位）。
- host `lib/index.js`：`steamPathFromRegistry()` memo 化——每次 inventory 请求原本同步 spawn 两次 `reg.exe`（`locateWallpaperEngine` 与 `owningLibraries` 各一次），每次都阻塞 Host 事件循环（活动会话流也被卡住）；现在每进程最多查一次。
- 有意不动：inventory 的全盘同步扫描保持每次请求新鲜（「刷新」按钮看到新下载壁纸的语义不变）。
- 验证：`npm run build` + `npm run verify` 全绿；host `node --check` 通过；`plugin-safety check` 全绿（18 插件双端一致）。

## 2026-08-28

- 皮肤状态 Host 侧持久化：壁纸选择/滑条/轮播列表（`dsh-wallpaper-engine:selection`）的持久真值移到 `storages/wallpaper_engine_state.json`。起因：localStorage 按 origin（含端口）隔离 + Host 随机端口，Desktop 重启丢壁纸选择。
- host `lib/index.js`：`apply(ctx, config)` 接 `config.root`，新增 `GET/POST /wallpaper-engine/state`（tmp+rename 原子写、4MB 上限、坏载荷 400/超限 413）。
- client `src/client.js`：模块顶部同步 XHR 种子（早于 selection store 初始化，保留「先挂层不等 inventory」无空窗）；`persistSelection()` 挂 400ms 防抖回写；pagehide 仅冲刷未保存变更（防陈旧标签页覆盖存档）；Host 无存档且本地有状态才回写基线。
- 双端 patch 行加 `config.root: 'A:/DeepSeekHarness/dsh-home'`。
- 验证：build + verify-client 全绿；web 实例路由往返通过；无头 Chrome 实测「写入黑洞壁纸 → reload 壁纸层挂载、4K 视频播放 → 再 reload 状态保持」。

## 2026-08-25

- 深色/浅色主题下的「黑块」修复：壁纸插件此前只把 `bg-base` / `sidebar-fill` 置透明、输入卡片与气泡做玻璃，其余带自身不透明底色的表面在深色下保持近黑（新会话按钮 `button-elevated-fill`、输入框 `+` 号 `specific-selector`、代码块 `markdown-code-block/inline-code`、goal 设置 `specific-tip`、菜单/胶囊 `specific-menu`/`bg-module-platform`）。现在深浅两套都改为半透明玻璃（alpha 0.5–0.62），代码块 `pre` 额外加 `backdrop-filter` 毛玻璃。
  - 实现要点：主题 presenter 会把全部 token 内联写到 `<body>`（内联优先级高于任何样式表，且它每次应用都会先 removeProperty 再重写），所以玻璃覆盖必须也内联写入并带 `!important`（`applyEffects` 里 `setProperty(…, "important")`），并用 `MutationObserver` 监听 `<body>` style，主题一重写就把覆盖推回去——这样无论加载顺序、深浅切换都不会被冲掉。
- 启动提速：`localStorage` 除 `id` 外一并持久化解析好的 `url`/`type`，`apply()` 时先 `syncLayers()`+`applyEffects()` 立即挂壁纸层与 scrim、不等 inventory 重扫；inventory 返回后照常 reconcile（旧壁纸失效自动清理）。消除了「启动时先空白、过一会儿才上壁纸」的间隙。
- 附带修掉一处构建隐患：CSS 注释里的反引号会截断模板字符串（`build-client.mjs` 是纯文本包装不解析语法，需靠 `verify-client.mjs` 捕获），已改为尖括号写法。

## 2026-08-22

- 补充当前 Profile 接入、可播放类型、媒体路由和验证范围说明。

## 0.1.4

- 当前运行版本：Wallpaper Engine Video/Web 壁纸发现、媒体路由、背景渲染和玻璃控制。
