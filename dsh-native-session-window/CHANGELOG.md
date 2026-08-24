# Changelog

## 2026-08-23

- **双开窗口互相覆盖**：新窗口加载完成后按目标显示器 `workArea` 将当前两个 DSH 窗口左右等分，保留 16px 分隔（为两侧 DWM 阴影留位）并解除最大化状态。**关键**：窗口 `minWidth: 900` 大于本机半屏 tile（845/846），平铺前先用 `fitMinimumSize` 把最小宽高降到目标尺寸以下，否则 Electron 把宽度钳回 900，右窗溢出工作区压住左窗（本机不降 min 会溢出约 109px）。新增无重叠矩形 + min-size 降级回归测试。
- **验证**：重启 Desktop 后实测双开分屏，两窗各占一半、互不遮挡，效果确认。

## 2026-08-23

- **设置面板「打开配置文件」+「关闭」按钮点不动（桌面端）**：根因是对话区顶部 header
  （`wSkVaW_header`，含 titleRow+tabs，高约 75px）被标为 `-webkit-app-region: drag` 窗口拖拽区，
  而 Electron 的 app-region 拖拽区在命中测试时**优先于 modal 覆盖层**（浏览器不认该属性所以 web 正常）——
  设置面板（居中 modal）头部两个按钮（y≈44-72px，正好落在拖拽区高度内）点击被系统拦截，无 hover 无反应；
  面板下方按钮正常、Esc 能关（键盘不经过鼠标命中测试）、顶部能拖窗。修复：`DRAG_STYLE` 增加与官方
  `html:has([aria-modal="true"])` 一致的豁免规则，modal 打开时禁用我们的 drag 区域
  （`[data-native-session-window-drag]` + `#dsh-native-session-window-drag-edge`），关闭后恢复拖拽。

## 2026-08-23

- **新窗口无白边 + 可拖动分屏**：host 端兼容模式 win32 补上 Window Controls Overlay
  （`titleBarStyle: hidden` + `titleBarOverlay`，与桌面主窗口一致）→ 原生白色标题栏消失；
  client 端把所有桌面窗口（主窗口 + 任意多个原生会话窗口，按 URL 是否带 `dsh-desktop-mode` 判定）
  的会话标题栏变成拖动区（VS Code 模式：空白处 `-webkit-app-region: drag`，按钮/输入 `no-drag` 照常可点）
  + 顶部 14px 全宽隐形拖动边条，Aero Snap 分屏可用。web 端不受影响。
- **性能优化**：拖动区注入不用 `MutationObserver`（界面流式/IDE 布局下 DOM 频繁变动，subtree observer
  每次变更都跑查找会卡顿），改为启动时尝试一次 + 每秒一次 O(1) 检查（仅当标题栏被宿主重建移除时才重新查找）。
- **窗口生命周期加固（关窗后打不开 / 只能重启恢复）**：① `desktopSpecFromOpenWindows` 读已销毁窗口的
  `webContents.getURL()` 会在 try/catch 外抛 `Object has been destroyed`，导致关窗后「打开新窗口」直接 500
  —— 现读 URL 前先查 `isDestroyed()` 且整段纳入 try/catch；② `loadURL` 在窗口中途被销毁时可能挂起不返回，
  `pending` 槽永久卡死 → 之后每次打开同一会话都直接返回卡死 promise（表现为"点了没反应，只有重启才好"）
  —— 新增 `loadWithTimeout`（25s 硬超时 + 定时器即时清理）；③ `release()`/`onClosed`/`open()` 清理段全部
  try/catch 防护，部分销毁的窗口不再让事件回调抛异常影响主进程。新增回归：`loadWithTimeout` 成功/超时、
  残留已销毁窗口时仍能开新窗口（WCO 选项断言）。
- **多窗口打不开（第 3+ 个新窗口 loadURL 挂起 → 官方菜单回退 window.open → 浏览器报 invalid dsh-desktop-mode）**：
  根因为主窗口 + 多个新窗口并发使用 mica 背景时 DWM 合成器饱和，新窗口 renderer 加载卡死（实测两个不同会话
  在第 3 个新窗口时均 25s 超时，而插件路由本身正常）。修复：① 新窗口**去掉 `backgroundMaterial: mica`**
  （保留 WCO 无白边，Aqua 玻璃主题照常提供背景，观感几乎不变）；② `loadWithTimeout` 超时 15s→25s；
  ③ client 端拦截 `window.open` 里「同源 + `?dsh-session=`」的官方浏览器回退路径，改为走原生 POST，
  失败时弹明确错误提示 —— **桌面端永远不会再弹出坏掉的浏览器页**（web 端不受影响，仍走正常 window.open）。
  新增回归：window.open 拦截不破坏 web 端（由现有 web fallback 用例覆盖）。
- **多窗口打不开（再诊断，2026-08-23）**：去 mica 后阈值从第 3 个提高到第 4 个窗口，但第 4 个仍挂起。
  实测：第 4 个窗口的 renderer 进程**正常派生**（~100MB、10 线程）但 **0% CPU、25s 不加载**，宿主对页面 URL
  返回 200 正常（248ms），系统提交内存仅 57%、物理空闲 ~2.6GB —— 不是内存不足、不是宿主拒答、也不是 renderer
  起不来。结论：renderer 派生后卡在 Chromium 进程/IPC 层，最符合「隐藏窗口（`show:false`）被后台节流」——
  多窗口 + 每窗口一套 IDE LSP 进程（~750MB/窗口）时，第 N 个隐藏窗口被节流到近乎 0 CPU，初始加载永不完成。
  修复：新窗口 `webPreferences.backgroundThrottling: false`（隐藏期间也全速加载）。附带发现：每开一个新窗口，
  宿主都会为其派生一套完整 LSP 进程（tsserver×2+pyright+ts-lang-server+typings ≈ 750MB），是「多开窗口」最重
  的成本，属 dsh-ide-layout 行为（未改动，另行讨论）。
- **多窗口打不开（再诊断 2，2026-08-23）**：backgroundThrottling + LSP 池后，第 3 个窗口正常加载（renderer
  内存 380→411MB 增长、CPU 上升），**第 4 个窗口 renderer 出生即死（99MB、0 CPU、内存不增长）**；主进程
  handles 仅 1295、GPU 1 个、内存 3.5GB 空闲、用户对象 67/10000 —— 非内存/GPU/句柄/用户对象/LSP 问题。
  实测行为「关一个弹出一个」= 第 4+ 窗口阻塞等待渲染进程名额，关掉一个才放出一个。**诊断性改动**：新窗口
  `sandbox: true → false` 测试无效，**已回退为 sandbox:true**（恢复安全姿态）。结论：这是 DSH Desktop 的
  Chromium/Electron 运行时对活跃渲染进程数量的硬限制（~4 个），插件层面无法突破。
- 回归：`node --check` 通过、`maintenance/test-session-manager-window.mjs` PASS、`plugin-safety check` 全绿。
- 存档：`20260823-050724-native-session-window-borderless-drag`；需重启 Desktop 生效。

## 2026-08-22

- 补充 Desktop/Web 运行边界、窗口安全策略和回归脚本说明。

## 0.1.0

- 当前运行版本：在 Desktop 原生新窗口打开会话，并在 Web 模式安全降级。
