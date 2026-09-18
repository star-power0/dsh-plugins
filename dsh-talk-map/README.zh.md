# dsh-talk-map · 本地维护版

[English](README.md) | 中文

> **来源与许可**：基于 [Tasihi89/dsh-talk-map](https://github.com/Tasihi89/dsh-talk-map)（**MIT**）
> 开发，固定 commit `b2d36d69b65f1a6a2c76022b1226392683767b9d`（= v0.1.0）。上游版权声明保留于
> 本目录 `LICENSE`。构建产物已随仓库提交（`lib/index.js` + `client/client.js`），无需本地构建。

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

DeepSeek Harness（dsh）的可视化对话地图插件：把你的每一个会话变成白板上的一张卡片。

- **空间记忆代替脑内记忆**：卡片自由摆放 + 网格吸附，位置永远不会被自动打乱——你记得
  "那个对话在左下角"，它就一直在左下角。为 ADHD 用户设计，对所有人有效。
- **双击即聊**：双击白板空白处，就地新建一个会话，卡片出生在你点的位置。
- **连线分叉**：从一张卡拉一根线到空白处，预览（可编辑）将要注入的上下文摘要，确认后开
  一个"带着旧对话记忆"的新会话。
- **卡片正面 = 恢复现场**：标题、摘要的"下一步"、相对时间、运行状态。回来扫一眼就知道该干嘛。
- **自动摘要**：会话空闲后自动生成三字段摘要（概要 / 关键结论 / 下一步），用你部署里的
  默认模型；卡片上的 ⟳ 可手动重生成。
- **中英双语界面**：地图自己的文案可以选中文或英文。地图顶栏那颗药丸按钮循环切换
  自动 → 中文 → English，「自动」跟随 dsh 本身的语言，选择会记住，重启也在。
- **血缘可见**：dsh 原生的 fork/子代理血缘自动画成虚线，你拉的注入线是实线。

## 使用

| 动作 | 效果 |
|---|---|
| 点侧栏地图按钮 / Esc | 开关地图 |
| 拖动卡片 | 摆放（16px 网格吸附，位置持久化） |
| 双击空白 | 在该位置新建会话并进入 |
| 双击卡片 | 打开该会话 |
| 从卡片右侧拉线到空白 | 预览注入上下文 → 开分叉会话 |
| 卡片上的 ⟳ | 手动重新生成摘要 |
| 地图顶栏的语言按钮 | 循环切换 自动 → 中文 → English |

## 数据存哪

- 画布数据（卡片位置、连线、摘要）：`$DSH_HOME/storages/talk_map.json`，走 dsh 官方
  storage-domain，原子落盘。
- 会话本身：完全归 dsh 管，本插件只读会话、只在分叉时通过官方 API 创建新会话。
- 摘要生成用你配置的默认模型，走本地 dsh 的 LLM 通道；除此之外无任何外部请求。

## 兼容性

针对 deepseek-harness `0.1.0-rc.6` 开发（rc 阶段 API 可能漂移）。结构化契约集中在
`src/client/dsh.ts` 与 `src/host/dsh-host.ts`，升级排查从这两个文件开始。

## 开发

```sh
pnpm install
pnpm run build        # host → lib/，client → client/client.js
```

本机改 host 半区后需**重启 Host** 生效。

## License

MIT（继承自上游）。上游版权声明保留于本目录 `LICENSE`；本地改动同样以 MIT 释出。
