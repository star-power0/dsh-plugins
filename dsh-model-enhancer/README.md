# dsh-model-enhancer

模型设置增强插件。它在设置页为自定义模型提供图片输入开关、上下文窗口和最大输出快捷设置，并提供视觉桥模型列表偏好。

## 运行边界

- Host 入口 `index.js` 只声明插件，不提供额外 HTTP 路由。
- Client 入口 `client.js` 注册设置页并通过官方 settings API 读写模型配置。
- 当前版本不会替换会话历史中的图片块；纯文本模型的图片分流由 `dsh-modlens` 请求阶段处理。
- Web/Desktop 两端均通过 `link:` 依赖和 Profile patch 手工注册。

## 验证

- 回归：`A:/DeepSeekHarness/maintenance/test-model-enhancer-image-fallback.mjs`
- 入口检查：`node --check index.js`、`node --check client.js`

本插件不进入 `dsh.profile.bundles`，不要使用 `dsh plugin add` 接入。
