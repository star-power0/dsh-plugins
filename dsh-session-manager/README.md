# dsh-session-manager

会话管理插件。在设置页列出工作区会话，并提供彻底删除能力；删除后通过墓碑记录避免 Host 内存中的旧会话再次出现在侧栏。

## 运行边界

- Host 入口 `index.js` 注册 `/session-manager/list` 和 `/session-manager/delete`。
- Client 入口 `client.js` 提供设置页 UI。
- 删除会话数据目录、解除工作区归属并清理 projection cache；这是破坏性操作，应在 UI 中明确确认。
- 墓碑文件为 `$DSH_HOME/storages/session_manager_deleted.json`。
- Web/Desktop 两端均通过 `link:` 依赖和 Profile patch 手工注册。

## 验证

回归：`A:/DeepSeekHarness/maintenance/test-session-manager-window.mjs` 及会话删除相关维护脚本。修改后至少验证删除、刷新和重启三条路径。

本插件不进入 `dsh.profile.bundles`，不要使用 `dsh plugin add` 接入。
