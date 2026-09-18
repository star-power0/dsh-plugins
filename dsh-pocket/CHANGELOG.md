# Changelog（本地定制版）

上游：shaobeichen/dsh-pocket（GPL-2.0）。本文件按时间记录 dsh-home 本地改动。

> **生效中的改动清单不在这里维护**——见 [LOCAL.md](./LOCAL.md)（唯一权威：
> 改动总表 / 手机窄屏明细 / 升级重打步骤 / 坑位速查）。本文件是历史流水账：
> 每条记录当时的现象、根因、修法与实测结果。
>
> 上游升级会覆盖本地改动，升级后按 LOCAL.md §3 重打。

## 2026-09-19 · 文档：README 重写为本地维护版（申明上游 + 本地改动）

- 起因：原 README 是上游原版全文（含上游宣传语、上游 Star 引导、上游安装指引），
  对「本地定制版」没有来源申明与本地改动说明，不符合开源精神与维护需要。
- 改动：`README.md` / `README.en.md` 重写为本地维护版——顶部「来源与许可」块
  （上游仓库、GPL-2.0、tarball 接入方式、上游升级会覆盖本地改动）+ 本地改动表
  （5 项 ID 与作用，指向 LOCAL.md 唯一权威清单）+ 关键修复摘要 + 本机接入方式 +
  生效方式 + License/致谢。删去上游宣传性内容与 Star 引导。
- 内容全部取自 LOCAL.md 与 CHANGELOG，无新增事实声明。

## 2026-09-19 · 修复：手机端「玻璃变量」泄漏（弹层半透明，正文透出）

丞相批准后顺手修的**既有缺陷**（非上一轮整理引入；整理已证零行为变更，
且备份里的 ⑨f 同样只还原 4 个变量）。

- **现象**：手机上打开「选择模型」弹层（dsh-reasoning-slider 的 `.CkKexa_panel`），
  面板是 **55% 半透明**（`rgba(255,255,255,0.55)`），背后会话正文以约 45% 强度
  透出来（叠影，观感脏）；输入框「+」按钮同样半透明（白底上不易察觉）。
- **根因**（抓到写入堆栈）：`dsh-plugin-wallpaper-engine` 的 `applyEffects()` 在
  `selection` 活跃时，把 **7 个玻璃变量**（`--dsw-specific-menu` /
  `--dsw-specific-selector` / `--dsw-specific-tip` /
  `--dsw-alias-button-elevated-fill` / `--dsw-alias-bg-module-platform` /
  `--dsw-alias-markdown-code-block` / `--dsw-alias-markdown-inline-code`）
  以**内联 `!important` 写在 `<body>` 上**。内联 `!important` 没有任何样式表
  能压过 —— 凡是通过**继承**读这些变量的消费元素全部被染成半透明。
  ⑨f 只还原 4 个主题变量、⑨e3 只覆盖官方弹层家族，`.CkKexa_panel` 恰好漏网。
- **修法**（⑨f2，`mobile.css.ts`）：把 7 个变量的**官方实色**声明在消费元素
  自身（`body *`）上。**元素自身的声明 > 从 body 继承来的值**（重要性不随继承
  传递），所以无需与内联 `!important` 正面硬碰优先级。取值全部来自官方
  `design-platform.css` 的 token 链，非自造色：
  - 浅色 `#ffffff` / `#f5f6f7` / `#f9fafb` / `#ebeef2`
  - 深色 `#353638` / `#43454a` / `#1b1b1c` / `#2c2c2e`
- **实测**：弹层 `rgb(255,255,255)` 完全不透明（深色 `rgb(53,54,56)`）；
  全页「可见半透明表面」计数 **0**；「+」按钮回到官方 `#f5f6f7`；
  深色分支逐项核对正确；桌面端 1524px 回归——CSS 完全未注入（`@media`
  包裹），玻璃变量仍是引擎值，桌面观感零变化；手机端控制台无 error/warn。
- **范围**：仅 `dsh-pocket/client/mobile/mobile.css.ts`（+ 重建 `client.js`）。
  存档 `20260918-195835-fix-mobile-glass-token-leak-...`。

## 2026-09-19 · 整理：文档收敛 + 标记统一 + 死代码清理（功能不变）

丞相：「已经写成屎山了，重新整理文档功能，去掉冗余，改动标记好。功能不变。」

- **文档收敛**：新建 `LOCAL.md` 为唯一权威改动清单；README 顶部 6 段压成
  3 行指针（安装事实 + LOCAL.md 指向 + 生效方式）；README.en.md 补同款指针；
  本文件顶部加索引说明；`CUSTOM-PLUGINS.md` 的重复清单改指向 LOCAL.md。
- **标记统一**：此前三种写法混用（`LOCAL (dsh-home)` / `LOCAL customization` /
  纯中文注释）→ 统一为 `[DSH-LOCAL:<id>]`（`settings-ui` / `desktop-env-patch` /
  `mobile-layout` / `boot-cleanup`），`grep -rn "DSH-LOCAL:" client/ lib/` 一次找全。
- **去冗余（仅此 3 处真冗余，其余为注释改写）**：
  1. `mobile.css.ts` 删除重复的 `.we-layer` / `.we-scrim` 隐藏规则（原 ② 与 ⑦
     完全重复，⑦ 为超集）；
  2. `mobile-apply.tsx` 合并两个内容相同的数组 `HIDDEN_LABELS` / `SKIN_SECTIONS`
     → `SKIN_LABELS`（两者仅顺序不同，匹配语义各自保留）；
  3. `pocket-locales.js` 清理 38 个死键：28 个因快速隧道 UI 移除而**我方孤儿化**
     （named*/disclaimer*/stopTunnel/modeQuick… ），10 个为上游从未引用的
     （lanTitle/on/off/wanTitle…）。98 → 60 键，zh/en 仍逐键一致。
- **注释整理**：CSS 编号（①③⑤⑥⑦⑧⑨系列）与 observer job（1–5）重排为稳定 ID，
  与 LOCAL.md 一一对应；不再用 ⑨e3 这类会随修复轮次漂移的序号。
- **修复悬空链接**：两份 README 都指向不存在的 `LOCAL-DEV.md`（上游仓库文件，
  npm 包不含）→ 改为指向 LOCAL.md。
- **零行为变更证明**（注释剥离后的多集合逐行比对）：
  - `lib/proxy.mjs` / `lib/index.js` / `client/index.jsx`：**代码零差异**（仅注释改写）；
  - `mobile.css.ts`：CSS 载荷**仅删掉重复的 `.we-layer/.we-scrim` 块**（4 行），零新增；
  - `mobile-apply.tsx`：仅「两数组 → 一数组」与两处 `.some()` 引用改名（集合相同）；
  - `pocket-locales.js`：60 个存活键**值零变化**，仅 38 个死键移除；
  - 重建产物 `client.js` 212719 → 196704 B（注释精简 + 死键移除所致，符合预期），
    esbuild 重建两次产物一致（确定性构建）。
- 未动：任何选择器、取值、执行顺序、`lib/` 逻辑、`bin/`、`client/mobile/`
  其余文件、APK 工程。另两个插件（`dsh-reasoning-slider` / `dsh-ide-layout`）
  本轮**未改动**。

## 2026-09-18 · 弹层透明真因查明（权限/模式/模型弹层，⑨e3）

丞相问「为什么电脑上权限和模型选择是不透明白、手机上变透明」，并要求修。

**真因（两端实测对比，同一个权限弹层 `_list_19372_` / `_sideTop_19372_`）：**

| | 背景色 | backdrop-filter |
|---|---|---|
| 电脑端（1524px） | `rgba(255,255,255,0.94)` | `blur(24px) saturate(1.4)` |
| 手机端（390px） | `rgba(255,255,255,0.55)` | **none** |

即**官方在窄屏下把毛玻璃关掉了、只留 55% 半透明**——桌面有壁纸/深色底衬着看不出问题，
⑨f 停用壁纸引擎后变纯白底，弹层就直接「消失」（与 ⑨g 代码块同一个病）。

- 处理（`mobile.css.ts` ⑨e3，窄屏）：把这套通用弹层组件（官方 `_19372_` 体系）的
  所有容器变体一次改全：`_list_` / `_submenu_` / `_sideTop_` / `_compactList_` /
  `_denseList_`（此前 ⑨e2 只覆盖了 `_portal_` 一种，漏了其余变体）。
- 实测：手机端 权限/模式/模型 三个弹层均 `rgb(255,255,255)` 不透明；
  桌面端仍 `rgba(255,255,255,0.94)` + `blur(24px)`，官方观感不变。

> 教训（连续踩）：窄屏修复要**按组件体系成组覆盖**（这个官方弹层家族有 6 种容器变体），
> 只修看到的那一种必然漏；且修完必须把「同族元素」都扫一遍。

## 2026-09-18 · 代码气泡块在白底上「消失」（⑨f 的副作用，⑨g 修复）

丞相反馈「紫色根除了，但气泡代码块的问题没解决」。

- 根因：官方给 `code` / `pre` 的背景是 `rgba(255,255,255,0.5~0.62)`
  （**半透明白**），原先靠壁纸引擎的深色/壁纸底衬出来。
  ⑨f 停用壁纸引擎、把背景改成纯白 `#ffffff` 后，
  **白色气泡 + 纯白背景 = 完全看不见**（实测确认：code bg 仍 0.5 白、
  bodyBg 变 `rgb(255,255,255)`，肉眼看就是没了块）。
- 处理（`mobile.css.ts` ⑨g，窄屏）：给代码块浅灰实底 `#f1f3f5` + 淡边框 +
  圆角（行内 6px / 块状 12px），保留等宽字体。
  ⚠️ 用硬编码色而非 `var(--dsw-alias-bg-layer-2)`：该类变量同样被壁纸引擎覆写过
  （同 ⑨c/⑨f 的坑）。
- 实测：手机端 code/pre 背景 `rgb(241,243,245)`、`visibleOnWhite: true`
  （与 bodyBg 不同色 = 可见）；桌面端（1524px）仍 `rgba(255,255,255,0.5)`
  官方半透明白，壁纸衬底观感不变。

> 教训：停用壁纸引擎会让「原本靠壁纸衬底才可见的半透明元素」集体失效——
> 改一处要连带检查所有半透明元素（代码块、弹层、卡片）在纯白下的可见性。

## 2026-09-18 · 手机端停用壁纸引擎（紫色 + 按钮点不动 的真因）

丞相反馈「又变成紫色」「手机打开又恢复白色」「那几个按钮又点不动」——
**这三条是同一个东西在作祟，且是跳变的**（时好时坏）：

- 根因：壁纸引擎（wallpaper-engine）在手机上**没被真正关掉**。之前只隐藏了
  `.we-layer` / `.we-scrim`，但 `body` 上仍挂着 `data-we-wallpaper`，其 CSS 持续
  覆写主题变量：`--dsw-alias-brand-primary = #8268c4`（**紫**）、`--dsw-alias-bg-base`
  被改成 `color-mix(... 9%, transparent)`（透明）；且 `.we-layer` 元素 DOM 仍在 →
  其层偶发参与渲染/交互 → 表现为「时紫时白 + 按钮时有时无地点不动」。

处理（两处配合）：
1. `mobile.css.ts` ⑨f（窄屏）：无条件把壁纸引擎覆写的变量还原成官方默认实色
   （`brand-primary` → `#3964fe` 蓝；`bg-base` / `sidebar-fill` / `input-major` → `#ffffff`）。
2. `mobile-apply.tsx` 5b：窄屏**移除**壁纸引擎 DOM（`.we-layer` / `.we-scrim` 等）
   与 `data-we-wallpaper` 标记（而非仅隐藏）；插件若重建会被下一轮 observer 再清除
   = 手机上永久停用。

⚠️ 踩坑记录：变量还原**不能**写成 `body[data-we-wallpaper]` —— mobile-apply 会移除
该属性，属性一没规则就失效（自己把自己废掉，实测紫仍在）。必须无条件生效。

- 实测：手机端 `brandPrimary: #3964fe`、`purpleGone: true`、`bgBase/sidebarFill: #ffffff`、
  `weNodesRemaining: 0`、`wallpaperAttr: false`。
- 桌面端（1524px）回归：`brandPrimary: #8268c4`（紫保留）、`wallpaperAttr: true`、
  `weNodes: 2`（壁纸引擎照常工作）。

## 2026-09-18 · 下拉/弹层坐实（补 ⑨e2，丞相第 2 条真因）

丞相第 2 条「模式选择还是透明」我上一轮**理解错了**：以为是关闭态按钮发虚（⑨d 已改），
实际他说的是**点开后的下拉列表还透**。

- 实测：点「标准模式」弹出的 portal 层（`._portal_` 后缀，z-index 1100，与模型面板
  同一组件体系）背景 = `rgba(255,255,255,0.55)`（**55% 半透**），底下透出
  「探索未至之境」标题与输入框占位文字。
- 处理（`mobile.css.ts` ⑨e2，窄屏）：`[class*="_portal_"]` 设 `background: #ffffff
  !important` + `backdrop-filter: none`。
- 实测：手机端弹层 `rgb(255,255,255)`、`backdrop: none`；
  桌面端（1524px）仍 `rgba(255,255,255,0.55)`，弹层观感完整保留。

> 教训：同一个「透明」反馈可能有两层——关闭态按钮 vs 展开态弹层，必须两个都测。

## 2026-09-18 · 输入区坐实（第 1、2 条实为同一根因）

丞相反馈：①「无论弄不弄键盘，下面都太透明」②「模式/工作区选择还是有点透明」。
实测为**同一根因**：

- 输入卡 `.uV2eYG_card` 背景 = `color(srgb 1 1 1 / 0.46)`（**46% 半透**）且带
  `backdrop-filter: blur(24px) saturate(1.8) brightness(1.08)` 毛玻璃；变量
  `--dsw-specific-input-major` 正是 `color-mix(... 46%, transparent)`。
- 桌面靠壁纸衬底没问题；手机上没壁纸，透出背后被压暗的内容 → 「下面太透明」。
- 两个选择器虽已在 ⑨d 改成实白，但**浮在这层半透明毛玻璃上**显得发虚 → 「还是有点透明」。

处理（`mobile.css.ts` ⑨e，窄屏）：把 `--dsw-specific-input-major` 覆为不透明实色，
并给输入卡设 `background: #ffffff !important` + `backdrop-filter: none`（去毛玻璃）。
⚠️ 同 ⑨c 的坑：必须硬编码实色，不能用 `var(--dsw-alias-bg-base)`（该变量被壁纸引擎
改成 9% 透明，用了等于没改）。

- 实测：手机端输入卡 `rgb(255,255,255)`、`backdrop: none`、变量 `#ffffff`；
  两个选择器 `rgb(255,255,255)`。
- 桌面端（1524px）回归：输入卡仍 `srgb(1 1 1 / 0.46)` + `blur(24px)`，
  玻璃质感完整保留。

## 2026-09-18 · 抽屉实底 + msg-nav 导航条 + hero 选择器实底

丞相三条反馈（含一次我理解错的更正）：

1. **「打开侧边栏这么透、看不清楚」**
   - 抽屉元素本身就是 `.pI_x6G_sidebarCol`，背景是官方变量
     `--dsw-specific-sidebar-fill` = `srgb(1 1 1 / 0.09)`（9% 透明，桌面靠壁纸衬底）；
     而遮罩 backdrop 的 `z-index`(30) **低于**抽屉(1200)、画在抽屉**下面**，
     于是抽屉几乎全透明、透出下面被压暗的对话内容。
   - **坑1**：纯 CSS 覆盖打不赢官方那条（同样 `!important` 且更晚注入），改由
     `mobile-apply.tsx` 写**内联** `background`（内联 + `!important` 优先级最高）。
   - **坑2（关键）**：不能拿 `var(--dsw-alias-bg-base)` 当实底——壁纸引擎在 body 上
     挂了 `data-we-wallpaper`，把该变量改成了
     `color-mix(in srgb, rgb(255,255,255) 9%, transparent)`，**本身仍是 9% 透明**，
     拿它当实底等于没改（实测内联设了仍算出 0.09）。最终用**硬编码实色**
     （亮 `#ffffff` / 暗 `#1a1a1a`）。
   - 实测：手机端抽屉 `rgb(255,255,255)` 不透明；桌面端仍 `srgb(0.976…/ 0.08)`
     保持官方玻璃观感、内联为 null。

2. **「追溯」——这条我上一轮理解错了，更正**
   - 丞相说的是**他自己的插件 `dsh-plugin-msg-nav`**（对话区右缘的节点导航条，
     每条用户消息一个短横线，悬停弹出预览面板 = 快速定位本会话历史消息）。
   - 我上一轮改的官方 `detailsCol` 详情列是**另一回事**，属于改错对象（已保留该改动，
     它本身也解决了右侧常驻占地方的问题）。
   - 本轮补上：隐藏 `.dsnv-rail` / `.dsnv-panel`（插件的固定类名，不是 hash，很稳）。
     实测：造多轮会话后 `railExists: true` 且 `display: none`（隐藏生效）；
     桌面端 `display: block` 保留可用。

3. **「模式选择和工作区选择还是有点透明」**
   - hero 页这两个选择器官方是透明底 `rgba(0,0,0,0)`，白底上文字发虚。
   - 窄屏给 `#ffffff` 实底 + 淡边框 + 14px 圆角（同 1 的坑：用硬编码色而非变量）。
   - 实测：手机端 `rgb(255,255,255)` 实底；桌面端不受本规则影响。

## 2026-09-18 · 手机端再砍两处（追溯列 + 外观分区）

丞相三条反馈的处理：

1. **右侧追溯/详情列**（官方 `pI_x6G_detailsCol`）：手机上多聊几轮就常驻占掉
   右侧一大块，挡视野又不好用。
   → `mobile.css.ts` ⑨：窄屏 `[class*="detailsCol"] { display: none !important }`。
   桌面端实测 `display: block` 保留，照常可开可拖。
2. **左上角视图切换弹层**：丞相选择「完全保留」，未改动。
3. **设置里的「外观」分区（含紫色预设）**：上一轮只隐藏了侧边导航按钮，
   内容区那一整块（`_8HJdBW_group`：标题「外观」+ 紫色预设 + 各种开关）还在，
   于是手机上看起来「还有个外观，还带颜色」。
   → 这些分区由 `dsh-client-ui-aqua` 注入，**没有稳定 data 属性**，且 **CSS 无法按
   文字内容匹配**（`:has()` 只看结构不看文案），所以改由 `mobile-apply.tsx` 的
   observer 按标题文案（`SKIN_SECTIONS`：外观/玻璃主题/动态壁纸/动效/对话地图）
   找到 group 容器整块隐藏。
   → 实测：手机端 `外观 [HIDDEN]`、可见皮肤类文字 0 处、可见紫色块 0 个；
   桌面端（1524px）`外观 hidden: false`，丞相的主题/壁纸设置一律不受影响。

## 2026-09-18 · 弹层兜底撤回（定位交给插件自身）

- `mobile-apply.tsx`：「每轮 mutation 重算 translateX 把模型弹层拉回视口」的兜底已删除。
- `mobile.css.ts`：`[role="dialog"][class$="_panel"]` 的宽度兜底已删除。
- **原因**：兜底与 dsh-reasoning-slider 自身的渲染竞争，表现为面板位置跳变
  （丞相反馈「有时正、有时超出去」）。
- **现状**：弹层定位由插件在打开时一次性测量（`ModelSlider.jsx` 的 `placePanel`），
  细节见该插件 CHANGELOG。pocket 侧不再含任何弹层定位规则。
- 另：长模型名压住发送按钮的问题同期由该插件修复（`.trigger` 的
  `max-width` 改为 `min(240px, 100%)`）。

## 2026-09-18 · 紧急修复：`BOOT_CLEANUP_CSS` TDZ 导致宿主启动即崩

- **症状**：DSH Web 与 Desktop 全部打不开（插件树 `failed to load`，宿主 fatal）。
- **根因**：`lib/proxy.mjs` 中 `DEFAULT_INJECT`（原第 89 行）拼接引用了 `BOOT_CLEANUP_CSS`，
  但该 `const` 定义在其下方（原第 106 行）。ESM 模块求值阶段 `const` 尚未初始化，
  抛 `ReferenceError: Cannot access 'BOOT_CLEANUP_CSS' before initialization`，
  整个插件模块导入失败。**由上一轮「mobile 本地化第三轮」新增 `BOOT_CLEANUP_CSS` 时引入**
  （只加了拼接、未调整声明顺序，且未做启动验证）。
- **修复**：将 `BOOT_CLEANUP_CSS` 的定义（含注释块）整体上移到 `DEFAULT_INJECT` 之前。
  纯声明顺序调整，内容与逻辑零改动。
- **验证**：`node --check`、`import()` 直测（21 项导出）、Web 3080 首页 HTTP 200、
  Desktop 主窗口正常、`plugin-safety check` 20 插件双端全绿。
- **重打提醒**：上游升级后若重新接入 `BOOT_CLEANUP_CSS`，务必保持"先定义、后拼接"的顺序。

## 2026-09-18 · mobile 本地化第三轮（丞相 5 条反馈）

根因是同一个：**`dsh-ide-layout`（桌面 IDE 布局）在手机宽度下没退场**。
它是「左文件树 + 中编辑器 + 右对话」的宽屏布局，在 390px 手机上会：
① 往原生工具栏注入「资源管理器」入口；② 持续给 `centerCol` 写内联
`margin-left`（实测 287→328px）把对话列挤出屏幕。② 直接造成「右侧留白
（模型名短时）/ 卡片撑出屏幕（模型名长时）」和「模型弹层锚点跑到屏外」。
另外壁纸引擎的视频层在插件启动前的 0.5~1s 空窗期会裸奔在官方启动页上。

- `client/mobile/mobile.css.ts`
  - ⑥ ide-layout 整层退场：`[data-ide-workbench]` / `[data-ide-sidebar-tree]` /
    `[data-ide-tree-panel]` / `[data-ide-sidebar-title]` / `[data-ide-tree-title]` /
    `[data-ide-tree-launcher]` / `[data-ide-tree-launcher-host]` / `.ide-chat-handle`
    一律 `display:none`。
  - 被挤走的对话列归位：`[class*="centerCol"] { margin-left: 0 !important }`。
    插件会持续重写内联值（实测清掉后 128ms 回写），作者样式的 `!important`
    优先于非 `!important` 内联，因此无需抢写入。
  - ⑦ 窄屏不渲染壁纸层（`#dsh-wallpaper-engine-layer` / `.we-layer` 等）。
  - ⑧ 模型弹层宽度兜底 `max-width: calc(100vw - 16px)`。
- `client/mobile/mobile-apply.tsx`：弹层水平位置修正——按锚点实测坐标算
  `translateX` 平移（祖先带 transform，`position:fixed` 的包含块不可靠），
  每轮 mutation 重算（React 重渲染会清掉内联 transform）。
- `lib/proxy.mjs`：新增 `BOOT_CLEANUP_CSS` 并接入 `DEFAULT_INJECT`，
  把「窄屏隐藏壁纸层 + 对话列归位」提前到页面 `<head>` 最先注入——覆盖
  插件启动前那 1 秒空窗期（实测壁纸层 532~915ms 可见，1.5s 后才被隐藏）。- 验证（chrome-devtools 390×844 移动仿真 @ GUI 64773）：
  - ide-layout 全部 `display:none`；抽屉内「资源管理器」入口消失
    （`explorerEntries: []`），会话列表/工作区/设置无误伤；
  - `centerCol` 计算 margin `0px`、宽度 390、`body.scrollWidth === 390`（无横向溢出）；
    composer 卡 `x:12 w:366 right:378`（视口内）；
  - 模型弹层 `x:-3 → x:8`，`insideViewport: true`；
  - hero 工作区行内容中心 195 = 视口中心 195。
- `client/client.js` 重新构建，plugin-safety check 全过。
- 生效方式：页面级改动（CSS/observer）**划掉重开 App 即可**；
  `lib/proxy.mjs` 的启动期注入是 host 级，**需重启 DSH Desktop**。

## 2026-09-18 · mobile 本地化第二轮

- `client/mobile/mobile-apply.tsx`：抽屉入口隐藏修复——DSH 侧栏是纯 div 结构
  （无 `<nav>`/`<aside>`），旧选择器全部落空导致「对话地图」仍然可见；选择器
  增加 `[class$="_sidebarCol"] button/a`，文案匹配补充 `aria-label`（图标按钮）。
- `client/mobile/mobile.css.ts`：hero 的工作区/模式选择行居中
  （`justify-content: center` + 去掉官方 `padding-left:20px`，否则偏左 10px）。
- 验证（chrome-devtools 390×844 移动仿真 @ GUI 64773）：
  - 抽屉内「对话地图」display:none，会话列表/工作区/设置无误伤；
  - hero 行内容中心 195.2 vs 视口中心 195（偏差 0.2px）。
- `client/client.js` 重新构建（node client/build.mjs），plugin-safety check 全过。
- 页面级改动：浏览器刷新 / 手机 App 重开即生效，无需重启 Desktop。
