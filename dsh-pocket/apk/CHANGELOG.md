# Changelog（DSH Pocket APK 壳）

手工链构建（aapt2 → javac → d8 → zipalign → apksigner），无 Gradle。
签名沿用 `pocket.keystore`（密码 `pocket123`）。

## 2026-09-18 · v1.2 — 换成真实图片应用图标

- 源图：`D:\Manual\OneDrive\桌面\生图\imagestudio-history-1788511256608.png`
  （1024×1024，32bpp ARGB，100% 不透明，四边浅灰 `#B6B6B5`，主体居中）。
- 改为**自适应图标**（用户选定）：
  - 前景 `ic_launcher_foreground`：源图居中缩到 61%（108dp 画布的 66dp 安全区），
    四周留白，任何系统遮罩都不会切到主体。
  - 背景 `ic_launcher_background`：纯色 `#B6B6B5`（取源图边缘均值，衔接自然）。
- 生成五档位图：mdpi 48 / hdpi 72 / xhdpi 96 / xxhdpi 144 / xxxhdpi 192。
  新增可重跑脚本 `make-icons.ps1`。
- **两个实施更正（与初版设计不同）**：
  1. 位图必须放 `res/drawable-<density>/`，**不能放 `mipmap-*`**——
     `adaptive-icon` 的 `android:drawable` 只认 drawable 资源，放 mipmap 会
     `aapt2 link` 报 `not found`。
  2. `AndroidManifest.xml` 的 `<application>` **原本没有声明 `android:icon`**
     （`aapt2 dump badging` 显示 `icon=''`，系统拿不到图标、退化成默认图标）。
     本次补上 `android:icon` + `android:roundIcon` → `@mipmap/ic_launcher`。
     这是换图前就有的缺陷，一并修好。
- 版本：`versionCode` 2 → **3**、`versionName` 1.1 → **1.2**；
  `MainActivity.VERSION_CODE` 同步 2 → 3（触发升级后一次性 WebView 缓存清理）；
  `build.ps1` 输出 `DSH-Pocket-v1.2.apk`。
- 产物：`DSH-Pocket-v1.2.apk`（73 KB），`apksigner verify` exit=0，
  badging 确认 `versionCode='3' versionName='1.2'`
  且 `icon='res/mipmap-anydpi-v26/ic_launcher.xml'`。
- 旧包 `DSH-Pocket-v1.0/v1.1`（含 `.idsig`）已清理，避免混淆。

## 2026-09-18 · v1.1

- 一次性 WebView 缓存清理：版本变化时 `web.clearCache(true)`，避免升级后仍加载旧页面。
- 其余同 v1.0（全屏 WebView、cookie 持久化、返回键历史优先 + 双击退出、外链交系统浏览器）。
