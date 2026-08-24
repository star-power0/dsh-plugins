> **来源**：本项目为 DeepSeek Harness 插件原创开发，许可证 MIT。

# dsh-mcp-background

后台 MCP 连接插件。每个 Profile patch 实例连接一个 MCP 服务，连接完成后把工具注册为 `mcp__<serverName>__<toolName>`，并在设置页提供连接、断开、重连、启用和禁用操作。

## 当前接入

Web/Desktop 两端各配置 7 个实例：agent-reach、codegraph、mineru、tavily、chrome-devtools、github、firecrawl。具体命令、URL 和环境变量只在 Profile patch 中配置，不写入插件代码。

## 运行边界

- 初次连接在后台执行，不阻塞 Host 启动。
- 连接失败使用指数退避重连，状态接口会脱敏，不返回命令、参数、URL、headers 或凭据。
- 禁用服务写入 `$DSH_HOME/storages/mcp_background_disabled.json`。
- 工具名称和重复 serverName 由 Profile 注册体检约束。

## 入口与验证

- Host：`index.js`
- Client：`client.js`
- Profile 接入：两端 `package.json` 的 `link:` 依赖和 `cordis.patch.yml` 手工 `insert`
- 回归：`A:/DeepSeekHarness/maintenance/test-mcp-background-startup.mjs`、`test-mcp-manager.mjs`

本插件不进入 `dsh.profile.bundles`，不要使用 `dsh plugin add` 接入。
