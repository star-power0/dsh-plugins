# dsh-workspace-picker CHANGELOG

## 0.1.0 (2026-08-23)

- 初始版本：Windows 上「添加工作区」优先调用系统文件夹选择器（复用
  `dsh-plugin-marketplace.pickDirectory` 的 PowerShell `FolderBrowserDialog`），
  可直接切换盘符；失败/不可用时注销占用者，官方 browse 选择器作为兜底保留。
- 不改动任何官方 `@deepseek-ai/*` 包或 Desktop `app.asar.unpacked` 代码。
- 验证：`maintenance/test-workspace-picker.mjs`、`plugin-safety check`、
  `dsh --profile web/desktop --help`、DSH Desktop 重启后实际跨盘选择。
