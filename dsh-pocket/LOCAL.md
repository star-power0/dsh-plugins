# dsh-pocket 本地定制清单（唯一权威）

> **本文件是 dsh-pocket 本地改动的唯一权威来源**。README 顶部、`CHANGELOG.md`、
> `A:\DeepSeekHarness\CUSTOM-PLUGINS.md` 只保留摘要并指向本文件，不再各自维护一份清单。
>
> 上游：`shaobeichen/dsh-pocket`（GPL-2.0），npm `dsh-pocket@2.10.6`，
> 2026-09-18 经 npmmirror 拉 tarball 安装（**非 git clone**）。上游升级会覆盖
> 下面列出的所有文件，升级后按本文件 §4 逐条重打。

---

## 1. 改动总表

每条本地改动都有唯一 ID，代码里以 `[DSH-LOCAL:<id>]` 注释标记，可用一条命令找全：

```sh
grep -rn "DSH-LOCAL:" client/ lib/
```

| ID | 文件 | 作用 | 生效层级 | 上游覆盖 |
|---|---|---|---|---|
| `settings-ui` | `client/index.jsx`、`client/pocket-locales.js`（+ 重建 `client/client.js`） | 设置页「手机访问」：smartphone 侧栏图标；公网区块改固定域名卡片 + 密码「随机换新」；局域网二维码默认收起 | 页面（刷新/重开 App） | 是 |
| `desktop-env-patch` | `lib/index.js`（接线 `lib/proxy.mjs` 的 `desktopEnvPatchScript`） | 手机/外部浏览器访问 Desktop 宿主时，`<head>` 最早处补齐 `dsh-desktop-mode/platform`，避免旧版 `dsh-plugin-desktop` 抛错白屏 | host（改后重启宿主） | 是 |
| `mobile-layout` | `client/mobile/mobile.css.ts` ⑨系列、`mobile-apply.tsx` | 手机窄屏全部视觉修复：入口隐藏、抽屉/输入卡/弹层实底、代码块可见、壁纸引擎停用、hero 布局、统计行、文件守卫等 | 页面（刷新/重开 App） | 是 |
| `boot-cleanup` | `lib/proxy.mjs` 的 `BOOT_CLEANUP_CSS` | 页面 `<head>` 最先注入：窄屏隐藏壁纸层 + 对话列归位，补住插件启动前 0.5~1s 空窗 | host（改后重启宿主） | 是 |
| `apk-shell` | `apk/`（本插件子目录） | 手机 APK 壳，`build.ps1` 一键出包 | — | 否 |

**未改动的上游文件**（升级后无需重打）：`bin/`、`lib/restart.js`、`lib/settings.mjs`、
`lib/service.mjs`、`lib/tunnel.mjs`、`lib/web-rpc.js`、`lib/ip.mjs`、
`client/api.js`、`client/build.mjs`、`client/mobile/` 中除 `mobile.css.ts` /
`mobile-apply.tsx` 外的文件（`fileGuard.ts`、`layout-mode.mjs`、`locales.ts`、
`nav-targets.mjs`、三个 `Mobile*.tsx` 组件）。

**未改动、但上游升级后要复查的联动项**：无。

---

## 2. 手机窄屏定制明细（`mobile-layout`，`mobile.css.ts` + `mobile-apply.tsx`）

CSS 与 observer 分工：**能用 CSS 选择器表达的放 CSS，需要按文案/时序判断的放 observer。**

### 2.1 CSS 块（`mobile.css.ts`，全部在 `@media (max-width: 1023px)` 内）

| 编号 | 作用 | 备注 |
|---|---|---|
| ① | 隐藏文件资源管理器入口（header 图标 + 抽屉项） | |
| ③ | hero 空态输入卡全宽 `calc(100vw - 24px)` | |
| ⑤ | hero 工作区/模式选择行居中（去掉官方 `padding-left:20px`） | |
| ⑥ | `dsh-ide-layout` 整层退场 + `centerCol` 归位 | `!important` 压其内联 `margin-left` |
| ⑦ | 窄屏不渲染壁纸层（`#dsh-wallpaper-engine-layer` 等） | 原 ② 的 `.we-layer` 规则为其子集，重复项已删 |
| ⑧ | ~~模型弹层宽度兜底~~ → 已删（定位归 `dsh-reasoning-slider`），仅留注记 | |
| ⑨ | 隐藏官方右侧详情列 `[class*="detailsCol"]` | 桌面端保留 |
| ⑨b | 隐藏 `dsh-plugin-msg-nav` 的 `.dsnv-rail` / `.dsnv-panel` | 固定类名，稳定 |
| ⑨c | 抽屉实底 | CSS 打不赢官方规则，实际由 observer 写内联（见 2.2 job 5） |
| ⑨d | hero 页「工作区/模式」选择器实底 + 淡边框 + 14px 圆角 | 硬编码色，勿用变量 |
| ⑨e | 输入卡实底 + 去毛玻璃（`--dsw-specific-input-major` 一并覆写） | 硬编码色 |
| ⑨e2 | `[class*="_portal_"]` 弹层实底 | |
| ⑨e3 | 官方通用弹层组件 `_19372_` 体系全部容器变体实底 | 六变体：`_list_` / `_submenu_` / `_sideTop_` / `_portal_` / `_compactList_` / `_denseList_` |
| ⑨e4 | 弹层家族 `z-index: 1300`（压过抽屉的 1200） | 抽屉内打开的「⋯」菜单曾被抽屉压住；**勿降抽屉的 1200**（承载性数值） |
| ⑨f | 还原壁纸引擎覆写的主题变量（去紫、去透明） | **无条件生效**，不可写 `body[data-we-wallpaper]` |
| ⑨f2 | 还原壁纸引擎的 7 个玻璃变量（弹层/选择器/代码块半透明） | 声明在 `body *` 上（元素自身声明 > 继承的 body 内联 `!important`） |
| ⑨g | 代码块浅灰实底 + 淡边框 + 圆角 | 硬编码色 |
| ⑩ | 皮肤类设置分区隐藏的 CSS 侧说明（实际由 observer 执行） | 见 2.2 job 3 |

> 编号是稳定标识（注释与 LOCAL.md 互相引用），**不代表执行顺序**；CSS 规则的
> 实际先后以文件中的物理顺序为准（级联结果已按原顺序保持）。

### 2.2 observer 块（`mobile-apply.tsx`，`sync()` 内，五个 job）

| job | 作用 |
|---|---|
| 1 | 皮肤/地图入口按文案隐藏（`SKIN_LABELS`，exact-or-prefix） |
| 2 | 官方「内测声明」弹窗自动点「继续」 |
| 3 | 设置内容区皮肤类分区按标题文案整块隐藏（`SKIN_LABELS`，exact） |
| 4 | 移除壁纸引擎 DOM（`.we-layer` / `.we-scrim` 等）与 `data-we-wallpaper` 标记 |
| 5 | 抽屉实底：写内联 `background`（内联 + `!important` 优先级最高） |

> 历史注记：曾有一个「模型弹层定位」job（原 3 号），已删除——它与插件自身渲染
> 竞争导致面板跳变；修复移入 `dsh-reasoning-slider` 的 `placePanel`。pocket 侧
> 不再含任何弹层定位逻辑。

### 2.3 四条硬性约束（踩坑换来的，改代码时必须遵守）

1. **硬编码实色**：`var(--dsw-alias-bg-base)` / `--dsw-specific-sidebar-fill` 等变量
   会被壁纸引擎改成 9% 透明，拿它们当实底等于没改。实色用 `#ffffff` / `#1a1a1a`。
2. **注释里禁用反引号**：`mobile.css.ts` 的 CSS 是模板字符串，注释中的反引号会截断它
   （已连踩 2 次 `Expected ";" but found ...`）。
3. **窄屏修复要按组件体系成组覆盖**：官方弹层家族有 6 种容器变体，只修看到的那一种必然漏。
4. **压不过 body 内联 `!important` 变量时，声明在消费元素自身上**：重要性（`!important`）
   不随继承传递——写在 `body *`（或具体消费元素）上的普通声明，就能压过 `<body>` 上
   的内联 `!important` 变量值。⑨f2 用的就是这招（改 `<body>` 的规则无论如何都压不过）。

---

## 3. 上游升级重打步骤

```sh
# 0) 先存档，失败可回退
node $DSH_HOME/plugin-tools/plugin-safety.mjs snapshot upgrade-dsh-pocket

# 1) 拉新 tarball 覆盖（保留本地改动前先备份）
curl -sL -o dsh-pocket.tgz https://registry.npmmirror.com/dsh-pocket/-/dsh-pocket-<新版>.tgz
tar -xzf dsh-pocket.tgz

# 2) 按 §1 总表逐条重打 5 项定制（对照 git 备份或 plugin-snapshot）

# 3) 重建 + 体检 + 重启
node client/build.mjs
node $DSH_HOME/plugin-tools/plugin-safety.mjs check
# host 级改动（desktop-env-patch / boot-cleanup）需重启 DSH Desktop
```

重打后验证：`grep -rn "DSH-LOCAL:" client/ lib/` 应命中 §1 表内全部 ID。

---

## 4. 已知坑位速查

| 坑 | 现象 | 解法 |
|---|---|---|
| 壁纸引擎变量污染 | 紫色、透明、按钮点不动（跳变） | ⑨f 无条件还原变量 + job 4 移除 DOM |
| 壁纸引擎玻璃变量污染 | 弹层/「+」按钮半透明，正文透出 | ⑨f2 在 `body *` 上声明官方实色（内联 `!important` 只能被元素自身声明压过） |
| 官方窄屏去毛玻璃 | 弹层在纯白底上「消失」 | ⑨e3 成组覆盖全部容器变体 |
| 抽屉压住自己的弹层 | 会话「⋯」菜单被压暗/点不动（只关菜单） | ⑨e4 弹层提到 `z-index:1300`；**勿降抽屉 1200**（它要压第三方遮罩） |
| 半透明元素在纯白底上不可见 | 代码块/弹层看不见 | 给硬编码实底（⑨g / ⑨e3） |
| `dsh-ide-layout` 挤压对话列 | 右侧留白 / 卡片越界 / 弹层锚点出屏 | ⑥ 整层退场 + `centerCol` 归位（CSS `!important` 压内联） |
| TDZ 启动崩溃 | 宿主 fatal、Web/Desktop 全打不开 | host 级文件改后立刻 `node --check` + 真实启动探针 |
| 弹层定位竞争 | 面板位置跳变 | 定位收进 `dsh-reasoning-slider`，pocket 侧不兜底 |
