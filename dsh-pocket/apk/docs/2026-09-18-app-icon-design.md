# DSH Pocket APK — 应用图标换图设计（2026-09-18）

## 1. 目标与背景

- **目标**：把 `D:\Manual\OneDrive\桌面\生图\imagestudio-history-1788511256608.png`
  （1024×1024，32bpp ARGB，实测 100% 不透明）设为 DSH Pocket 的桌面应用图标，
  输出新版安装包 `DSH-Pocket-v1.2.apk`。
- **背景**：当前图标是**代码绘制的矢量图**（`res/drawable/ic_launcher.xml`：蓝底
  `#4f6ef7` + 白色手机字形），不是位图资源；`res/mipmap-anydpi-v26/ic_launcher.xml`
  是一个自适应图标壳，其 `background`/`foreground` **都指向同一个矢量图**（等于没有
  真正利用自适应前景/背景分层）。
- **用户已确认的选择**：① 图标形态 = **自适应图标**（图缩到中心安全区，避免被系统
  遮罩裁切）；② 版本号 = **升到 v1.2**。

## 2. 源图特征（实测，决定适配参数）

| 项目 | 实测值 | 对适配的影响 |
|---|---|---|
| 尺寸 | 1024×1024 | 正方形，无需先裁剪长边 |
| 四角像素 | `ARGB(255,181,180,181)` 等 | 四周是浅灰留白 |
| 边缘均值 | `#B6B6B5` | 可做背景层取色来源 |
| 中心像素 | `ARGB(255,228,176,162)`（暖肤色） | 主体居中，重心安全 |
| 不透明度 | 采样 100% 不透明 | 无透明边缘需特殊处理 |

**结论**：主体居中、四周留白，因此**居中缩放 + 安全区**的适配方式能完整保留主体。

## 3. 图标形态设计（自适应图标）

采用 Android 自适应图标（Adaptive Icon）双图层结构：

- **前景层 `ic_launcher_foreground`**：源图**等比缩放，主体内容置于 108dp 画布中心
  的 66dp 安全区内**（即缩放约 61%），四周留白。这样无论系统套用圆 / 方 / 圆角 /
  水滴哪种遮罩，主体都不会被切到。
- **背景层 `ic_launcher_background`**：纯色，取源图边缘色 `#B6B6B5`，保证前景留白与
  背景自然衔接（也可后续按需要换成品牌色）。

> 取舍说明：代价是源图最外圈约 39% 的留白区域会被安全区裁掉/缩小；这正是换取
> 「各机型不被系统遮罩切掉主体」的代价，用户已确认接受此方案。

## 4. 资源规格

> **实施更正（重要）**：位图最终放在 `drawable-*`，**不能放 `mipmap-*`**——
> `adaptive-icon` 的 `android:drawable` 只能引用 drawable 资源。初版放 mipmap 时
> `aapt2 link` 直接报 `resource drawable/ic_launcher_foreground not found`。
> 放在 `drawable-<density>` 既保留密度分级，又能被 `@drawable/` 正确引用。

| 密度 | 目录 | 图标边长 |
|---|---|---|
| mdpi | `res/drawable-mdpi/` | 48 px |
| hdpi | `res/drawable-hdpi/` | 72 px |
| xhdpi | `res/drawable-xhdpi/` | 96 px |
| xxhdpi | `res/drawable-xxhdpi/` | 144 px |
| xxxhdpi | `res/drawable-xxxhdpi/` | 192 px |

- 前景图 PNG：源图按上表边长生成，并内缩到安全区（内容占画布 61%，居中偏移）。
- 背景图 PNG：同尺寸纯色 `#B6B6B5` 位图。
- 保留 `res/drawable/ic_launcher.xml` 作为 **Android 7.0 及以下（API < 26）** 的
  兜底图标，避免旧系统无图标。

生成脚本：`make-icons.ps1`（可重跑、幂等覆盖；输出目录为 `drawable-*`）。

XML 改动：

- `res/mipmap-anydpi-v26/ic_launcher.xml`：`background` → `@drawable/ic_launcher_background`；
  `foreground` → `@drawable/ic_launcher_foreground`（不再二者同指一张图）。
- `AndroidManifest.xml` 的 `<application>` **补上 `android:icon` / `android:roundIcon`
  → `@mipmap/ic_launcher`**。
  > **实施更正（关键）**：原 manifest **从未声明 `android:icon`**，`aapt2 dump badging`
  > 显示 `icon=''`——即使图标资源存在、系统也拿不到，桌面会退化成系统默认图标。
  > 这是换图前就存在的缺陷，本次一并修好（验证：badging 现输出
  > `icon='res/mipmap-anydpi-v26/ic_launcher.xml'`）。

## 5. 版本与构建改动

| 文件 | 改动 |
|---|---|
| `AndroidManifest.xml` | `android:versionCode` 2 → **3**；`android:versionName` 1.1 → **1.2** |
| `java/com/dsh/pocket/MainActivity.java` | `VERSION_CODE` 常量 2 → **3**（与清单一致，触发升级后一次性 WebView 缓存清理） |
| `build.ps1` | 输出签名包路径 `DSH-Pocket-v1.1.apk` → **`DSH-Pocket-v1.2.apk`** |

## 6. 验证方式

1. `aapt2 compile` / `aapt2 link` 无错误（新增位图被正确编译进资源）。
2. `javac` + `d8` + `zipalign` + `apksigner` 全链通过，`apksigner verify` 输出通过。
3. 检查产物 APK 内确实包含各密度图标资源（可用 `aapt2 dump` 或解包核对）。
4. 输出 `DSH-Pocket-v1.2.apk` 并报告体积。
5. `plugin-safety` 体检（本次改动在 `pocket-apk` 工程，不影响 DSH 插件树，但按惯例改动后跑一次确认无关联破坏）。

## 7. 范围边界（不做的事）

- 不改网页内容与 WebView 逻辑（`HOME_URL`、缓存清理、返回键行为均保持原样）。
- 不做启动闪屏、不做 App 内欢迎页（用户本次选择仅「应用图标」）。
- 不改签名密钥（沿用现有 `pocket.keystore`）。
- 不做与图标无关的清理或重构。
