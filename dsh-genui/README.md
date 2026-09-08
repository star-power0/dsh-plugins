> **来源与许可**：基于 [omdsh-dev/dsh-genui](https://github.com/omdsh-dev/dsh-genui)（MIT）开发，本地适配 rc.6 双通道渲染与 slash 候选过滤。详见仓库根目录 [README.md](../README.md) 的来源与许可总表。

**本地改动（Local modifications）**：
- tsconfig 路径本地化（上游指向作者本机源码树，本机无法构建）
- 原版 rc.6 宿主无 fence-registry 扩展点：补 DOM 通道渲染（MutationObserver 接管 + 结构兜底）
- 修复 rc.6 壳上 dsh-ui 围栏静默不渲染问题
- v0.8.9 应运营者要求移除 `render_ui` 工具、`/panel` 命令与会话面板 dock——```dsh-ui 围栏成为唯一 UI 通道；`panel`/`append` 字段无效，旧 `panel:true` 围栏降级为内联渲染
- Safari 无锚点行降级链与一次性告警
# dsh-genui

## 项目简介

dsh-genui（包名 `@omdsh-dev/dsh-genui`，MIT 许可）是面向 DeepSeek Harness 的生成式 UI 插件。模型在回答中以 `dsh-ui` 代码围栏输出 JSON 规格，插件在浏览器端将其渲染为可交互组件——布局、卡片、表格、图表、函数图、表单、测验、Mermaid 图与 3D 场景等 30 余种白名单类型。带 `action` 的控件在交互时把事件回传模型，模型据此更新界面，形成「界面 → 交互 → 模型更新界面」的闭环；组件状态按「会话 + 内容指纹」持久化。插件随包提供宿主端插件（向系统提示注入 dsh-ui 围栏词汇表）、浏览器端渲染器与 `genui` 技能（SKILL.md）。

## 功能特性

- **回答即界面**：组件内嵌于回答并流式渲染，边生成边出现，无需等待整段回答完成。
- **30+ 组件**：卡片、表格、图表、表单、标签页、折叠面板、文件树、时间线、diff 等白名单组件。
- **函数图**：`plot` 绘制曲线，参数滑块拖动实时重绘，支持自动动画。
- **测验与本地判卷**：`quiz` 点选判题并给出解析，支持重试；带 `action` 时答案同时回传模型（判题保持本地即时）。多道选择题由每题的 `radio`（`group` + `answer` + `explanation`）与一个 `submit` 按钮构成：全部作答后一次提交，分数、每题对错与解析即时在界面呈现，零模型往返；题目随后锁定，「重新作答」本地重置（可选 `resetAction` 通知模型）。
- **状态持久化**：答案、交卷锁定与输入值按「会话 + 内容指纹」自动保存；刷新页面或重开会话原样恢复，重渲染相同内容保留用户状态，新内容自动从头开始；上限 200 块，LRU 淘汰。
- **表单语义**：`input` 回车、`textarea` Ctrl+Enter 即时提交（`submit:true`）；带 `id` 的字段值汇入 `submit` 的 `fields`。
- **本地优先**：界面可自行完成的状态变化（判卷、判题、重置、展开、选中）一律本地即时完成；`action` 仅用于必须模型参与的操作（生成内容、执行工具、下一步建议）。
- **事件循环**：带 `action` 的按钮/开关/输入/下拉/复选/单选/文本域/测验在点击或失焦时回传模型；同名 `action` 300 ms 尾沿防抖，连点合并为一次（以最后一次值为准）。
- **唯一通道**：```dsh-ui 围栏是唯一的 UI 输出方式，组件渲染在回答正文里（本地 v0.8.9 起已移除 `render_ui` 工具与会话面板）。
- **围栏校验**：`validate_dsh_ui` 工具在发出复杂围栏前做 JSON 预检，可修复的错误直接返回修好的 JSON。
- **自愈与上限**：每个围栏经规格守卫——坏节点静默丢弃、数值钳位、字符串截断，整树 ≤200 节点、≤8 层嵌套。
- **图错误自愈**：Mermaid 渲染失败自动修复重试（剥离反引号、引号化中文/空格标签、移除 `<br/>`），仍失败才降级为源码。
- **可访问性**：标签页/折叠/开关/进度条带完整 ARIA 与键盘导航（方向键切页、Home/End 跳转）。
- **零打扰**：未安装插件时围栏仅为代码块，不报错、不污染会话。

## 渲染通道

插件内置两套渲染通道，启动时自动选择，不依赖特定宿主版本：

- **Registry 通道**：宿主提供 `fence-registry` 扩展点（新版构建）时，围栏经宿主流式渲染管线注册，与宿主无缝配合。
- **DOM 通道**：宿主无该扩展点（含原版 DSH 与旧版构建）时，插件观察会话 DOM 自行挂载渲染树；支持流式渲染与多表面发现（`md-code-block`、`.code-block` / `.code-block-small`，以及「banner 标注 `dsh-ui` 且含 `<pre>` 正文」的结构兜底）。

无论走哪条通道，组件、交互与持久化行为一致。

## 安装与接入

本地接入采用双端手工注册：Web 与 Desktop 两个 profile 的 `package.json` 以 `link:` 依赖指向插件目录（依赖 key 使用带 scope 的包名 `@omdsh-dev/dsh-genui`），`cordis.patch.yml` 登记实例（id `genui`，name `@omdsh-dev/dsh-genui`）。插件不写入 `dsh.profile.bundles`，以免与手工 insert 双加载导致 Host 启动失败。

运行时依赖在插件目录内以 `pnpm install --prod --ignore-scripts` 安装（react 18.3.1 与 8 个 `@deepseek-ai/*` rc.6 peer 包）。

> 注意：对刚克隆的目录直接使用 `link:` 不会安装插件依赖（mermaid / three / react），渲染器将无法工作。本地已先执行 `pnpm install` 再 link，规避该问题；仅本地开发迭代使用 `link:` 模式。

## 构建

宿主端入口为 `lib/index.js`（`apply` + 注入 `systemPrompt`），客户端入口为 `lib/client.js`（`dsh.client.platform: "web"`，Desktop 端同样加载）。mermaid 与 three.js 引擎作为按需资产（`lib/assets/*.js`）由插件自注册 HTTP 路由托管，`lib/client.js` 体积约 112 KB。

本地构建：

```sh
tsc -p tsconfig.json
tsdown
```

完整校验（类型检查 + 全量测试 + 构建）：

```sh
pnpm run check
```

## 使用说明

安装并重启后，在新会话中让模型「用 dsh-ui 输出」即可。组件 JSON 语法见随包 [SKILL.md](./SKILL.md)；本地技能已置于 `dsh-home/skills/genui/SKILL.md`，由技能目录实时识别。

## 安全

- 组件类型白名单，模型无法注入 HTML 或脚本。
- 函数表达式经独立解析器处理，不使用 `eval`。
- 颜色字段格式白名单（hex / rgb / hsl / `var(--dsw-*)`）。
- 链接仅允许 http(s) 与 mailto。
- 秘密禁令：不得索取密码、API Key、访问令牌、恢复码等秘密；密码输入即使出现也保持打码、不持久化、不进表单收集。
- 规格守卫：整树 ≤200 节点、≤8 层嵌套，坏节点静默丢弃。

## 已知限制

无。
