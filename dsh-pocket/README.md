# dsh-pocket · 本地定制版

> **来源与许可**：上游 [shaobeichen/dsh-pocket](https://github.com/shaobeichen/dsh-pocket)（**GPL-2.0**，
> 上游版权与许可证全文保留于本目录 `LICENSE`）。本机经 npmmirror 拉 npm tarball
> `dsh-pocket@2.10.6` 接入（**非 git clone**），此后由本机持续迭代。
> 上游升级会覆盖本地改动——重打步骤见 [LOCAL.md](./LOCAL.md) §3。

**本机全部本地改动的唯一权威清单在 [LOCAL.md](./LOCAL.md)**：改动总表（ID / 文件 / 生效层级 /
上游是否覆盖）、手机窄屏定制明细、上游升级重打步骤、坑位速查。代码内以 `[DSH-LOCAL:<id>]`
注释标记，`grep -rn "DSH-LOCAL:" client/ lib/` 一次找全。

## 本地改动（Local modifications）

| ID | 文件 | 作用 |
|---|---|---|
| `settings-ui` | `client/index.jsx`、`client/pocket-locales.js`（+ 重建 `client/client.js`） | 设置页「手机访问」：smartphone 侧栏图标；公网区块改固定域名卡片 + 密码「随机换新」；局域网二维码默认收起 |
| `desktop-env-patch` | `lib/index.js`（接线 `lib/proxy.mjs` 的 `desktopEnvPatchScript`） | 手机/外部浏览器访问 Desktop 宿主时，`<head>` 最早处补齐 `dsh-desktop-mode/platform`，避免旧版 `dsh-plugin-desktop` 抛错白屏（**升级 DSH Desktop 到 2.0.3+ 后可移除**） |
| `mobile-layout` | `client/mobile/mobile.css.ts` + `mobile-apply.tsx` | 手机窄屏全部视觉修复：入口隐藏、抽屉/输入卡/弹层实底、代码块可见、壁纸引擎停用、hero 布局、统计行、文件守卫等 |
| `boot-cleanup` | `lib/proxy.mjs` 的 `BOOT_CLEANUP_CSS` | 页面 `<head>` 最先注入：窄屏隐藏壁纸层 + 对话列归位，补住插件启动前 0.5~1s 空窗（**host 级，改后需重启宿主**） |
| `apk-shell` | `A:\DeepSeekHarness\pocket-apk\`（独立工程，不在本仓库） | 手机 APK 壳，`build.ps1` 一键出包 |

手机窄屏修复的关键几处（完整表见 LOCAL.md §2）：

- **壁纸引擎停用**：还原其覆写的主题变量（去紫 `#8268c4` → 官方蓝 `#3964fe`、去透明）
  + observer 移除其 DOM 与 `data-we-wallpaper` 标记。
- **玻璃变量泄漏修复**：壁纸引擎以内联 `!important` 在 `<body>` 上钉住 7 个玻璃 token，
  继承读取者全被染成半透明（模型弹层曾 55% 透出正文）。解法：把官方实色声明在消费元素
  自身（`body *`）——元素自身声明压过继承值。
- **官方弹层家族成组覆盖**：`_19372_` 六种容器变体（`_list_` / `_submenu_` / `_sideTop_` /
  `_portal_` / `_compactList_` / `_denseList_`）在窄屏下统一实底，避免"只修看到的那一种"。
- **代码块 / 抽屉 / 输入卡实底**、`dsh-ide-layout` 整层退场 + `centerCol` 归位、
  `msg-nav` rail 隐藏、官方右侧详情列隐藏。

> 历史坑位：`lib/proxy.mjs` 曾因 `DEFAULT_INJECT` 在其依赖的 `const` 定义之前引用而触发
> TDZ，导致宿主启动即崩、Web 与 Desktop 双双打不开。任何 host 级编辑落刀后必须立刻
> `node --check` + 真实启动探针（详见 LOCAL.md §4）。

## 上游能力（本机在用）

- **局域网访问**：设置 →「手机访问」→ 局域网二维码，手机连同一 WiFi 扫码即开
  （自动识别本机局域网 IP；WSL 环境自动取 Windows 物理网卡 IP）。可一键开关。
- **公网访问**：本机走 **cloudflared 命名隧道**（`pocket.starroute.me` →
  `http://127.0.0.1:3081`），**不启用插件内置快速隧道**；公网 Host 被 fail-closed 判定
  强制密码。
- **认证**：局域网/公网各 8 位密码，可自定义固定；登录态绑定 dsh web 进程，重启后需重输。
- **实时同步**：WebSocket 全透传（电脑输出 → 手机同步滚动），含心跳保活与断线重连。
- **传输压缩**：大 JSON 响应自动 gzip/brotli。

## 本机接入（手工注册，不进 bundles 栈）

Web 与 Desktop 两个 profile 的 `package.json` 以 `link:` 指向插件目录，各自
`cordis.patch.yml` 登记唯一 `dsh-pocket` insert（`config.port: 3081`）。
**不写入 `dsh.profile.bundles`**（bundles 栈与手工 insert 同时存在会触发
`duplicate loader entry id` 并使 Host 启动失败）。

运行时依赖 `qrcode` / `qrcode-terminal` 已在插件目录就地 `pnpm install --prod` 解析。

## 改完如何生效

- **页面级**（`client/**` 的 CSS / observer）：`node client/build.mjs` 重建后，手机刷新或
  重开 App 即可。
- **host 级**（`lib/index.js` / `lib/proxy.mjs`）：**需重启 DSH Desktop**。

## 开发

```sh
node client/build.mjs      # client/index.jsx → client/client.js
node $DSH_HOME/plugin-tools/plugin-safety.mjs check    # 注册体检
```

## License

GPL-2.0（继承自上游）。上游许可证全文见本目录 `LICENSE`；本地改动同样以 GPL-2.0 释出。

## 致谢

- [shaobeichen/dsh-pocket](https://github.com/shaobeichen/dsh-pocket) —— 上游项目
- [mexiaosqwq/dsh-web-mobile](https://github.com/mexiaosqwq/dsh-web-mobile)（MIT）—— 移动端
  适配源码来源（见 `client/mobile/LICENSE.dsh-web-mobile`）
