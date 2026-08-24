# Changelog

## 2026-08-22

- 修复：nova 等严格网关对 OpenAI 推理模型 `developer` role 返回 400 的问题。
  官方 `dsh-llm-pi-ai` 的 `compatProfile` schema 只透传 `thinkingFormat` /
  `supportsReasoningEffort`，settings 里的 `supportsDeveloperRole` 在模型
  materialize 时被丢弃，导致 pi-ai 对配置了 reasoningEfforts 的推理模型回落
  自动检测为 `supportsDeveloperRole=true`，以 `role:"developer"` 发送系统提示。
  本插件新增 `llm/stream` waterfall 拦截：对声明 `supportsDeveloperRole:false`
  的模型，把 system 提示并入首条 user 消息并短路重放，使 pi-ai 不再生成
  developer/system 首条消息，严格网关必然接受。同时保留原有 settings 注入。
- 补充当前版本、Profile 接入和外部回归脚本说明。

## 0.1.0

- 当前运行版本：五档 reasoning effort 滑块和自定义模型兼容字段注入。
