# 更新日志
0.2.0-dsh-local.31 (2026-09-06) 修复会话页面「漂移」：锁死 viewport 缩放（页面 v60）：
- 现象：部分会话页面整体左右偏移、文字被屏幕左缘裁掉、右侧露出 html 底色，连 position:fixed 的输入框/发送按钮都跟着跑位（丞相三张截图实锤）
- 根因：不是布局 bug，是页面被缩放 + 平移——图3 中 fixed 元素随内容整体跑位是 visual viewport 缩放拖动的签名（文档级横滚移动不了 fixed 元素）。页面 viewport 原本只设 `width=device-width, initial-scale=1`，Android WebView 上快速连点（连按发送/折叠块）或双指捏合即触发放大；放大状态在整个页面生命周期保留（切会话只是 DOM 摘下/贴回，不重置 viewport），所以「有的会话漂、有的不漂」取决于缩放发生时打开的是哪个会话。图2 还证明放大约 1.1x：吸顶标题栏滚出视野、发送按钮被右缘裁掉
- 修复：BASE_HEAD 的 viewport meta 加 `maximum-scale=1, minimum-scale=1, user-scalable=no`（禁捏合缩放）；`html` 加 `touch-action: manipulation` 兜底（禁双击放大，垂直平移不受影响）
- 回归：5 个回归脚本的版本断言 `页面 v59`→`页面 v60`；八项 remote-control 回归 8/8 全绿；`plugin-safety check` 全通过；typecheck + build 干净
- 部署：构建产物已复制进插件目录，**需重启 DSH Desktop 生效**；手机刷新页面（或重开 PWA）后设备行应显示「页面 v60」
- 代价说明：锁缩放后手机上不能捏合放大看小字（丞相已确认可接受）
0.2.0-dsh-local.30 (2026-09-03) 芯片行上色：三枚芯片各自淡色底（页面 v59）：
- 丞相定调「大小和间距挺好，加点颜色就更好」——v58 的全透明扁平在深色底上偏灰，缺少层次
- 三枚芯片改为「淡色底 + 同色文字」，仍无硬边框：模型芯片 `--accent-chip`（主色 12–18% 透明度）+ `--accent-ink`；模式芯片 `--panel-hover` 中性底 + `--text-dim`（与模型芯片区分开，不抢眼）；工作芯片 `--hint-dim` + `--hint` 紫/青提示色；队列芯片 `--ok-dim` + `--ok` 绿色（有排队 = 正向状态）
- 新增三个逐主题变量 `--hint-dim` / `--ok-dim` / `--accent-chip`，六套皮肤（default / oled / mist / sun / pine / sakura）各配一份透明度：暗色系 13–18%、亮色系 11–14%，保证淡底不糊字
- 转圈圈边框从 `--line` / `--accent` 换成 `--line-soft` / `--hint`，与工作芯片同色系
- 尺寸不变（padding 4px 8px、字号 12.5px、radius 8px），行 `gap` 2px→5px 让淡底之间留出呼吸
- 回归：八项 remote-control 全绿；`plugin-safety check` 全通过；产物侧确认 6 套主题变量与 4 条上色规则均已落地
0.2.0-dsh-local.29 (2026-09-02) composer 芯片行扁平化：单行不挤、无空白（页面 v55→v58）：
- 起因：v54 把工作芯片单独拆一行后丞相反馈「不用单独成一行吧，还有空白处」，且「模型/模式按钮留这么大没必要」
- v55：工作芯片改右对齐小贴纸（#composerStatus 不占整行）——仍被判定「挤在一起还有空白」
- v56：删掉 #composerStatus 容器，工作芯片回归 #composerTop 单行，去掉边框/底色/内距改为纯文字（spinner + 工具名），margin-left:auto 贴右；#workChip.hidden + #queueChip 兜住隐藏态右锚点，右侧组不换边
- v57：模型/模式/队列芯片降级为扁平文字按钮（去边框、去底色、padding 7px、字号 12.5px），行间距 gap 8px→2px，composer 内距 9/12px→7/10px
- v58 修复 v57 白改：#modelChip / #presetChip / #queueChip 的裸 id 选择器特异度低于通用规则 #composer button（渐变底 + 12px 17px 内距），扁平样式被整条压掉，真机看起来毫无变化。全部加 #composerTop 前缀提权后生效——与相机按钮当年 #composerMain #imgBtn 提权是同一个坑
- 回归：八项 remote-control 全绿；plugin-safety check 全通过
0.2.0-dsh-local.28 (2026-09-02) composer 布局分行：工具名不再被模式芯片挤掉（页面 v54）：
- 修复「加了模式芯片后，转圈芯片显示的工具名被挤没了」：`#composerTop` 一行要塞 模型 + 模式 + 工作芯片 + 队列，宽度不够时 `#workChip` 的 `max-width: 52vw` 先被压扁，剩下一个光转圈的圆点——而工具名正是这个指示器的全部意义
- 布局改为两行：`#composerTop` 只放选择器（模型 / 模式 / 队列），新增 `#composerStatus` 独占一行放工作芯片（`width: 100%`），长工具名有整行宽度；空闲时整行 `hidden` 不占高度，回合开始才出现
- 队列芯片改 `margin-left: auto` 贴在选择器行右端，不再被工作芯片挤位；模型/模式芯片改 `flex: 0 1 auto` 各自按内容收缩
- 实测（手机视口 412×915）：选择器行高 46px、队列芯片右端与行右端对齐（401/401）、工作芯片整行 389px 宽、长工具名走省略号且 `bodyOverflowX=0`

0.2.0-dsh-local.27 (2026-09-02) 手机端模式切换（页面 v53）：
- 新增会话模式（官方 agent preset）切换：新建会话面板顶部「会话模式」下拉，列出宿主全部模式（实测：标准模式 / PTC 模式 / 极简模式 / 创造模式 / 织梦者），选中项的官方描述实时显示在下拉下方
- 新建时把选中模式随 `session.create` 的 `agentPreset` 字段一起下发，会话开局即为所选模式；不写全局默认设置，只影响本次新建
- 会话内新增模式芯片（模型芯片右侧）：空白会话点按可切换（走官方 `agentPreset.select`），已有消息显示 `🔒` 只读并提示「新建会话可选模式」
- **宿主硬约束（实测 apiProxy）**：`agentPreset.select` 只接受空白会话，已开口的会话返回 `agent-preset-locked`。因此手机端不做「点了像成功其实没变」的假交互；`turn/start` 一到即把芯片转为锁定态，宿主的 `agent-preset/selected` 事件用于同步显示
- 配套：网关白名单新增 `agentPreset.list` / `agentPreset.select`
- 回归：新增 `maintenance/test-remote-control-presets.mjs`；八项 remote-control 回归全绿

0.2.0-dsh-local.26 (2026-09-02) 手机端 composer 收尾 + 图片去重（页面 v49–v52）：
- 修复「一张图上传后变两张」：带图用户消息在宿主侧双写——`agent/inbox/spliced`（队列注入载体）与随后的 `user/message` 携带同一个 `attachmentId`，两边都渲染就是一图两份。现只渲染 `user/message`，spliced 分支移除
- 相机入口从独立按钮改为输入框内左侧图标（SVG，随主题 `currentColor`），垂直居中不再漂出框；输入框恢复常规高度（min 44px / max 168px）
- 待发图片条贴在输入框正下方、与输入框同宽同边框（上平下圆），缩略图 52px、删除钮压角带描边
- 上传每步可见：选图即 toast「收到 N 张图，处理中…」→「已添加 N 张图，点发送发出」；安卓部分选择器返回空 MIME 时按扩展名兜底、再不行试解码，能解码就收

0.2.0-dsh-local.25 (2026-09-02) 手机端图片：渲染电脑发的图 + 手机上传（页面 v47，与 local.24 同页发布）：
- 修复「电脑上发的图片手机看不见、像被忽略」：两个缺口——①消息内容里的图片是 `{type:'image', attachment:{attachmentId,...}}` 引用块，手机页只渲染 text 块直接跳过；②带图消息若在回复运行中发出，走的是 `agent/inbox/spliced` 事件（队列注入载体），此前整个被丢弃。两处都补齐渲染，另支持 assistant 消息与 tool-result 内嵌图（截图类工具产物）
- 图片字节经官方 `session.attachment` RPC 取回（base64 → data URL），内存缓存防重复拉取，失败显示虚线占位；缩略图最大 260px 宽、按原始宽高比预留布局不跳版；点击全屏查看（`#viewer` 覆盖层，点任意处关闭）
- 手机上传：composer 新增 📷 按钮（多选、一次最多 4 张），选图进待发缩略图条（可单张移除），发送时图片以 `{type:'image', mediaType, data:<base64>}` 走 `session.prompt`；压缩策略：GIF 直传保留动画、≤200KB 原样、其余 canvas 重采样至最长边 1280px / JPEG q0.82（透明 PNG 铺白底）；发送失败连图带文恢复可重试
- 配套：网关白名单加 `session.attachment`；请求体上限 1MiB → 12MiB（多图 base64 需要）
- 过程中踩坑并修复：TS 模板串里正则 `\/` 的反斜杠被吃掉，产物变成非法正则导致整页 JS 语法错误（页面白屏级）——部署后必须从服务端提取内联 JS 跑 `node --check`
- 验证：六项回归全绿（新增 `maintenance/test-remote-control-images.mjs`）；真机链路实测——公开网关读历史会话真实图片附件（1346×1242 PNG）base64 完整取回；手机视口下翻到第 3 页历史 6 张图全部渲染、全屏开合正常、composer 📷 按钮与文件选择器就位；上传链路 UI 层验证完毕，端到端发送留丞相真机验证（会真实触发桌面回合）
- 协作说明：本条与 local.24（dsh-ui 围栏渲染，另一会话）同文件并行开发，最终同一次构建合并发布为页面 v47

0.2.0-dsh-local.24 (2026-09-02) 手机端渲染 dsh-ui 围栏（页面 v47）：
- 修复「模型回复里的 `dsh-ui` 围栏在手机上显示成一坨原始 JSON」：根因不在 JSON、也不在 dsh-genui 插件——手机端走的是本插件的独立页面（`src/host/page.ts`，零 React 的原生 DOM），加载不到 dsh-genui 的 React client bundle，那套「观察 `.md-code-block` + 找 `dsh-ui` 语言标签 + 接管成组件」的通道在这里根本不存在。更直接的是 `mdToDom` 遇到围栏只置 `inCode = true`，连语言标签都不解析就丢掉，`dsh-ui` 这个信息从第一步就没了
- 修复方式：围栏开启时记下语言标签（`codeLang`），闭合与未闭合两条路径统一走新的 `fenceBlock(text, lang)` 分派 —— `dsh-ui` 试走 `genuiToDom()`，其余（或解析失败）一律回落 `codeBlock()`，最坏情况不比改动前差
- 新增 `genuiToDom()` + `genuiNode()`：用页面自己的 `el()` / `inlineMd()` / `md-*` 设施把 GenUI spec 画成原生 DOM，配套一套 `gu-*` 样式全部建立在既有主题变量上（六套皮肤自动正确配色）
- 结构类组件原生渲染：`text`（size → md-h*/正文/dim）、`list`（title+desc）、`table`、`keyvalue`、`callout`（四种 tone 各自左边框色）、`badge`（四种 tone）、`stat`（含 delta 涨跌色）、`progress`、`steps`（含完成/当前态）、`timeline`、`breadcrumb`、`avatar`、`card`、`code`、`divider`、`spacer`；`diff` 直接复用页面已有的行 diff 设施
- 窄屏适配：`row` / `col` / `grid` 一律降级为单列竖排（并排内容在手机宽度下必然挤成一团）；`tabs` 平铺展开为多张卡片，`accordion` 用原生 `<details>`
- 图形类降级为占位提示：`chart`（占位 + **数据保留为两列表**，数字在手机上照样有用）、`plot`、`mermaid`、`scene3d`、`file-tree`；`json` 走代码块
- 交互类只画静态外观、不接 `[genui-action]` 回路：`button`/`submit` 渲染为半透明禁用态，`radio`/`checkbox`/`switch` 用 ◉/○/☑/☐ 呈现选中态，`input`/`textarea`/`select`/`slider` 显示当前值或占位。移动端没有宿主 storage 服务，「会话+内容指纹」持久化那套不在本轮范围，所以不做假的可点控件
- 安全与规模：沿用页面零 `innerHTML` 姿态（全 `textContent` 拼装）；`link` 的 href 仍按 http(s)/mailto 白名单才生成真锚点；节点预算 200、嵌套深度 8，超出即停，避免恶意或超长 spec 撑爆手机
- 顺手统一：`mdToDom` 内联 markdown 闭包提升为共享 `inlineMd()`，GenUI 的 text/list/table/callout 等字段与正文用同一套 **粗体** / 行内码解析
- 回归：新增 `maintenance/test-remote-control-genui.mjs` —— 源码契约（语言标签捕获、两条围栏路径都走 fenceBlock、无 innerHTML 赋值、href 白名单、规模闸门）+ 20 项行为断言（在 DOM stub 上真跑渲染器：合法 spec 出结构、字段名写错只降级单个节点、未知 type 跳过、图表出占位+数据表、按钮出静态态、坏 JSON/无 items/空产出/非对象一律回落代码块、深度与预算真能截断）+ 部署产物一致性。既有 5 个 remote-control 回归脚本全部复跑通过

0.2.0-dsh-local.23 (2026-09-02) 修复重开页面时主题闪变（页面 v46）：
- 修复「关闭网站重新打开，先显示默认深色、闪一下才变回所选皮肤」：根因是 `<html>` 默认按深色「深海夜航」渲染，读 `localStorage` 换肤的代码在 body 末尾大脚本里，要等整个 HTML 解析完才执行——手机 WebView 渐进渲染，第一帧已上屏才换肤
- 修复方式：`BASE_HEAD` 的 `<head>` 里加一段提前换肤脚本（Theme pre-hydration），第一帧前就读 `dshrc_theme` 把 `data-theme` 设到 `<html>` 并同步状态栏 `theme-color` meta；脚本位置在全部主题样式之前，未知主题名自动跳过回默认
- 回归：新增 `maintenance/test-remote-control-theme.mjs`（断言 head 级脚本存在、位置先于主题样式、设置 `data-theme` 与 `theme-color`、部署产物一致）

0.2.0-dsh-local.22 (2026-09-02) 单轴滚动：展开块不再截断滑动手势（页面 v45）：
- 修复「展开 Think / edit 后滑到块底部就划不动，得缩起来或把手指挪到块外」：根因是展开体内层是独立滚动容器（`max-height: 300px` + `overflow: auto` + `overscroll-behavior: contain`），滚到内层底部后滚动链被 `contain` 截断，不再传给页面
- 根治：移除内层滚动容器，`.inner` 回归普通文档流，整页只剩一个滚动轴。内容过长的防护上移到源头：代码块软换行 + 超 44 行折叠（v44 已做）、diff 折叠未变长段（v44 已做）、纯文本体（Think / 注入全文）超 1200 字折叠为「开头 + 展开全文（还有 N 字）」
- 顺手修一个隐藏 bug：Think / 注入全文此前直接塞进无样式容器，`white-space` 默认值把原始换行全丢了，一段思考压成一坨；现 `.tl-text` 用 `pre-wrap` 保留换行
- 展开体验补齐：`revealDetails()` 展开后把块带进视野（展开点在上半屏则不动，内容顶出视野或整块超高则把摘要行贴到吸顶层下方，高度实测 `#bar` + `#devline` 不写死）；「展开剩余 N 行」点击时锚定代码块顶部做位移回补，正在读的行不被新内容顶飞
- 流式 Think 跟随简化：原「近底部时同步推内层框」的 `ib.scrollTop` 逻辑随内层滚动框一起移除，页面级近底部跟随天然覆盖
- 回归：新增 `maintenance/test-remote-control-scroll.mjs`（断言无 max-height/overflow/overscroll、revealDetails 存在、固定浮层保留各自滚动、部署产物一致）
- 版本标记补记：页面 v44 阶段曾漏推版本号（v44 = 代码块/diff 那轮 + diff 配色追加修复），本轮起标为 v45

0.2.0-dsh-local.21 (2026-09-02) 手机端工具调用可读性：代码块换行 + edit 真 diff（页面 v44）：
- 修复「长代码块被压成一条要左右拖的长线」：代码块从 `white-space: pre` + 横向滚动改为一行一节点 + `pre-wrap` 软换行 + 2ch 悬挂缩进，折行的续行有缩进，肉眼能区分屏幕折行与真实换行；超过 44 行折起，点「展开剩余 N 行」看全文
- 修复 `write` 内容被 markdown 规则搅乱：此前一律走 `mdToDom`，`flushPara` 把连续行 `join(' ')` 直接把几十行代码拼成一行，以 `#`/`-`/`|` 开头的代码行还被误判成标题/列表/表格。现按扩展名分流：`.md/.markdown/.mdx` 保留成品预览，其余走代码块原文
- `edit` 从「old_string/new_string 各截断 400 字平铺」改为真正的统一行 diff：行级 LCS（先削公共首尾，规模超限退化为整段删+整段增），`-` 红 / `+` 绿 / 上下文 3 行，未变长段折成「⋯ N 行未变」，最多 400 行后省略
- 折叠行摘要带增删统计：`✨ edit · page.ts · +38 −7`，不点开就知道改了多少；编辑类去掉 `Tool call ·` 前缀，避免窄屏把统计挤进省略号
- 其他工具的多行/超长参数（prompt、patch 等）也改走代码块，不再截断成一坨
- 验证：diff 算法 40/40 随机用例可无损重构前后文本，大输入退化路径同样无损；真机链路（公网 + 手机视口 412×915）实测 `bodyOverflowX=0`、代码行与 diff 行 `overflow=0`，109 字符长行折为多行、`.ts` 走代码块 + 折叠按钮、`.md` 走成品预览（标题/列表/表格/引用齐全）
- 回归：新增 `maintenance/test-remote-control-tool-view.mjs`；`test-remote-control-status.mjs` 版本断言同步到 v44
- 修复 diff 配色不可读（同轮追加）：初版复用 `--stop-bg`（停止按钮填充）与 `--ok-border`（描边），在浅色主题下是饱和色，红字压红底、绿字压绿底几乎看不见。改为专用 `--diff-add-*` / `--diff-del-*`（淡底 + 高对比字），六套主题各自校准（深色用暗底亮字、浅色用浅底深字），并给每行加 3px 左侧色条，低对比环境下也能分清增删；统计数字同步改用该色并加粗

0.2.0-dsh-local.20 (2026-09-02) 修复运行中会话首次进入空白（页面 v43）：
- 修复从列表首次进入「正在运行」会话时消息区空白、刷新后才出现的问题
- 根因：local.19 的流式保护只按停止按钮可见判断，把首次历史填充误当成流式对账；收到历史后只移除「加载中」占位，没有渲染历史
- `loadHistory(keepPos, force, initialLoad)` 增加首次填充语义；空骨架允许直接渲染，已有 Think/工具/正文的流式画面继续延迟对账，避免重演 Think 被吞
- 普通首次进入显式调用 `loadHistory(false, false, true)`；缓存命中仍走静默原位对账
- 回归：新增 `maintenance/test-remote-control-running-session.mjs`，覆盖首次历史填充与已有流式画面延迟两条路径

0.2.0-dsh-local.19 (2026-09-02) 手机端桌面在线状态（页面 v42）：
- 顶部新增吸顶三态状态徽标：`在线` / `连接中` / `DSH 离线`；长会话滚动时仍可见
- 页面启动即轮询 `/remote/health`（6 秒一次、4.5 秒超时）；连续两次失败才判定 `DSH 离线`，恢复成功立即回 `在线`
- EventSource 打开/断开分别同步在线/连接中；断线由浏览器自身重连，健康轮询负责延迟离线判定，避免短暂抖动误报
- 明确不把「重新配对」作为正常状态；主动吊销/清除令牌时仍由既有配对页处理
- 回归：新增 `maintenance/test-remote-control-status.mjs`，覆盖状态控件、心跳、SSE 断线、三态文案与无重新配对状态

0.2.0-dsh-local.18 (2026-09-02) 注入消息显示 + 流式期间不再吞 Think（页面 v41）：
- 修复「开新会话开头的注入提示词不显示」：user/message 的非 user 来源（agent-instructions/plugin/skill-catalog/session-reference 等）原先直接丢弃（旧注释「桌面端同样不展示」是错的——桌面端按 inject/recall 角色渲染）。现渲染为折叠「💉 注入」行（injectionLabel 对齐桌面 contextProvenance 分类：指令/插件/技能/记忆召回），默认收起点开看全文
- 修复「Think 偶尔被吞或思考完才冒出来」：根因是历史对账重绘发生在流式中——innerHTML='' 清掉正在打字的 Think 块，liveEls 重置后增量全被丢弃，直到终帧 assistant/message 才补渲染。现 loadHistory 在回合进行中推迟换血（pendingReconcile 标记，turn/end 后 400ms 补跑 loadHistory(true)）；手动刷新按钮与 8 秒长等兜底改为 force 绕过推迟
0.2.0-dsh-local.17 (2026-09-02) 「停止当前回复，队列继续」编排（页面 v40）：
- 实测补充宿主语义：cancel 中止当前轮后 agent 循环不自动认领剩余排队消息，它们会一直挂着不回复（local.16 的「队列保留」文案给了错误预期，已修正）
- 队列面板「■ 停止当前回复，队列继续」：①逐条 updateQueue remove 取下排队消息（留底文本）②session.cancel 停当前轮 ③按原顺序重新 session.prompt（第一条立即开新一轮，其余排队跟随），并清理 pending 乐观气泡后 loadHistory 对账
- 防双击；失败恢复按钮可重试
- 桌面 Chrome 端到端验证：数数中排队第二条 → 停止 → 第一条中止、第二条自动接续并正常回复
0.2.0-dsh-local.16 (2026-09-02) 消息队列可视化 + 停止语义分级（页面 v39）：
- 接入宿主 session/queue SSE 帧（全量收件箱快照）：输入框顶行新增 ⏳N 队列芯片，排队/出队实时可见
- 队列面板：点芯片或点停止（有排队时）打开——「■ 停止当前回复」+ 排队消息逐条「移除」（session.updateQueue remove，已加白名单）；面板随 session/queue 帧原位刷新
- 停止按钮分级：无排队=直接中止（原行为）；有排队=先看队列再精准处置，不再盲停
- 发送时若上一条还在回复，toast「已加入队列，排在当前回复之后」
- 实测宿主语义（桌面 Chrome 全流程）：session.cancel 只中止当前轮、不清队列；排队消息在当前轮结束后自动开始新一轮；turn:2 aborted 时队列完好
- 修复 current.running 不随 turn/start|end 同步导致队列面板缺「停止当前回复」行（改以停止键可见性为准 + turn 事件同步回写）
- 桌面 Chrome 端到端验证：⏳1 → 停止弹出面板（含停止行+1条排队）→ 移除后 ⏳0 芯片隐藏
0.2.0-dsh-local.15 (2026-09-02) 新建会话点击反馈（页面 v38）：
- 选定工作区后 session.create 的隧道路径往返（几百毫秒）期间行内显示转圈「正在创建会话…」，消除「点了卡住」的僵住感
- 防双击（在途忽略再点）；失败原位恢复该行可重试，错误提示滚动到可见处
0.2.0-dsh-local.14 (2026-09-02) 修复新建/打开会话「没有任何事发生」（页面 v37）：
- 根因（桌面 Chrome 网络日志实锤）：session.create 成功返回，但 closeSheet 的 history.back() 是异步退栈，同拍 openSession 之后退栈落地，popstate 看到「目标列表 + current=新会话」，按返回逻辑把刚打开的会话页覆盖回列表
- 修复：createAt 与 ⋯ 菜单「打开会话」改用 hideSheetForJump（纯视觉关面板、不动 history），由 openSession 自己压入会话层；popstate 对遗留 sheet 死层归一化为列表，返回键从会话一按即回列表，无死层
- 创建失败提示滚到面板可见处（原先沉底看不见，加重「没反应」错觉）
0.2.0-dsh-local.13 (2026-09-02) 修复缓存回进必落顶部（页面 v36）：
- 根因：stashSessionView 在摘除消息 DOM 之后才读 window.scrollY——摘掉近 4000px 的内容后页面塌缩，浏览器同步把 scrollY 钳到 0，缓存里存的永远是 0，再进必然恢复到顶部（对「运行中会话」最明显，因为只有它会被反复退出再进）
- 修复：scrollY 在摘除前读取（savedY）；对账滚动从「距底部距离」改为「绝对阅读位置」恢复（历史只追加，上方内容不变），对账期间有新内容也不再被拽走
- 调试期间用页面内探针（window.__rcdbg）在桌面 Chrome 复现并验证：stash 3204 → cachehit 3204 → 终态 3204；正式版已移除探针
0.2.0-dsh-local.12 (2026-09-02) 进会话顶部问题 + 新建链路提速（页面 v34）：
- 修复「从列表进会话默认停在顶部」：renderListView 的 rAF 滚动排在 current!=='null' 守卫之前，退回列表后迟到的列表数据会把已打开的会话页拽到列表滚动位置（长对话页=顶部）；守卫提前到函数最前
- 新建会话零等待：session.create 后立即跳转（fresh 标记，空会话不拉历史直接显示「新会话，发第一条指令吧」），normalizeModel 档位纠偏转后台
- 新建面板工作区清单缓存（lastWorkspaces）：二次打开秒开无「加载中」，迟到清单只更新缓存
0.2.0-dsh-local.11 (2026-09-01) 流式反馈与滚动（页面 v33）：
- 新增 #workChip 工作芯片（输入框顶行、转圈动画）：发送→深度思考中→工具调用中全程可见，修复「思考阶段零反馈、正文凭空蹦字」——根因是 block-start 一到（折叠 Think 块开始）就清掉了提示条，之后整个推理期不可见
- 中途进正在运行的会话补显示「会话运行中」（turn/start 已错过）；重绘不再灭运行中的芯片
- scrollBottom 近底部跟随（阈值 180px）：往上翻历史时不再被增量拽走
- Think 展开跟滚：内层 300px 滚动容器打开即定位到最新思考，流式期间近底部同步推底
- 移除旧 in-flow 提示条（.thinking-hint/hintDots），chip 接管
0.2.0-dsh-local.10 (2026-09-01) 会话视图缓存（页面 v32）：
- 离开会话时把整棵消息 DOM 摘下进 LRU 缓存（上限 3 个，超限淘汰最久未用；单会话 DOM 超 1500 元素不缓存——内存硬约束）
- 再进同一会话同帧贴回：零「加载中」，恢复滚动位置与流式状态
- loadHistory 加 keepPos 静默对账模式：按「距底部距离」恢复阅读位置，内容没变零扰动；对账失败保留旧画面不打扰
CHANGELOG (dsh-remote-control) 补记：
0.2.0-dsh-local.9 (2026-09-01) 模型切换链路重做（页面 v31）：
- 模型面板秒开：lastModels 缓存（lastModelsSid 归属校验）命中即渲染，不再每次重拉 session.models 出现「加载中」
- 乐观切换：点模型行立即关面板+芯片即变+toast（正在切换→已切换✓/失败红toast+回滚），selectModel RPC 后台执行
- 新增 #toast 轻提示组件（opacity 过渡、2.2s 自动退场、pointer-events:none）
- 成功后后台 session.models 对账刷新缓存与芯片
- 点当前模型行 = 仅关面板

本文件记录 dsh-remote-control 的用户可见变更。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本遵循语义化版本。

## [0.2.0-dsh-local.8] - 2026-09-01

### 修复

- **返回列表卡顿（先闪会话内容、约 1 秒后才切列表）**：`showList()` 原先等
  `session.list` 回来才替换 `view` 内容，期间会话消息 DOM 仍挂在页面上。
  现在进会话前把整棵列表容器（`#listWrap`）摘下缓存，返回时**同帧**原样搬回
  （不 clone，事件监听随节点保留），网络请求在后台跑、回来后整体替换。
  实测返回后 30ms 内列表即就位（77 行、0 条会话残影、无骨架屏）
- 返回列表时恢复离开前的滚动位置（原先回到顶部）
- `scrollBottom()` 的 rAF 回调加 `current === null` 守卫：帧回调若落在切回列表之后，
  不再把列表拉到底
- `session.list` / 失败分支加 `current !== null` 守卫：请求回来时用户已进会话，
  不再用列表覆盖会话内容

### 新增

- **历史可往上翻**：首屏由写死的 `maxMessages: 10` 提到 40，顶部新增
  「↑ 加载更早的对话」按钮，按官方 schema 的 `beforeSeq` 游标续页；
  插入后按高度差补偿滚动，正在看的内容不被顶走；不足一页即判定到顶、按钮隐藏。
  此前只能往上划一点点，是取数截断而非历史丢失
## [0.2.0-dsh-local.7] - 2026-09-01

### 变更

- **`/` 菜单改为严格前缀匹配**：原先单用 `indexOf`（包含即命中），输入 `/plugin` 会把
  `install-dsh-plugin` 也列出来，与逐字输入的直觉不符。现在只列**以输入开头**的项，
  按名称字母序排列；`/plugin` 无前缀命中即隐藏菜单，只敲 `/` 时列出全部技能

## [0.2.0-dsh-local.6] - 2026-09-01

### 修复

- **`/` 菜单在输入框清空后不消失**：skill 清单是异步取的，快速删空输入时旧回调
  用闭包里的过期值把菜单又 `remove('hidden')` 回来。现在回调里重新读 `input.value`
  并比对，不一致就放弃本次渲染；另加失焦与发送后的兜底收起

### 移除

- 撤回上一版尝试的官方斜杠命令支持（`commands.list` / `commands.execute` 白名单与
  相关 UI、执行回显、样式）。**实测这条路走不通**：经插件网关调用两者均返回
  `404 not found`，即它们没有挂在 `apiProxy` 的 `/api/<method>` 路由面上；
  对照组 `session.list` 同路径正常、未列入白名单的 `command.list` 被白名单正确拦下，
  证明插件侧逻辑无误，限制在宿主一侧。源码里的 `@Remote` 标记只表示「设计上允许远程
  调用」，**不等于**已在 apiProxy 的 HTTP 路由表中注册 —— 上一版据此误判

### 保留

- 网关 RPC 失败时在响应里附带 `detail`（真实异常消息）。原先统一回「进程内调用失败」，
  无法定位；正是靠 `detail` 才拿到 `not found` 这一决定性证据

## [0.2.0-dsh-local.5] - 2026-09-01（已撤回）

- 曾尝试接入官方 `commands.*`，实际不可用，改动已在 local.6 中移除。详见上条

## [0.2.0-dsh-local.4] - 2026-09-01

### 新增

- **工作区可折叠**：会话列表的工作区组头改为可点击折叠（箭头旋转 + 会话计数）。
  默认只展开最近活跃的那个工作区，其余收起；展开集合记在 `localStorage`（`dshrc_ws_open`），
  跨次进入保持。原实现把所有工作区的会话一次性平铺，会话多时无法扫读
- **接管手机物理返回键**：单页应用原先不碰 `history`，安卓返回键会直接退出站点。
  现在「会话」与「底部面板」各占一层 `history` state，返回键按 面板 → 列表 → 离开 逐层消耗；
  顶栏「← 列表」同步退栈，避免界面与 history 不一致

## [0.2.0-dsh-local.3] - 2026-09-01

### 新增

- **退出配对**：手机端设置面板新增「退出配对」（两步确认）。新增 `POST /remote/unpair`，
  服务端按令牌摘要吊销本设备（`PairingStore.revokeByToken`）、下发 `Max-Age=0` 清 Cookie，
  页面同时清除 `localStorage` 令牌镜像并回到配对页——是真吊销，不是本地清缓存

### 变更

- **图标改用内联 SVG**：手机端顶栏设置按钮（原 `⚙` emoji）、配对页标识与桌面端设置页设备列表
  （原 `📱` emoji）统一为 `currentColor` 描边 SVG，六套主题下颜色自动跟随

## [0.2.0-dsh-local.2] - 2026-09-01

### 变更

- **输入框改双行布局**：模型选择器独占顶行，输入框与发送按钮占下一行。原单行 flex 在模型名
  较长（如 `claude-opus-5-xhigh`）时会把输入框压成一条窄缝。输入框最小高度 46px、上限 168px
- **整页字号上调一档**：正文 14.5 → 16.5px、代码块 12 → 14px、表格 12.5 → 14.5px、
  工具时间线 12 → 14px，审批卡片与会话列表同步放大
- **移动端排版**：代码块与表格改为独立横向滚动（附细滚动条），不再在屏幕边缘被裁切；
  引用块与列表符号改用主题强调色，段落与标题间距放宽

### 性能

- **思考提示动画去重排**：原 `::after` 的 `content` 字符串循环每步都触发布局，
  改为三个固定 span 的 opacity 动画，走 GPU 合成
- **流式滚动合并到帧**：`scrollBottom()` 由每 token 一次 `scrollTo`（每次强制同步布局）
  改为 `requestAnimationFrame` 合并，每帧最多一次
- 新消息气泡淡入上浮 200ms，按钮按下有缩放反馈，并遵循 `prefers-reduced-motion`

## [0.2.0-dsh-local.1] - 2026-09-01

### 部署

- 当前 DSH 双端以 link 依赖 + 手工 Cordis insert 注册
- 公网入口使用 `https://dsh.starroute.me`，网关仅监听 `127.0.0.1:7677`
- Cloudflare Tunnel 保留 `api.starroute.me` 的 `8080` 路由不变，`dsh.starroute.me` 沿用既有的 `7677` 上游（无需提权重启服务）

## [0.2.0] - 2026-09-01

首个公开发布版本。

### 新增

- **配对认证**：8 位配对码 / 二维码接入，长期设备令牌，本地镜像自愈（清 Cookie / PWA 重进不掉线），设备可吊销
- **会话控制面**：按工作区分组列表（吸顶组头）、逐字流式消息（打字机）、发指令、中止回合、发送即时回显与阶段状态提示（⌛ 发送中 → ✨ Deep diving）
- **执行时间线**：`✨ Tool call`（参数预览 + 成品展开）、`💭 Think`（折叠 + 实时摘要预览）、工具失败红色报错行
- **markdown 成品渲染**：助手正文与工具写入内容按排版显示（零 innerHTML，防注入）
- **审批与问答**：桌面端权限请求手机一键「允许一次 / 拒绝」；提问支持选项选择与自定义答案，与桌面端处置互通
- **会话管理**：重命名、归档（两步确认）、按工作区新建会话（归入桌面端分组）
- **模型与推理档位**切换；`/` 菜单（skill 全量清单 + 快捷命令）
- **六套主题**：深海夜航 / 曜石纯黑 / 晨雾 / 暖阳 / 松间 / 樱语，自动记忆，回弹画布与状态栏配色联动
- **桌面端设置页**：网关状态、配对码 + 二维码、设备列表与吊销
- **公网访问（可选）**：`trustedHosts` / `publicUrl` 配置 + Cloudflare Tunnel 指引

### 安全

- 配对码一次性 + 10 分钟过期；令牌磁盘仅存 SHA-256 摘要
- 管理面仅回环开放；全局限流（60 次/分/IP）；Host 头校验防 DNS rebinding
- RPC 白名单制；移动端页面零外部资源、不上报数据

[0.2.0]: https://github.com/myzane678/dsh-remote-control/releases/tag/v0.2.0










