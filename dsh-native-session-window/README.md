> **来源**：本项目为 DeepSeek Harness 插件原创开发，许可证 MIT。

# dsh-native-session-window

Desktop 会话窗口插件。在主窗口标题栏提供“在新窗口打开”入口，通过同一 Host 的 loopback Web Server 在新的 Electron `BrowserWindow` 中加载指定会话。

## 运行边界

- Desktop 模式创建原生窗口；Web 模式保持安全降级，不创建 Electron 窗口。
- 每个 `sessionId` 复用一个窗口，并发打开同一会话共享一次加载。
- 打开第二个桌面会话窗口后，当前两个 DSH 窗口按目标显示器工作区左右等分，并保留 8px 分隔，避免默认窗口位置造成覆盖。
- 新窗口启用 `contextIsolation`、`sandbox`、`nodeIntegration: false` 和 `webSecurity`。
- 只允许同一 loopback origin 导航，外部 http(s)/mailto 链接交给系统应用。

## 入口与验证

- Host：`index.js`
- Client：`client.js`
- Profile 接入：Web/Desktop 两端 `link:` + `cordis.patch.yml` 手工 `insert`
- 回归：`A:/DeepSeekHarness/maintenance/test-session-manager-window.mjs`

本插件不进入 `dsh.profile.bundles`，不要使用 `dsh plugin add` 接入。
