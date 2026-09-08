# dsh-talk-map 变更记录

## 2026-09-03 · local.2 — 修复 backfill 阶梯摆位（60k-px staircase）

**症状**：首次 backfill 把 42 张卡排成阶梯状，y 坐标复利增长到 63920px，白板被拉成超长条，fit view 缩放小到不可用。

**根因**：`positionCard` 把 `members.length` 当网格槽位号传给 `gridPosition`，而 origin 本身已算到全员最下方——`floor(n/3)` 行偏移被双重叠加，每张新卡比上一张多坠数百像素。

**修复**：

- 槽位号改回客户端语义（`MapCanvas.syncGroup` 的 gridIndex）：实时路径恒 slot 0（origin 已在全员下方）；backfill 每工作区计算一次批量 origin，新卡按 0,1,2… 流过 3 列网格。
- 记忆位卡（layoutMemory）不占槽位；已上图会话不耗槽位（新增 `hasCardSession` 辅助）。
- 线上数据已修复：43 张错位卡按"同组原有成员"为锚点经 `POST /talk-map/cards/upsert` 重摆（y 范围 63920 → 3552），未重启即生效（SSE 推送）。

**验证**：回归测试扩到 14 项——夹具加到 3 个既有成员（旧代码 ≥3 成员必现阶梯，可被拦截），断言 3 张新卡同排 0/1/2 槽位 + 实时落点 slot 0；typecheck/build/check 全绿。

**注意**：修复构建后需再重启一次 Host；运行旧代码期间产生的新卡仍会摆歪（本次已连同重摆）。

## 2026-09-03 · local.1 — 卡片自动同步（card auto-sync）

**背景**：地图是导入式白板——8/25 导入后新建的会话不会自动上图，需手动「同步分组」。丞相要求自动同步。

**改动**（仅 host 半区，client 未动）：

- 新增 `src/host/card-autosync.ts`（`CardAutoSync`）：已导入工作区（`global.wsFrames` 有框）的会话自动上图。两个入口共享一条放置路径：
  - 实时：`session/event` 的 `turn/end` 触发；
  - 启动 backfill：给所有有框工作区中尚无卡片的历史会话补上图。
- 上图门槛（全部满足才上图）：工作区已导入（有存储框）＋ 无既有卡片 ＋ header `origin !== 'subagent'` ＋ 未归档 ＋ 日志至少一条非 tool 的 `user/message`（空白会话不上图）。
- 位置规则镜像客户端 import：`layoutMemory` 记忆位优先，否则在组内成员网格之后续排（与客户端同常量：GRID 16 / 卡 224×120 / GAP 48×56 / 3 列），空框则停在框内左上。
- 写入走 `store.cards.put`，经 `domain/changed` SSE 推到打开的地图，框由客户端自适应。并发放护住：同会话 in-flight 去重。
- `src/index.ts` 新增第四层注入 `['sessionQuery', 'workspaceRegistry']`（`dsh-talk-map: card auto-sync`），层缺服务只令该层失效。
- 工作区解析：`workspaceRegistry.list().sessionIds` 命中优先，否则 `resolveByPath(header.cwd)` 兜底。

**验证**：

- `pnpm typecheck` ＋ `pnpm run build`（lib 重建，client 无变化重打包）全绿；
- 新增回归 `maintenance/test-talk-map-autosync.mjs`（mock cordis ctx 驱动真实 `lib/index.js` apply，11 项断言：backfill / subagent / blank / archived / 未导入 / 重复卡 / turn/end 兜底 / burst 去重 / layoutMemory / 非 turn/end 忽略）全过；
- `plugin-safety check` 全绿（19 插件双端一致）。

**生效条件**：host 改动，需重启 DSH（web 与 desktop 各一次）。重启后首次启动 backfill 会把三个已导入工作区漏掉的历史会话一次性补上图。

**回退**：存档 `plugin-snapshots/20260903-065057-talk-map-card-autosync`。
