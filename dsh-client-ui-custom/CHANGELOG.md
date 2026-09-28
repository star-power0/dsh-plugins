# Changelog

## 2026-09-28 - motion：切换入场回放加行数门控（LOAD_BATCH_MAX_ROWS = 80）

- 起因（丞相报告）：两个会话之间快速切换时整个桌面发卡。2026-09-28 取证（Tracing + CDP 合成点击）定位 `tryReplay` 切换回放 ~273ms/次，是插件侧最大的切换路径开销：大会话 146+ 行逐个 classList 标记 + 每行一次强制 reflow + 全行 stagger。
- 改动（仅 `src/client/motion/motion.ts`）：
  1. 新增常量 `LOAD_BATCH_MAX_ROWS = 80`（含完整动机注释）；
  2. `applyBatch()` 入口门控：load 批次行数超限**整体跳过**（行不标记、直接显示）——一处门控覆盖全部 load 调用方（observer 首载、会话切换回放、flush 重放）；增量批次（`load=false`）与面板淡入（`panelEntrance`）不受影响，小会话动画原样保留。
- 验证：`node build.mjs` 重建双产物 + `node --check` 通过；`plugin-safety check` 20 插件双端全绿；CDP 实测（Desktop 9224）——小会话 38 行、32 行带 `dsu-motion-row-in`（动画保留）；大会话 146 行、**0 行标记**（门控生效）；切换 trace 零 >50ms 长任务。vitest 本机未配置 runner（上游 spec 随包），行为验证以 CDP 实测为准。
- 备注：大会话切换时 `tryReplay` 仍会按既有重试逻辑做几次全文档扫描（<50ms/次，分摊不构成帧预算压力）——既有逻辑，本轮未动。
- 回退：快照 `20260928-131053-ui-custom-motion-load-batch-row-cap-pre-change`。

## 2026-09-19 - 文档：README 重写为本地维护版（申明上游 + 本地改动）

- 起因：原 README 是上游原版全文（655 行，含上游宣传视频链接、上游 jsDelivr CDN 图片），
  对本地维护副本没有来源申明与本地改动说明。
- 改动：`README.md` 重写为本地维护版——顶部「来源与许可」块（上游仓库、MIT、上游
  LICENSE 保留位置）+ 本地改动清单（本地构建链、`:global()` 重建器修正、玻璃档位联动
  修复、文字颜色调节、设置页视觉层次）+ 功能与配置文档（保留原 README 的配置项表、
  预设表与玻璃档位表——这些是插件自身功能说明）+ 本机接入 + 构建 + License。
- 删除：上游宣传视频链接与全部上游 CDN 图片引用（外链在本地仓库无意义）。
- 内容取自本目录 CHANGELOG 与源码，无新增事实声明。

## 2026-08-29 - 设置页视觉层次优化（功能不变）

- 设置壳、外观页和动效页增加卡片、分组、导航选中态与行边界，降低深色背景下的连片感。
- 模型增强页优化 provider/model 卡片、控件、行间距和操作区层次；未改变设置读写、模型字段或 RPC 行为。
- 所有改动均为视觉样式或动效设置页的静态分组结构；保留原有 slot、ARIA、回调和滚动行为。

## 2026-08-29 - 修复玻璃档位不联动壁纸模糊

- 根因：`wallpaperBlur` 在 `normalizeConfig()` 启动时由 `glass` 派生后被冻结；设置页后续只更新 `glass`，`configFromThemeSection()` 没有重新派生 blur。因此用户把玻璃档位切到「不透明」时，`--dsu-saturate` 会变成 1，但 `--dsu-blur` 仍保持旧的 14px，壁纸继续模糊。
- 修复：运行时玻璃档位与 loader 层档位不同时，按当前档位重新解析模糊半径（off = 0px、light = 6px、frosted = 14px、mica = 22px）；档位未变时仍保留 loader 层显式 `wallpaperBlur`，不破坏原有自定义配置。
- 回归：新增 theme-section 测试覆盖 off/light/mica 的重解析和显式 loader blur 的兼容；`node build.mjs`、`plugin-safety check` 全绿；web 实测「不透明」的 `#root` computed `backdrop-filter` 为 `blur(0px) saturate(1)`。

## 2026-08-28 - 重建器修正：`:global()` 支持；毛玻璃规则首次真正生效（行为变化）

- 用户报告「壁纸突然变糊」。定位：这不是新功能——上游 tsdown 的 CSS-module 处理把 `custom.module.css` 里的 ID 选择器 `#root` 也 scoped 成了 `#_<hash>_root`，页面上不存在该 id，`#root { backdrop-filter: blur(...) }` 的毛玻璃规则**从未命中过任何元素**。本地 `build.mjs`（照搬 Aqua 的类名 scope 逻辑）只 scope 类名、保留 ID，`#root` 第一次真正命中，「玻璃档位」的模糊（毛玻璃 = 14px + 饱和度 1.25）随之生效——壁纸上的模糊是这条规则的正常效果，此前它一直是死规则。
- 调节开关即设置页的「玻璃档位」：不透明 = 无模糊（旧的观感）/ 轻玻璃 = 6px / 毛玻璃 = 14px / Mica = 22px。保留规则生效（符合插件文档意图），由用户按喜好选档。
- 连带修复：本地构建器原样保留 CSS-module 的 `:global(.x)` 包装，浏览器视为未知伪类把整条规则丢弃——`motion.module.css` 全部 28 条动效规则（`.dsu-motion-*`，motion.ts 按字面类名挂载）在新构建下全灭。现按 css-modules 语义剥壳并保持这些类全局；`@keyframes dsu-motion-*` 保持非 scoped（与引用一致）。
- 验证：`node build.mjs` 全绿；产物抽查 `:global(` 零残留、`.dsu-motion-*` 全局类与 keyframes 均在；`plugin-safety check` 全绿；web 实测（忽略缓存重载）motion 样式注入为全局类、`#root` computed `backdrop-filter: blur(14px) saturate(1.25)`。

## 2026-08-28 - 新增「文字颜色」调节；移除死旋钮「聊天列不透明度」

- 起因：用户希望正文/侧栏会话标题等文字颜色可自由调节（不止深浅两套）。普查官方前端后确认全 UI 的中性文字都骑在同一条 label 阶梯上（`color: var(--dsw-alias-label-*)` 消费计数：primary ×177、tertiary ×171、secondary ×142、caption ×55、dimmed ×17），按阶梯开放五个档位即覆盖全部板块。
- 新增 10 个字符串字段（`''` = 官方默认）：`inkPrimary` / `inkSecondary` / `inkTertiary` / `inkCaption` / `inkDimmed` 覆盖浅色模式，`darkInkPrimary` … `darkInkDimmed` 仅覆盖深色模式（空 = 跟随浅色值）。档位与板块对应：primary = 聊天正文 / 侧栏会话标题 / 面板标题；secondary = 副标题 / 列表元信息 / 任务步骤；tertiary = 时间戳 / 弱说明 / 上下文注入内容；caption = 最小号说明；dimmed = 更浅的辅助文字。
- `apply.ts`：非空才写 `--dsu-ink-*` / `--dsu-dark-ink-*`（空则 removeProperty）；`isNeutralConfig` 计入十个新字段。
- `custom.module.css`：浅色块按 `var(--dsu-ink-*, 官方浅色值)`、深色块按 `var(--dsu-dark-ink-*, var(--dsu-ink-*, 官方深色值))` 重声明五个 label token——未设置的档位与官方原值完全一致。
- 设置页「外观」新增「文字颜色」卡片（`ink` 参数组，支持组内重置）：浅色/深色两个小节各五行，取色器起始值即官方当前色；文本框留空 = 官方默认 / 跟随浅色；预览迷你界面的聊天区底色改用主表面变量。
- 移除 `chatSurfaceOpacity`（聊天列不透明度）：其 token `--dsw-chat-surface` 在当前官方前端无任何定义与消费方（历史设计依赖上游 `ConversationRoot` 的回退读取，该回退已不存在），属死旋钮；schema、settings base、预设、随机灵感、主题映射、表单、预览、README 全链路清除。
- 兼容性：旧 settings 文档里残留的 `chatSurfaceOpacity` 键会被 schema/normalize 静默忽略；「我的预设」JSON 中残留的同名字段同样无效。
- 构建：新增本地 `build.mjs`（上游经 monorepo tsdown 预设构建，本环境不存在；复用 Aqua 插件本地 esbuild，先试裸导入再回退相对路径），一次产出 `lib/index.js`（ESM，@deepseek-ai/* 外部化）与 `lib/client.js`（`__ModuleLoader__` 工厂 + `style[data-plugin-css]` CSS-module 注入，类名 `u<hash>_<name>`）。`lib/types/` 下的 .d.ts 仍为上游产物，本次未再生成。
- 验证：`node build.mjs` 全绿（client.js 1,187,238 bytes；产物抽查：ink 变量与 label 覆写链均在、chat-alpha/chatSurfaceOpacity 零残留、`lib/index.js` ESM 导入正常导出 `apply`）；`plugin-safety check` 全绿（18 插件双端一致）。

## 快照

- 本次改动前：`20260828-153010-字色调节功能与移除聊天列死旋钮（改动前）`
