# dsh-client-ui-custom · 客制化 DSH

> **来源与许可**：基于 [Yoli-mi/dsh-client-ui-custom](https://github.com/Yoli-mi/dsh-client-ui-custom)
> （npm `@ha-na-bi/dsh-client-ui-custom`，MIT，上游 LICENSE 保留于本目录 `LICENSE`）的本地维护副本。
> 本地版本 `0.1.0-rc.6`，自上游引入后由本机持续迭代（改动见下与 `CHANGELOG.md`）。

**本地改动（Local modifications）**：

- **本地构建链**：上游经 monorepo tsdown 预设构建，本环境不存在该预设。新增 `build.mjs`
  （仅依赖 esbuild），复刻两种产物形态——`lib/index.js`（node 半边，ESM，`@deepseek-ai/*`
  保持 external）与 `lib/client.js`（浏览器半边，`window.__ModuleLoader__.load` 信封 +
  `style[data-plugin-css]` 注入 + tsdown 同款 `<hash>_<name>` scoped 类名）。
- **重建器修正（2026-08-28）**：原样保留 CSS-module 的 `:global(.x)` 包装会让浏览器整条丢弃
  规则（`#root` 毛玻璃变死规则、`motion.module.css` 全部 28 条 `.dsu-motion-*` 动效全灭）。
  构建器改为正确剥离 `:global()`，并只 scope 类名、保留 ID。
- **玻璃档位联动修复（2026-08-29）**：`wallpaperBlur` 曾在启动时由 `glass` 派生后被冻结，
  设置页后续只更新 `glass`，导致切到「不透明」时模糊半径不跟着归零。改为运行时按当前档位
  重新解析（off = 0px / light = 6px / frosted = 14px / mica = 22px）。
- **新增「文字颜色」调节（2026-08-28）**：新增 10 个字符串字段（`inkPrimary` /
  `inkSecondary` / `inkTertiary` / `inkCaption` / `inkDimmed` 及其深色覆盖），覆盖全 UI
  共用的 label 阶梯；未设置时回落到官方阶梯原值。同步移除死旋钮「聊天列不透明度」。
- **设置页视觉层次（2026-08-29）**：设置壳、外观页、动效页增加卡片/分组/导航选中态/行边界，
  降低深色背景下的连片感（纯样式，不改设置读写与 RPC 行为）。
- **弹窗可读性**：本插件不写 `--dsw-specific-menu` 等弹层 token；弹层半透明的修复落在
  `dsh-plugin-wallpaper-engine` 与 `dsh-client-ui-aqua`（见该两处 CHANGELOG）。

## 简介

`dsh-client-ui-custom` 是一个纯前端插件，提供浮动历史记录条、用户消息 Markdown 渲染、
外观调试、插件市场、快捷键、用量统计与动效功能。所有功能默认关闭，不配置时保持与原生
界面一致，全程零 shell 改动。

- **修改了通用设置项** —— 在「设置 → 通用」里新增历史记录条（位置、数量）和用户消息
  Markdown 渲染开关；
- **修改了插件项** —— 在「设置 → 插件」里新增「插件市场」；
- **新增了四个设置页** —— 「外观」「快捷键」「用量统计」「动效」。

## 功能选择（按需安装）

插件由七个**相互独立**的功能模块组成：`appearance`（外观）、`shortcuts`（快捷键）、
`usage`（用量统计）、`history`（历史记录条）、`markdown`（用户消息 Markdown 渲染）、
`marketplace`（插件市场）、`motion`（动效）。可在插件配置里用 `features` 白名单选择：

```yaml
- id: ui-custom
  name: '@ha-na-bi/dsh-client-ui-custom'
  config:
    features: [appearance, motion, markdown]   # 本机当前启用
```

`features` 缺省或为空时，七个功能全部启用。本机当前配置为
`[appearance, motion, markdown]`（见双端 `cordis.patch.yml`）。

## 设置改动一览

| 位置 | 类型 | 内容 |
| --- | --- | --- |
| 设置 → 外观 | 新增页面 | 主题定制：壁纸、玻璃、强调色、表面不透明度、字体与质感 |
| 设置 → 快捷键 | 新增页面 | 自定义快捷键：新建对话、切换模型、思考强度等 |
| 设置 → 应用用量 | 新增页面 | 用量统计：四窗口聚合、趋势图、会话用量排行 |
| 设置 → 动效 | 新增页面 | 对话/侧边栏/新建对话入场动效与选中框动效，含三套预设 |
| 设置 → 通用 | 修改原有页 | 新增浮动历史条（位置、数量）、用户消息 Markdown 渲染开关 |
| 设置 → 插件 | 修改原有页 | 新增「插件市场」，收录第三方插件目录 |

## 外观（设置 → 外观）

外观设置提供背景、玻璃档位、强调色（可自动从背景取色）、各表面不透明度、色调渐变、
暗色遮罩、字体与字号、主题色滚动条与内嵌晕影等自定义项，并可将 ui-theme 的**主题偏好**
（浅色 / 深色 / 跟随系统）合并进本栏。改动通过 `ui-custom` settings 命名空间保存并
**即时生效**（无需重启）。支持小窗预览，全屏预览按 F2 退出。

**预设（Preset）** —— 内置六种预设，各自独立风格（预设生效时你自己的 `wallpaper`
仍会叠加在其下）：

| id | 名称 | 风格 |
| --- | --- | --- |
| `ink-teal` | Ink Teal 黛青 | 青玉色渐变，静谧沉稳 |
| `ink-blue` | Ink Blue 黛蓝 | 黛蓝渐变，深邃克制的蓝 |
| `dusty-rose` | Dusty Rose 藕荷 | 藕荷色渐变，温润柔和的粉 |
| `apricot-gold` | Apricot Gold 杏金 | 杏金色渐变，温雅低调的金 |
| `mist-gray` | Mist Gray 雾灰 | 雾灰色渐变，清冷安静的灰蓝 |
| `ink-violet` | Ink Violet 墨紫 | 墨紫色渐变，沉静神秘 |

**玻璃档位** —— `glass` 是透明度的开关；显式设置 `wallpaperBlur` 时总是优先于档位默认半径：

| 档位 | 模糊 | 饱和度 | 气质 |
| --- | --- | --- | --- |
| `off` | 0px | 1.0 | 不透明，无玻璃 |
| `light` | 6px | 1.15 | 轻微玻璃 |
| `frosted` | 14px | 1.25 | 强毛玻璃（默认） |
| `mica` | 22px | 1.1 | 柔和静态质感，保留壁纸色相 |

**主题配置项** —— 所有字段均可选；显式配置永远优先于预设：

| 键 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `preset` | string | `''` | 预设 id（见上表）；`''` = 不使用预设 |
| `wallpaper` | string | `''` | 壁纸 URL/路径（Web 可访问）；空字符串 = 插件保持关闭 |
| `wallpaperBlur` | number 0–60 | 玻璃档位默认 | `#root` 模糊半径（px）；显式值优先于玻璃档位 |
| `glass` | enum | `frosted` | `off` / `light` / `frosted` / `mica`（见玻璃档位表） |
| `accent` | string | `#4176e6` | 强调色，整套 deepseek 色阶由它派生 |
| `autoAccent` | boolean | `false` | 从壁纸自动派生强调色（成功后覆盖 `accent`） |
| `surfaceOpacity` | number 0–100 | `100` | 主表面不透明度（聊天/细节列） |
| `sidebarOpacity` | number 0–100 | `100` | 侧栏不透明度 |
| `inputOpacity` | number 0–100 | `100` | 输入框不透明度 |
| `codeBlockOpacity` | number 0–100 | `100` | 代码块/行内代码不透明度 |
| `darkSurfaceOpacity` | number 0–100 | `surfaceOpacity` | 暗色模式表面不透明度（独立档位） |
| `inkPrimary` | string | `''` | 主文字颜色（聊天正文/侧栏会话标题/面板标题）；空 = 默认 |
| `inkSecondary` | string | `''` | 次要文字颜色（副标题/列表元信息/任务步骤）；空 = 默认 |
| `inkTertiary` | string | `''` | 三级文字颜色（时间戳/弱说明/上下文注入内容）；空 = 默认 |
| `inkCaption` | string | `''` | 说明文字颜色（最小号说明）；空 = 默认 |
| `inkDimmed` | string | `''` | 弱化文字颜色（更浅的辅助文字）；空 = 默认 |
| `darkInkPrimary` … `darkInkDimmed` | string | `''` | 上述五档的深色模式覆盖；空 = 跟随浅色值 |
| `gradient` | string | `''` | 亮色模式下叠加在壁纸上的渐变；空 = 无 |
| `darkScrim` | number 0–100 | `0` | 暗色模式下壁纸上的遮罩强度 |
| `fontFamily` | string | `''` | 字体栈覆盖；空 = 主题默认 |
| `scrollbarAccent` | boolean | `false` | 滚动条使用强调色 |
| `vignette` | boolean | `false` | 应用根节点的柔和内嵌晕影 |
| `customCss` | string | `''` | 原样追加的自定义 CSS（逃生舱） |
| `customVars` | object | `{}` | 额外写到 `<html>` 上的 CSS 自定义属性（逃生舱） |

完整示例：

```yaml
config:
  preset: 'ink-teal'
  wallpaper: 'https://example.com/wall.jpg'
  glass: 'mica'              # 或 wallpaperBlur: 8 自定义半径
  autoAccent: true           # 强调色由壁纸自动派生
  inkPrimary: '#0f1115'
  darkInkPrimary: '#f9fafb'
  customCss: |
    /* 逃生舱：原样注入 */
```

## 快捷键 / 用量统计 / 动效 / 历史条 / Markdown

各功能页的自定义项与预设由 `src/client/` 下同名子目录实现，均可在设置页内即时调整并持久化。
本机启用 `appearance` + `motion` + `markdown` 三项（见上「功能选择」）。

## 安装与接入（本机）

与其它本地插件一致：源码在 `profiles/plugins/dsh-client-ui-custom/`，Web 与 Desktop 两个
profile 的 `package.json` 以 `link:` 指向该目录，各自 `cordis.patch.yml` 登记唯一
`ui-custom` insert。**不写入 `dsh.profile.bundles`**（bundles 栈与手工 insert 同时存在会
触发 `duplicate loader entry id` 并使 Host 启动失败）。

```yaml
- id: ui-custom
  name: '@ha-na-bi/dsh-client-ui-custom'
  config:
    features: [appearance, motion, markdown]
```

## 构建

```sh
node build.mjs      # 改 src/** 后执行；产出 lib/index.js 与 lib/client.js
```

构建器复用 `dsh-client-ui-aqua/node_modules` 里的 esbuild（不重复安装），先试裸导入再回退
相对路径。**不要手改 `lib/*.js`**——那是构建产物。

## 运行边界

- `appearance` 与 `dsh-client-ui-aqua` / `dsh-plugin-wallpaper-engine` 存在视觉层重叠；
  本机当前启用 `appearance`，未与 aqua 同时全开。
- `motion` 与 aqua 的少量页面动画存在局部重叠。
- `markdown` 只 shadow 用户/steering 聊天节点，不替代 GenUI 的 `dsh-ui` 围栏或 IDE 的
  `.md` 文件预览。
- 基于 `deepseek-harness 0.1.0-rc.6` 开发，rc 阶段 API 可能漂移；升级时优先核查
  `src/client/` 内的契约点。

## License

MIT（继承自上游）。上游版权声明保留于本目录 `LICENSE`（Copyright (c) 2026 Yoli-mi）。
本地改动同样以 MIT 释出。
