> **来源**：本项目为 DeepSeek Harness 插件原创开发，许可证 MIT。

# dsh-workspace-picker

DSH 工作区目录选择增强插件。

## 解决的问题

DSH Desktop 在 Windows 上会强制使用官方「浏览式」目录选择器（`browse`），它从用户主目录
（`C:\Users\huang`）起步、没有盘符列表入口，切换 D 盘等其它盘符只能手动输入路径。

本插件在不修改官方包的前提下，让 Windows 上「添加工作区」优先打开**系统文件夹选择器**
（PowerShell `FolderBrowserDialog`），可像原生资源管理器一样直接选择任意盘符目录。

## 工作原理

- 通过 `slots.inject` 向两个工作区 `directoryFlow` 洞（hero + sidebar）注册更高优先级的
  无渲染占用者（priority -100，官方 browse 为 0，单例槽位中低优先级先渲染）。
- 点击「添加工作区」时调用 `dsh-plugin-marketplace` 已验证的 `marketplace.pickDirectory()`
  RPC；该 RPC 在 Windows 上启动 `powershell.exe -STA` 运行 `System.Windows.Forms.FolderBrowserDialog`，
  返回所选绝对路径；取消返回 `null`。
- 选择成功 → `onPicked(path)`；取消 → `onCancel()`；RPC 或系统对话框失败 → `onError(message)`
  并在错误弹窗中展示，同时**注销自身占用者**，使官方 browse 选择器在下次打开时重新可见，
  保留手动输入路径的兜底能力。
- marketplace 插件不存在/被禁用时，`ctx.inject(["remote.marketplace"])` 永不就绪，
  本插件不注册任何占用者，官方 browse 原样工作，无副作用。

## 依赖关系（重要）

- **运行时软依赖 `dsh-plugin-marketplace`**：系统文件夹选择框由
  `remote.marketplace.pickDirectory()` 提供（其内部是 marketplace 自带的
  PowerShell `FolderBrowserDialog`），本插件不重复实现该 RPC。
- 这是**软依赖**，三层降级保证不破坏添加工作区主流程：
  1. marketplace 被禁用/卸载 → `remote.marketplace` 永不就绪 → 本插件不注册占用者，
     官方 browse 原样工作；
  2. marketplace 更新改接口 → 调用抛错 → `onError` 弹错误 + 注销占用者 → 下次打开回退官方 browse；
  3. 上述任一情况都只是"回到官方浏览式对话框"，不会让添加工作区不可用。
- **后续可选解耦**：把 PowerShell 选择器搬进本插件 host 端（自建 RPC），彻底去掉对
  marketplace 的运行时依赖。当前保持依赖版（marketplace 为双端常驻插件，实际不会删）。

## 行为对照

| 场景 | 行为 |
| --- | --- |
| Windows Desktop，正常 | 弹出系统文件夹选择器，可直接切盘 |
| 用户取消 | 关闭对话框，不创建空工作区 |
| PowerShell/RPC 失败 | 错误弹窗 + 本次占用者注销，下次打开回退官方 browse |
| marketplace 插件禁用 | 本插件不注册，官方 browse 原样 |
| 非 Windows / Web profile | 不触发系统对话框（由 marketplace 的 platform 分支决定） |

## 注册

双端 `cordis.patch.yml` 各一条手工 insert（`workspace-picker`），双端 `package.json`
各一条 `link:` 依赖。禁止进入 `dsh.profile.bundles` 白名单栈。
