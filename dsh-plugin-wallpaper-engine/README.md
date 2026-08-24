> **来源与许可**：基于 [elysia395/dsh-wallpaper-engine](https://github.com/elysia395/dsh-wallpaper-engine) 0.1.4（MIT）开发，本地增强独立设置页、自绘图标与壁纸类型过滤。详见仓库根目录 [README.md](../README.md) 的来源与许可总表。

**本地改动（Local modifications）**：
- 注册点从「通用设置」行项改为独立设置页（`settings.section`，标签「动态壁纸」）
- 自绘页面图标 WallpaperGlyph（画框 + 山峦 + 光点）
- 选择器只列可渲染的 Video/Web 壁纸，隐藏 Scene/Application 类型
- 源码经本地构建链重建 lib/client.js（上游仓库中的产物为过期版本）
# dsh-plugin-wallpaper-engine

## 项目简介

dsh-plugin-wallpaper-engine（包名 `dsh-plugin-wallpaper-engine`，0.1.4，MIT 许可）将本机 Wallpaper Engine 壁纸库渲染为 DeepSeek Harness 网页界面（`dsh web`）后方的动态背景。插件自动发现本机 Wallpaper Engine 安装、列出壁纸，并将可移植类型（Video `.mp4` 与 Web/HTML）渲染至对话界面后方，配以 iOS 风格液态玻璃效果；提供四个实时滑动条、多列表轮播与设置页缩略图选择器。

## 功能特性

- **壁纸发现**：自动定位本机 Wallpaper Engine 安装（读取注册表 `HKCU\Software\Valve\Steam` 的 `SteamPath` 并解析各库的 `libraryfolders.vdf`，识别含 appid `431960` 且存在 `wallpaper32.exe` 的目录），随后枚举 `projects/defaultprojects`、`projects/myprojects` 与 `steamapps/workshop/content/431960` 下的 `project.json`。
- **可移植类型**：Video（`.mp4`）经 `<video>` 播放，Web（HTML）经 `<iframe>` 加载；Scene（原生 3D）与 Application 类型不可内嵌。
- **液态玻璃**：iOS 风格玻璃效果，以四个实时滑动条调节壁纸与界面的融合（见「使用说明」）。
- **多列表轮播**：自定义轮播列表，每列表独立设置切换间隔（1/5/10/30/60/120 分钟）与顺序（顺序/随机）。
- **独立设置页**：以 `settings.section` 注册（id `wallpaper-engine`，order 110，标签「动态壁纸」），配自绘页面图标 WallpaperGlyph（画框 + 山峦 + 光点）。
- **壁纸类型过滤**：选择器只列可渲染的 Video/Web 壁纸，隐藏 Scene/Application 类型；统计行显示「已隐藏 N 个 Scene/应用类」。

## 工作原理

- **宿主端**（`lib/index.js`）：定位 Wallpaper Engine 安装、枚举壁纸，并在 DSH webserver 注册同源 HTTP 路由：
  - `GET /wallpaper-engine/inventory` → 壁纸 JSON 列表
  - `GET /wallpaper-engine/media/<token>` → 视频 / HTML（支持 Range）
  - `GET /wallpaper-engine/preview/<token>` → 预览图
- **客户端**（`lib/client.js`）：拉取壁纸列表，将选中壁纸渲染至应用列后方的固定图层，并提供缩略图选择器。客户端标记 `dsh.client.platform: "web"` 且 `immediately: true`，Desktop 端同样加载。

## 安装与接入

本地接入采用双端手工注册：Web 与 Desktop 两个 profile 的 `package.json` 以 `link:` 依赖指向插件目录，`cordis.patch.yml` 登记唯一实例（id `wallpaper-engine`，name `dsh-plugin-wallpaper-engine`）。插件不写入 `dsh.profile.bundles`，以免与手工 insert 双加载导致 Host 启动失败。壁纸发现全自动，无配置项。

## 构建

宿主端 `lib/index.js` 为纯 ESM，无构建步骤。客户端 `lib/client.js` 为编译产物，由规范源文件 `src/client.js` 经 `scripts/build-client.mjs` 生成，输出 DSH 模块加载器要求的 `window.__ModuleLoader__.load({ id, factory })` 外壳。修改 `src/client.js` 后运行：

```sh
node scripts/build-client.mjs   # 从 src/client.js 重新生成 lib/client.js
node scripts/verify-client.mjs  # 校验生成产物
```

不要手改 `lib/client.js`。

## 使用说明

1. 打开独立设置页「动态壁纸」。
2. 在缩略图选择器中选择一个 Video 或 Web 壁纸，它将出现在界面后方。
3. 使用「暂停/播放」暂停视频壁纸，使用「关闭」清除壁纸；选择保存在浏览器 `localStorage`（键 `dsh-wallpaper-engine:selection`）。

四个滑动条即时生效，无需刷新页面：

| 滑动条 | 作用 | 范围 | 默认 |
|---|---|---|---|
| 壁纸模糊 | 模糊壁纸本身 | 0–60 px | 0 |
| 暗化 | 加深壁纸与文字之间的遮罩 | 0–90 % | 25 % |
| 边框 | 提高边框/分割线对比度 | 0–90 % | 35 % |
| 玻璃 | 玻璃面板（输入栏、气泡）的模糊半径 | 0–40 px | 24 |

轮播：以「新建」创建轮播列表，从库存勾选 Video/Web 壁纸，为每个列表设置切换间隔与顺序，勾选「自动轮转」后在该列表内循环；每列表至少 2 个可播放壁纸。首次使用自动导入第一个可播放的 WE 播放列表；编辑列表时可用「从 WE 播放列表导入」导入其他播放列表。

## 安全

- 不向模型暴露工具、提示或 schema，对 agent 零 token 开销。
- 媒体字节留在磁盘，持久化仅保存 URL + 模式 + 亮度。
- 宿主仅提供已枚举文件的媒体路由，不暴露任意文件系统。
- 无需 Wallpaper Engine 进程运行。

## 已知限制

- Scene（原生 3D）与 Application 壁纸无法内嵌，已从选择器隐藏。
- 浏览器需能自动播放静音 `<video>`（DSH 运行于 loopback，现代浏览器允许静音自动播放）。
- 媒体从本机 Wallpaper Engine 安装路径提供。
