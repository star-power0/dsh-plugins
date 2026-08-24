> **来源与许可**：基于 [WYH66666666/DSH-Transparent-UI-Plugin](https://github.com/WYH66666666/DSH-Transparent-UI-Plugin)（@deepseek-ai/dsh-client-ui-aqua 1.3.0，MIT）开发，本地适配为 1.3.1（独立设置页、本地构建链）。详见仓库根目录 [README.md](../README.md) 的来源与许可总表。

**本地改动（Local modifications）**：
- 上游 1.3.0 → 本地 1.3.1：补充 bundle patch 声明并修正包名 scope
- 设置入口从「通用设置」行项改为独立设置页（`settings.section`，标签「玻璃主题」）
- 本地 `build.mjs` 构建链（esbuild + CSS Modules，复刻 tsdown 产物形态）
- 总开关改为玻璃风格滑轨控件；移除插件列表卡片避免重复入口
# @deepseek-ai/dsh-client-ui-aqua

## 项目简介

Aqua（包名 `@deepseek-ai/dsh-client-ui-aqua`，本地版本 1.3.1，基于上游 1.3.0，MIT 许可）是 DeepSeek Harness 网页界面的一层纯客户端玻璃拟态主题。顶栏、侧边栏、输入框、统计行与轨迹视图均呈现磨砂玻璃质感，并支持自定义图片或视频作为背景。关闭总开关即完整还原原生界面，不修改 DSH 任何一行源码。

## 功能特性

- **双模式**：**云母效果**将布局重构为悬浮玻璃卡片（模糊度、磨砂度可调）；**兼容模式**保持原版排版不变，仅将材质替换为通用玻璃，其他插件的界面同样自动玻璃化。
- **自由背景**：流体板（色调可调）或自定义壁纸（铺满页面、保持比例，可单独调节模糊度与磨砂度）；浅色壁纸适合浅色模式，深色壁纸适合深色模式。
- **背景亮度**：自动跟随解析出的深浅模式——深色模式 0–50 压暗、浅色模式 50–100 提亮，50 保持不变。
- **粒子鲸鱼**：deepseek.com/harness 同款粒子鱼（官网粒子引擎 2D 移植），显示于聊天区域中央（不含侧边栏）；深色模式白粒子、浅色模式灰粒子，可开关。
- **Harness 光泽铭牌**：深色模式下侧边栏铭牌采用官网同款「Harness」药丸（135° 渐变描边 + 柔光），浅色模式保持原版铭牌。
- **边缘渐变模糊**：页面顶部/底部各 5px 渐变模糊带，悬浮于聊天内容上层，内容滚至边缘渐入模糊。
- **附加视觉效果**：小鱼/气泡、网格、鼠标辉光、悬停下压等，均可在设置中开关。
- **一键还原**：关闭总开关即完整还原原生界面，所有效果随插件卸载一并消失。

## 安装与接入

本地接入采用双端手工注册：Web 与 Desktop 两个 profile 的 `package.json` 以 `link:` 依赖指向插件目录，`cordis.patch.yml` 登记唯一实例（id `ui-aqua`，name `@deepseek-ai/dsh-client-ui-aqua`）。插件不写入 `dsh.profile.bundles`，以免与手工 insert 双加载导致 Host 启动失败。

## 构建

插件主要逻辑位于浏览器端 `lib/client.js`，宿主端 `lib/index.js` 的 `apply()` 为空。本地 `build.mjs` 构建链（esbuild + CSS Modules）复刻 tsdown 产物形态：`window.__ModuleLoader__.load` + 每文件 `style[data-plugin-css]` 注入 + 哈希类名（哈希统一加字母前缀，避免 CSS 类名以数字开头而失效）。修改 `src/client/*` 后运行：

```sh
node build.mjs
```

## 使用说明

刷新界面后 Aqua 默认开启。总开关与全部玻璃调节位于独立设置页「玻璃主题」，包含模式、模糊度/磨砂度（云母模式）、流体颜色、背景亮度、背景（流体/壁纸）与壁纸设置，以及粒子鲸鱼开关。关闭总开关后调节区自动隐藏。

## 配置

开关与旋钮状态保存于浏览器 `localStorage`；视频壁纸使用 IndexedDB，Chromium 下可使用持久化 File System Access 文件句柄。插件不注册工具、不注入系统提示、不新增 Host 路由。

## 安全

代码审计未发现 `fetch`、`XMLHttpRequest`、`WebSocket`、`eval` 或 `new Function`。

## 已知限制

- 与 `dsh-plugin-wallpaper-engine` 均可能修改背景/玻璃材质，不建议两套同时全开：使用 Aqua 时建议关闭另一插件的视觉效果，使用另一主题时建议关闭 Aqua。
- Aqua 默认开启，开关状态由浏览器本地持久化。
