# dsh-talk-map · 本地维护版

> **来源与许可**：基于 [Tasihi89/dsh-talk-map](https://github.com/Tasihi89/dsh-talk-map)（**MIT**）
> 开发，固定 commit `b2d36d69b65f1a6a2c76022b1226392683767b9d`（= v0.1.0）。上游版权声明保留于
> 本目录 `LICENSE`。构建产物已随仓库提交（`lib/index.js` + `client/client.js`），无需本地构建。
> 中文文档见 [README.zh.md](./README.zh.md)（上游自带）。

**本地改动（Local modifications）**：

- **卡片自动同步（`local.1` / `local.2`，2026-09-03）**：已导入工作区（`wsFrames` 有框）的
  会话自动上图——`turn/end` 实时触发 + 启动 backfill 补历史漏卡；门槛：非 subagent、未归档、
  非空白、无既有卡；位置优先用 `layoutMemory`，否则组内网格续排。
  - `local.2` 修复 backfill 阶梯摆位：原实现把 `members.length` 当网格槽位号，而 origin
    已算到全员最下方，行偏移被双重叠加，y 复利到 63920px。改回客户端 `gridIndex` 语义
    （实时路径恒 slot 0；backfill 每工作区算一次批量 origin，新卡按 0,1,2… 流过 3 列）。
  - 仅 host 半区改动（`src/host/card-autosync.ts` + `src/index.ts` 第四层注入），**重启 Host 生效**。
  - 线上数据已修复：43 张错位卡经 `POST /talk-map/cards/upsert` 重摆（y 范围 63920 → 3552）。
- **接入方式**：Web/Desktop 双端 `link:` 依赖 + 各自 `cordis.patch.yml` 唯一 `talk-map` insert；
  **不写入 `dsh.profile.bundles`**（bundles 栈与手工 insert 同时存在会触发
  `duplicate loader entry id` 并使 Host 启动失败）。

## 这是什么

dsh 的可视化对话地图：**每个会话变成白板上的一张卡片**。

- **空间记忆代替脑内记忆**：卡片自由摆放 + 网格吸附，位置永不被自动打乱——你记得"那个
  对话在左下角"，它就一直在左下角。为 ADHD 用户设计，对所有人有效。
- **双击即聊**：双击白板空白处就地新建会话，卡片出生在你点的位置。
- **连线分叉**：从一张卡拉线到空白处，预览（可编辑）将要注入的上下文摘要，确认后开一个
  "带着旧对话记忆"的新会话。
- **卡片正面 = 恢复现场**：标题、摘要的"下一步"、相对时间、运行状态。
- **自动摘要**：会话空闲后用部署的默认模型生成三字段摘要（概要 / 关键结论 / 下一步）；
  卡片上的 ⟳ 可手动重生成。
- **中英双语界面**：地图文案可切换 自动 → 中文 → English，选择跨重启记忆。
- **血缘可见**：dsh 原生 fork/子代理血缘画虚线，注入线画实线。

## 使用

| 操作 | 效果 |
|---|---|
| 侧栏地图按钮 / Esc | 开关地图 |
| 拖动卡片 | 摆放（16px 网格吸附，持久化） |
| 双击空白处 | 就地新建会话并进入 |
| 双击卡片 | 打开该会话 |
| 从卡片右缘把手拖到空白处 | 预览注入 → fork 新会话 |
| 卡片上的 ⟳ | 重新生成摘要 |
| 地图顶栏语言药丸 | 循环 自动 → 中文 → English |

## 数据存哪

- 画布数据（位置、连线、摘要）：`$DSH_HOME/storages/talk_map.json`，经 dsh 官方
  storage-domain 原子持久化。
- 会话本身完全归 dsh 所有——本插件只读取，仅在 fork 时经官方 API 新建。
- 摘要走 dsh 本地 LLM 通道使用你配置的默认模型；无其它外部请求。

## 兼容性

基于 deepseek-harness `0.1.0-rc.6` 构建（rc 阶段 API 可能漂移）。结构性契约位于
`src/client/dsh.ts` 与 `src/host/dsh-host.ts`——升级时从这两处开始核查。

## 开发

```sh
pnpm install
pnpm run build        # host → lib/，client → client/client.js
```

本机改 host 半区后需**重启 Host** 生效。

## License

MIT（继承自上游）。上游版权声明保留于本目录 `LICENSE`；本地改动同样以 MIT 释出。
