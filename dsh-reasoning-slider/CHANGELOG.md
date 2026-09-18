# Changelog

## 2026-09-18 — 窄屏模型 chip 溢出与弹层跳变（LOCAL customization, dsh-home）

丞相反馈两条，实测同一个源头：**chip 的 `max-width: 240px` 大于它父容器
`CkKexa_root` 的实际宽度**，且 `.trigger` 是 `overflow: visible`：

1. **长模型名时压住右侧发送按钮**——`root` 193px 而 chip 240px，chip 右缘
   377 压过发送按钮左缘 336（重叠 41px）。
   → `.trigger` 的 `max-width` 改为 `min(240px, 100%)`：宽屏仍是 240px 上限，
   窄屏按可用宽度收敛。实测 chip 收回 193px、与发送键留 6px 间距。
2. **弹层「有时正、有时超出去」地跳变**——`.panel` 是 `right: 0` 相对 `.root`
   （宽度 = chip 宽度）对齐：模型名短时 chip 右缘落在屏幕中间，333px 宽的面板
   被推到视口左缘之外；模型名长时 chip 贴住右缘，面板又看着正常。此外 dsh-pocket
   侧曾用 MutationObserver 每轮重算 `translateX` 兜底，与插件自身渲染竞争，
   放大了抖动。
   → 定位逻辑收进组件：`ModelSlider.jsx` 新增 `placePanel()`，在面板打开时
   （`useEffect([open])`）与 `resize` 时**各量一次**，按实测位置平移进视口
   （左右各留 8px），之后不再重算；宽屏（≥1024px）不平移，保持原右对齐观感。
   同步移除 dsh-pocket 侧的每轮重算补丁（`mobile-apply.tsx`）与宽度兜底
   （`mobile.css.ts`），避免两套逻辑并存互相打架。
   → 实测：短 / 中 / 长三种模型名下面板均落在 `x:8`、`insideViewport: true`；
   打开后 2 秒内 transform 写入 0 次（旧逻辑存在反复重写）。
   宽屏回归：chip 240px、面板 `transform: none`、仍在视口内。

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
