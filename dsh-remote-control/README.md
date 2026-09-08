> **来源与许可**：基于 [myzane678/dsh-remote-control](https://github.com/myzane678/dsh-remote-control)（MIT）开发，固定 commit `ca297b30951c750d6769b1f6f175dca7b51a51fc`（= v0.2.0）。该 commit 未提交 `lib/` 运行产物，按本地「源码构建」路线处理（隔离目录 clone → `pnpm install --ignore-scripts` → `pnpm build` → 产物复制进插件目录）。本地自 v0.2.0 起迭代至 **页面 v60 / 0.2.0-dsh-local.31**，31 项改进覆盖配对认证、手机端布局、消息渲染、队列编排、dsh-ui 围栏与图片、主题、滚动等。

**本地改动（Local modifications）**：

- **配对认证与安全**：8 位配对码 / 二维码接入，长期设备令牌（磁盘仅存 SHA-256 摘要），本地镜像自愈（清 Cookie / PWA 重进不掉线），设备可吊销（`POST /remote/unpair` 真吊销）；配对码一次性 + 10 分钟过期；全局限流 60 次/分/IP；Host 头校验防 DNS rebinding；RPC 白名单制
- **手机端布局与输入**：输入框改双行布局（模型选择器独占顶行，输入框 + 发送按钮占下一行）；整页字号上调（正文 16.5px / 代码 14px）；代码块与表格独立横向滚动
- **流式与滚动**：工作芯片（转圈动画，发送→思考→工具调用全程可见）；近底部跟随（阈值 180px，翻历史不被拽走）；会话视图 LRU 缓存（上限 3 个，零「加载中」恢复滚动位置）；单轴滚动（移除内层滚动容器，展开块不再截断滑动手势）；滚动合并到 rAF；思考提示动画去重排
- **消息渲染**：注入消息渲染为折叠「💉 注入」行（对齐桌面 contextProvenance 分类）；流式期间不再吞 Think（推迟换血 + force 绕过）；工具调用可读性（代码块软换行 + 44 行折叠；write 按扩展名分流；edit 真统一行 diff + 增删统计 + 配色）
- **队列编排**：消息队列可视化（⏳N 芯片，排队/出队实时可见）；停止语义分级（无排队直接停 / 有排队先看队列再处置）；「停止当前回复，队列继续」编排（逐条取下 → cancel → 按原顺序重新 prompt）
- **状态可见性**：桌面在线三态徽标（在线 / 连接中 / DSH 离线，6 秒轮询 + SSE 双源）；运行中会话首次进入不再空白
- **dsh-ui 围栏与图片**：手机端原生渲染 dsh-ui 围栏（genuiToDom，零 React，结构类原生渲染 / 图形类占位 / 交互类静态）；图片渲染（电脑发的图 + 手机上传，canvas 压缩最长边 1280px / JPEG q0.82）
- **导航与会话管理**：工作区可折叠（默认展开最近活跃，记忆到 localStorage）；物理返回键逐层消耗（面板 → 列表 → 离开）；新建/打开会话修复（hideSheetForJump 不再"没反应"）；返回列表同帧搬回缓存 + 恢复滚动；历史可往上翻（beforeSeq 续页）
- **模型与模式**：模型切换乐观更新（点即关面板 + 芯片即变 + 后台对账）；会话模式切换（agentPreset，空白会话可切，已有消息锁定）
- **主题**：Theme pre-hydration 小脚本（第一帧前换肤，修复重开闪变）
- **稳定性**：缓存回进不再落顶部（摘除前读 scrollY + 绝对位置恢复）；composer 芯片行扁平化与分行（不再挤掉工具名）；页面 v60 锁死 viewport 缩放修复会话"漂移"

# dsh-remote-control

## 项目简介

dsh-remote-control 是 DeepSeek Harness 的手机远程控制插件：手机浏览器 / PWA 作为控制面接入桌面端会话——看会话、发指令、中止回合、处置审批与提问、切模型与推理档位；代码与执行环境始终留在桌面端。

## 功能特性

- **配对认证**：8 位配对码 / 二维码，长期令牌，本地自愈，设备可吊销
- **会话控制面**：按工作区分组列表，逐字流式消息，发指令 + 即时回显
- **执行时间线**：✨ Tool call（参数预览 + 成品展开）、💭 Think（折叠 + 实时摘要），工具失败红色报错行
- **消息队列**：⏳N 芯片可视化，停止语义分级，"停止当前回复，队列继续"编排
- **桌面在线状态**：吸顶三态徽标（在线 / 连接中 / DSH 离线）
- **dsh-ui 围栏与图片**：手机端原生渲染围栏 + 图片收发
- **模型与推理档位**切换；会话模式切换（agentPreset）
- **六套主题**：深海夜航 / 曜石纯黑 / 晨雾 / 暖阳 / 松间 / 樱语，自动记忆
- **审批与问答**：权限请求手机一键允许/拒绝；提问支持选项选择与自定义答案
- **会话管理**：重命名、归档、按工作区新建会话

## 安装与接入

本地接入采用双端手工注册：Web 与 Desktop 两个 profile 的 `package.json` 以 `link:` 依赖指向插件目录，`cordis.patch.yml` 登记唯一 `remote-control` 实例。**不写入 `dsh.profile.bundles`**，以免双加载导致 Host 启动失败。

运行时无额外依赖（react 为 optional peer，宿主提供），故插件目录内不需要 `pnpm install`。

## 构建

源码工作副本在 `dsh-home/marketplace/agent-workspace/dsh-remote-control-20260901/checkout`；改 `src/**` 后在该目录执行 `pnpm typecheck && pnpm build`，再把 `lib/` 复制进 `profiles/plugins/dsh-remote-control/`。**不要手改 `lib/*.js`**。

> 注意 `src/host/page.ts` 整个页面是一条模板字符串，注释里出现反引号会截断模板并触发 TS1005。部署后须从服务端提取内联 JS 跑 `node --check`（TS 模板串里正则 `\/` 的反斜杠被吃掉曾导致整页语法错误）。

## 安全

- 配对码一次性 + 10 分钟过期；令牌磁盘仅存 SHA-256 摘要（`~/.dsh/remote-control-state.json`）
- 管理面仅回环开放；全局限流 60 次/分/IP；Host 头校验防 DNS rebinding
- RPC 白名单制；移动端页面零外部资源、不上报数据
- 已知弱点：令牌 Cookie 不设 HttpOnly（上游为实现「清 Cookie 后自愈」而故意如此）

## 回归

- `maintenance/test-remote-control-status.mjs`（三态状态徽标、健康心跳、SSE 断线）
- `test-remote-control-running-session.mjs`（运行中会话首次进入历史填充）
- `test-remote-control-tool-view.mjs`（代码块软换行、write 分流、edit 真 diff）
- `test-remote-control-scroll.mjs`（展开块无内层滚动容器、单轴滚动）
- `test-remote-control-theme.mjs`（head 级提前换肤脚本）
- `test-remote-control-genui.mjs`（围栏渲染源码契约 + 20 项行为断言）
- `test-remote-control-images.mjs`（图片渲染 / 上传压缩 / 双写去重）
- `test-remote-control-presets.mjs`（模式白名单、清单读取、新建下发）

## 移动页版本标记

每轮迭代在页面底部标记 `页面 vNN`，当前移动页 = **页面 v60**（2026-09-06，锁 viewport 缩放修「漂移」）。每轮逐条变更见本目录 `CHANGELOG.md`。

## 入口

`lib/index.js`（host：网关 + `/remote-control/*` 回环管理面）、`lib/client.js`（client：设置页分区）。改 host 半需重启 DSH，页面版本号可用来确认新版是否生效。
