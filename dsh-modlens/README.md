> **来源与许可**：合体插件——引擎部分基于 [liustack/modlens](https://github.com/liustack/modlens)（@liustack/modlens 3.18.0，MIT），守卫部分为 dsh-modlens-guard；本地将两者合体并补齐思考回传等修复。详见仓库根目录 [README.md](../README.md) 的来源与许可总表。

**本地改动（Local modifications）**：
- 合体结构：@liustack/modlens 引擎 + dsh-modlens-guard 守卫合并为单插件
- 思考回传修复：委派时对齐 replaySource，保住 reasoning_content（消除严格网关 400）
- 纯工具调用消息补 reasoning_content 占位（​）并同步 replayState.blocks
- 引擎读图失败时对不可写 Error.message（DOMException）改用包裹方式，不再掩盖真实原因
- 默认 visionProvider:false：引擎只贡献工具与设置卡，guard 独占请求时图片分流

# dsh-modlens

dsh-modlens 是 DeepSeek Harness（DSH）的视觉合体插件：将 [@liustack/modlens](https://github.com/liustack/modlens) 视觉引擎与 `dsh-modlens-guard` 能力分流守卫合并为单一插件，为纯文本模型提供图片读取能力。

> 本目录的 README、CHANGELOG、SECURITY 描述 DSH 合体插件；`engine/` 下同名文档描述内嵌的 `@liustack/modlens` 独立引擎。两套文档对应不同发布边界，请勿将 `engine/` 视为重复插件目录删除。

## 项目简介

DeepSeek 与 GLM 的主力对话模型为纯文本模型，无法直接读取图片。dsh-modlens 借助外挂视觉引擎为纯文本模型补上视觉能力，并在请求时按当前模型能力对图片进行分流：

- **多模态模型**：原样放行，保留原生图片能力；
- **纯文本模型**：将图片转换为 ModLens 结构化文字证据后再送入模型；
- **视觉桥不可用**：显式告知「图片未被读取」，而非静默忽略。

插件同时提供 `modlens_read_image` 工具与视觉引擎配置卡（`/modlens/config`），供模型与用户在会话中直接使用。

## 功能特性

- **能力感知的图片分流**：守卫以未包装的解析器判定当前模型能力，在 `agent/pre-step` 于请求时将纯文本模型的图片块替换为 ModLens 证据；多模态模型原样放行，未知能力安全默认，桥不可用时显式提示。
- **图片不重复读取**：上传附件按不可变 `attachmentId`（SHA-256 内容哈希）缓存成功证据并落盘持久化，进程重启后历史图片直接复用；`modlens_read_image` 的路径/URL 证据按 `path+prompt` 哈希在进程内缓存。两类缓存均不保存原图、明文路径或 URL，失败不缓存。
- **视觉桥模型**：守卫增量注册 `modlens-<upstream>` 包装模型，声明 `text + image` 能力，wire 层只复制并递归转换图片后委派真实纯文本上游；原生多模态模型不包装。失败关闭（fail-closed）：任一图片读取失败、桥未就绪或结果无效即终止请求，不调用纯文本上游。
- **思考回传兼容**：委派时对齐 replaySource，保住 `reasoning_content`，消除思考模式严格网关的 400 错误；纯工具调用消息补 reasoning_content 占位并同步 replayState.blocks。
- **发送前准入**：官方 Host 在 agent 运行前会拒绝纯文本模型的图片；守卫仅对这两处准入点、仅在桥就绪时临时补充 `image` 能力，使请求进入 `pre-step` 完成转写，不污染模型目录。
- **状态可观测**：提供 `/modlens-guard/status` 等状态接口，设置页「视觉状态」板块与对话尾部提示，全局状态四态可见。

## 目录结构

| 路径 | 说明 |
| --- | --- |
| `index.js` | 统一入口（`inject: tools/agents/attachments/llm`）：先 `engine.apply` 再 `guard.apply`，两套实现隔离 |
| `client.js` | 客户端 bundle（`dsh.client.platform: "web"`），由 `client-build.mjs` 合并 engine/guard 两个 client factory 生成 |
| `engine/` | 内嵌的 `@liustack/modlens@3.18.0` 固定副本（`dsh/` 插件半区、`dist/main.js` CLI 与运行依赖） |
| `guard/` | `dsh-modlens-guard` 完整副本 |
| `engine/dist/main.js` | 视觉引擎 CLI，`package.json` 的 `bin` 指向此处 |

修改引擎或守卫客户端源码后，需重新运行 `client-build.mjs` 重新生成 `client.js`。

## 安装与接入

本插件在 Web 与 Desktop 双端通过手工方式接入：

- 源码位于 `profiles/plugins/dsh-modlens/`；
- 双端 `package.json` 以 `link:` 依赖指向该目录；
- 双端 `cordis.patch.yml` 各登记一条 `dsh-modlens` insert（附带下述配置）。

插件**不写入 `dsh.profile.bundles`**，以避免与手工 insert 产生 `duplicate loader entry id` 双加载。

升级引擎前需先审查上游 diff 与 `CHANGELOG.md`，重跑本项目回归后再固定新版本。

## 配置

插件默认配置如下（两个 Profile 相同）：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `root` | `A:/DeepSeekHarness/dsh-home` | guard 持久化目录 |
| `visionProvider` | `false` | 引擎侧能力开关；关闭时引擎只贡献工具与设置卡 |
| `pasteToPath` | `false` | 粘贴转路径开关 |
| `autoRead` | `false` | 自动读图开关 |

视觉引擎自身的配置位于 `~/.modlens/config.json`，由引擎设置卡读写，浏览器侧不接触密钥。

内嵌引擎支持六种内置视觉服务（`gemini-api`、`openai`、`anthropic`、`antigravity-cli`、`claude-cli`、`kimi-cli`）与四类可复用本机 CLI 登录（Codex、OpenCode、Pi、Grok）；未钉死 provider 时按故障转移链依次尝试。配置命令与完整键位详见 `engine/README.zh-CN.md`。

## 使用说明

1. 在模型选择器中选择对应的 `(ModLens)` 视觉桥模型变体，或直接使用纯文本模型；
2. 粘贴图片或引用图片路径，正常提问；
3. 多模态模型直接读取；纯文本模型由守卫在请求时将图片转写为文字证据；桥不可用时明确提示「图片未被读取」。

视觉状态可在设置页「视觉状态」板块查看（15 秒轮询，支持立即探查），对话尾部会显示「ModLens · 已读取图片 / 图片读取失败」。

## 状态与可观测性

守卫提供以下状态接口：

- `GET /modlens-guard/status`：全局状态，四态 `ready / unconfigured / failing / off`，附带引擎、探查、计数与脱敏错误信息；
- `GET /modlens-guard/turn-status`：回合状态，仅返回 `reading / ready / failed`；
- `POST /modlens-guard/check-model`、`POST /modlens-guard/probe`、`POST /modlens-guard/vision-only`：模型检查、即时探查与仅视觉模式。

跨重启状态持久化在 `dsh-home/storages/modlens_guard_state.json`（脱敏、原子写）；`visionOnly` 偏好持久化在 `modlens_guard_preferences.json`。

## 安全与边界

- 图片会被发送到所配置的视觉服务；处理不可信图片时应固定使用 API 型引擎。
- `reuse.<harness>` 默认关闭，复用本机 CLI 登录需逐项授权。
- Antigravity 通道使用 `--dangerously-skip-permissions` 运行。
- 所有进入浏览器/状态接口的文本均经 `sanitize()` 脱敏，状态接口不返回密钥。
- 证据缓存不保存原图、明文路径或 URL；失败不缓存。
- 失败关闭（fail-closed）：视觉桥未就绪、读取失败或结果无效时终止请求，不将图片交给纯文本上游；持久会话保留原图，切回原生模型可继续使用。
- 不修改官方 Host 代码。

部分 OpenAI 兼容服务只返回 `summary`、省略 `layout` 或以自然语言结论正常结束；固定版 CLI 会补齐最小结构并标注不确定性。`finish_reason=length`、字段类型错误、空响应或服务不可用仍会失败关闭。

## 许可

MIT
