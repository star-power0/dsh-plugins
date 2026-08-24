# dsh-tool-memory-lite

极简记忆工具插件。只有模型明确调用记忆工具时才写入，不会自动记录对话。

## 工具与存储

- `memory_save`：保存或更新项目、知识或每日流水记忆。
- `memory_read`：读取指定记忆。
- `memory_list`：列出记忆。
- `memory_forget`：删除指定记忆。
- 存储位置：`$DSH_HOME/memory/projects/`、`knowledge/`、`journal/`。
- 使用锁文件和临时文件 rename，避免并发写入破坏 Markdown。

## 运行边界

Host 入口：`index.js`。插件只注入 `tools`，不创建 Client UI、HTTP 路由或模型提示自动写入逻辑。Web/Desktop 两端通过 Profile patch 手工注册，配置项为 `root`。

## 验证

回归：`A:/DeepSeekHarness/maintenance/test-memory-v2.mjs`。

本插件不进入 `dsh.profile.bundles`，不要使用 `dsh plugin add` 接入。
