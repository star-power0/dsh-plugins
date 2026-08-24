> **来源与许可**：基于 [SherUnlocked-4869/dsh-plugin-msg-nav](https://github.com/SherUnlocked-4869/dsh-plugin-msg-nav) 0.2.0（MIT）开发，固定该版本以获得两个未被 Registry 收录的关键修复。详见仓库根目录 [README.md](../README.md) 的来源与许可总表。

**本地改动（Local modifications）**：
- 固定 0.2.0（Registry 只收录 0.1.0，缺失两个关键修复：导航条 portal 到 body、host 会话投影）
- 纯 JS 无构建；双端 link 接入，不进 bundles 栈
**简体中文** | [English](./README.en.md)

# dsh-plugin-msg-nav

## 项目简介

DeepSeek Harness 对话节点导航条插件：在对话区右缘渲染一列短横线节点串（每条真实用户消息一个节点），跟随阅读位置。鼠标靠近节点串时，节点条「变形弹出」为单行消息预览面板；点击任意预览平滑跳转并高亮横线；节点过多时可在悬停区域内用滚轮浏览。Host 侧会话投影使节点串在进入会话时即可覆盖整段历史中的全部用户消息。

![效果图](assets/screenshot.png)

## 功能特性

| 功能 | 行为 |
| --- | --- |
| 节点导航条 | 对话区右缘纵向短横线串，每条**真实用户消息**一个节点（系统注入的 goal 自动延续等不计入），恒定 20px 间距 |
| 悬停弹出面板 | 鼠标进入节点串区域：短横线淡出，左侧**单行预览面板弹出**（0.18s 放大动画，覆盖节点条原位置，行内短横线落在原节点横坐标上）；移出后恢复 |
| 面板排版 | 每条消息一行（左文字 + 右短横线），24px 行距、上下 8px 对称留白；悬停行文字与短横线**同步高亮**并出现 8px 圆角底色；当前阅读位置整行以品牌蓝/白色高亮 |
| 列表滑动 | 最多显示 10 条；超出时在悬停区域内用滚轮上下滑动列表（页面不滚动），面板按比例同步滚动 |
| 移出回中 | 鼠标移出悬停区域后，列表平滑居中回当前阅读位置并恢复跟随 |
| 跟随阅读位置 | 激活节点（品牌蓝 / 深色下白色）随滚动侦测实时更新 |
| 点击跳转 | 平滑滚动至对应消息 + 全宽品牌蓝高亮横线（1.5s 淡出）；流式输出干扰下由看门狗兜底落位，列表自动居中目标节点 |
| 全量历史即时入串 | Host 侧会话投影（`msgNavMessages`）折叠整段日志，全量用户消息列表经历史尾页 + 推送帧即时送达；未挂载投影注册表的部署自动回退到后台逐页加载（每页 50 条、至多 120 页），加载中节点串末尾显示脉冲短横线 |
| 点击按需加载 | 点击尚未渲染进窗口的旧消息节点时，先按需拉取更早历史直至该消息入窗并渲染出行，再平滑跳转 + 高亮（按消息 id 与窗口行精确关联，不受节点 key 格式影响） |
| 自动隐藏 | <2 条用户消息、空白会话、非对话视图（如轨迹页）时不显示 |
| 渲染细节 | 节点位置按 devicePixelRatio 对齐设备像素（粗细一致）；窗口调整经 rAF 合帧，不拖慢界面 |

## 工作原理

采用「投影快路径 + 按需翻页」模式：

1. **Host 投影**：host 半注册 `msgNavMessages` 会话投影单元，折叠整段日志中每条 `user/message` 事件（仅 `source.kind === "user"` 的真实用户消息与 steering，注入的上下文行排除），产出 `{seq, time, text, id}` 全量列表；框架持续驱动，经历史尾页与 `session/projection` 推送帧送达。
2. **客户端即时渲染**：节点串用 `useProjection("msgNavMessages")` 直接渲染全量列表；已加载窗口内的消息按持久 id 关联到 DOM 行，用于阅读位置跟随与跳转。
3. **点击按需翻页**：点击尚未入窗的旧节点时，按消息 id 循环 `loadOlder()`（每页 50 条、至多 120 页）直至目标入窗并渲染出行，再平滑跳转 + 高亮。
4. **兜底**：未挂载投影注册表的部署，客户端自动回退到后台 `loadOlder` 全量循环（投影一旦送达立即停止）；会话切换换代取消旧循环，插件卸载时同步停止。

## 安装与接入

官方命令（Web profile）：

```bash
# 直接从 GitHub 安装
dsh plugin --profile web add github:SherUnlocked-4869/dsh-plugin-msg-nav
```

更新到最新版本：

```bash
cd ~/.dsh/profiles/web && pnpm update dsh-plugin-msg-nav
```

卸载：

```bash
dsh plugin --profile web remove dsh-plugin-msg-nav
```

本机接入方式（Web/Desktop 双端）：

- 入口：`lib/index.js`（Host：经 `ctx.inject(["sessionProjections"], …)` 注册只读投影单元 `msgNavMessages`）、`lib/client.js`（客户端 bundle，`dsh.client.platform: "web"`，desktop 端同样加载）。
- Profile 实例：`ui-msg-nav`。
- 纯 JavaScript，无构建步骤，`lib/client.js` 即最终 bundle；无运行时依赖（react 为 optional peer，由宿主提供），插件目录内无需 `pnpm install`。
- 双端 profile 以 `link:` 依赖指向本插件目录，并在各自 `cordis.patch.yml` 登记 `ui-msg-nav` insert；**不写入 `dsh.profile.bundles`**。上游 README 的 `dsh plugin add` 会自动进入 bundles 栈，但本环境中 bundles 栈与手工 insert 并存会触发 `duplicate loader entry id` 并使 Host 启动失败。
- 修改后需重启 Host；注册一致性使用 `A:/DeepSeekHarness/dsh-home/plugin-tools/plugin-safety.mjs check` 体检。

## 安全

- 零网络请求（无 `fetch`/`XHR`/`WebSocket`）、零 `eval`/`new Function`、零 `innerHTML`/`document.write`、零本地存储。
- 只读会话投影与 DOM 锚点，不修改会话数据；仅占用 `conversation.composer.dock` 一个槽位。
- 不注册工具、不注入系统提示、不加 HTTP 路由——零 token 开销。

## 已知限制

- 本机 rc.6 部署未包含 `@deepseek-ai/dsh-session-projection`，`0.2.0` 的「全量历史即时入串」快路径不激活；插件按设计退回客户端后台 `loadOlder` 逐页加载（每页 50 条、上限 120 页），长会话节点串为渐进补全而非瞬时。
- 会话内 <2 条用户消息或非对话视图时自动隐藏。

## 常见问题

**节点串未出现？**

- 确认部署已重启、页面已刷新（bundle 变更需重启部署；刷新页面通常即可获取新 bundle）。
- 当前会话需有 ≥2 条真实用户消息，且处于「对话」视图。

**`dsh plugin add` 报 `ERR_PNPM_TARBALL_INTEGRITY`？**

profile 中某个以 `refs/heads/...` 分支地址安装的第三方插件在上游更新后，新 tarball 校验和与锁文件不符，pnpm 的供应链保护会拒绝整个安装。确认上游更新可信后，将该依赖固定到具体 commit（本插件即以此方式接入）：

```json
"dependencies": {
  "<pkg>": "https://codeload.github.com/<owner>/<repo>/tar.gz/<commit-sha>"
}
```

随后 `pnpm install` 刷新锁文件，再重新执行 `dsh plugin add`。

## 开发

```bash
git clone https://github.com/SherUnlocked-4869/dsh-plugin-msg-nav.git
# 本地联调：安装进一个测试 profile
dsh plugin --profile <profile> add file:<abs-path>
dsh --profile <profile> --port 3090
```

## 参考项目

「全量历史即时入串」与「点击按需加载」参考 [jjxjjjjiik-bot/dsh-chat-timeline](https://github.com/jjxjjjjiik-bot/dsh-chat-timeline)（MIT）：

- **Host 会话投影**（`msgNavMessages`）沿用其 `dshChatTimeline` 投影单元的折叠思路；
- **客户端按需 `loadOlder`** 沿用其 `jumpToMessage` 的加载-等待-落位模式，本插件改为按持久消息 id 与窗口行关联，不依赖其硬编码的节点 key 格式；
- 投影缺席部署的后台逐页兜底加载同样沿用其客户端 `loadOlder` 循环（每页 50 条、至多 120 页）。

## 许可

MIT
