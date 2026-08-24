# dsh-reasoning-slider

DeepSeek Harness 插件：**5 档思考强度**。两个半区各解决一半问题：

- **host 半区**（`index.js`）：自动给 `llm-pi-ai` 下所有**未声明** `reasoningEfforts` 的自定义网关模型注入默认 5 档（off/low/medium/high/max）；同时给所有**未显式声明** `compat.supportsDeveloperRole` 的模型补 `false`，让系统提示走最通用的 `system` role（部分严格中转网关对 OpenAI 推理模型的 `developer` role 写法返回 400，`system` 则几乎所有网关可接受）。以后在官方「模型」页新加的任何模型，`settings/updated` 一触发就自动带上思考强度与 system-role 兼容，无需手动配置。
- **client 半区**（`src/client/` → 构建为 `client.js`）：把输入框旁的模型选择器换成「模型列表 + 5 档动画滑块」（跟手拖动、越界回弹、松手吸附、火花呼吸特效，学自 [flyemFSB/dsh-reasoning-effort-hdbzq](https://github.com/flyemFSB/dsh-reasoning-effort-hdbzq)）。

## 档位

| 位置 | Effort id | 显示名 | 头像 |
|---|---|---|---|
| 1 | off | 牢梁 | 沿用原项目 |
| 2 | low | 梁子 | 沿用原项目 |
| 3 | medium | 梁白开 | 新生成 |
| 4 | high | 梁圣 | 沿用原项目 |
| 5 | max | 梁神 | 新生成 |

显示名/头像按位置取自 `src/client/assets/*.png` 文件名（`build.mjs` 的 `ASSET_ORDER`），纯显示层；提交到 `session.selectModel` 的是真实 Effort id，不写入模型请求。

## Host 注入规则

- 仅补缺失：模型已显式声明 `reasoningEfforts`（含 `false` 关闭）时**不覆盖**；已显式声明 `compat.supportsDeveloperRole`（含 `true`）时**不覆盖**。
- `models` 数组整体 set（DSH `settings.mutate` 的 applyPathOp 不支持数组下标路径）。
- 默认 wire 值：`off: null / low: "low" / medium: "medium" / high: "high" / max: "max"`（OpenAI 兼容 `reasoning_effort` 标准写法）。网关要求不同拼写时，改 `index.js` 的 `DEFAULT_EFFORTS`。
- 默认 role 兼容：`compat.supportsDeveloperRole: false`（系统提示用 `system` role）。网关确实支持 `developer` role 时，可在模型配置里显式设 `compat: { supportsDeveloperRole: true }` 覆盖。
- **运行时强制（2026-08-22）**：官方 `dsh-llm-pi-ai` 的 `compatProfile` schema 只透传 `thinkingFormat` / `supportsReasoningEffort`，settings 里的 `supportsDeveloperRole` 在模型 materialize 时被丢弃、从未到达 pi-ai。因此本插件额外监听 `llm/stream` waterfall：对声明 `supportsDeveloperRole: false` 的模型，把 system 提示并入首条 user 消息并短路重放，使 pi-ai 不再生成 `developer`/`system` 首条消息——严格网关（如 nova）必接受。该拦截同时覆盖 `modlens-*` 包装 provider（自动剥前缀匹配上游配置）。

## 构建

```sh
npm install        # esbuild / lightningcss / pngjs / jpeg-js
node build.mjs     # gen-assets（图片内嵌压缩）+ 打包 client.js
```

## 回归

```sh
node A:/DeepSeekHarness/maintenance/test-reasoning-slider.mjs
```

## 卸载

移除 web/desktop 两个 profile 的 `package.json` link 依赖与 `cordis.patch.yml` 的 `reasoning-slider` insert，删除插件目录，`pnpm install`。内置模型选择席位自动恢复。

## 许可

MIT。头像：3 张沿用 flyemFSB 原项目素材，2 张为 AI 生成动画图；图片素材的第三方权利归原权利人。