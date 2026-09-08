> **来源与许可**：基于 [Tasihi89/dsh-talk-map](https://github.com/Tasihi89/dsh-talk-map)（MIT）开发，固定 commit `b2d36d69b65f1a6a2c76022b1226392683767b9d`（= v0.1.0）。构建产物已提交（`lib/index.js` + `client/client.js`），无需本地构建。

**本地改动（Local modifications）**：
- **卡片自动同步（local.1/local.2，2026-09-03）**：已导入工作区（`wsFrames` 有框）的会话自动上图——`turn/end` 实时触发 + 启动 backfill 补历史漏卡；门槛：非 subagent、未归档、非空白、无既有卡；位置 layoutMemory 优先否则组内网格续排。local.2 修复 backfill 阶梯摆位（误用 members.length 当槽位号致 y 复利到 63920px；改回客户端 gridIndex 语义）。仅 host 半区改动（`src/host/card-autosync.ts` + `src/index.ts` 第四层注入），重启 Host 生效
- Web/Desktop 双端 `link:` 依赖 + 各自 `cordis.patch.yml` 唯一 `talk-map` insert；**不写入 `dsh.profile.bundles`**

# dsh-talk-map · Talk Map

English | [中文](README.zh.md)

A visual conversation map plugin for DeepSeek Harness (dsh): every session becomes a card on an infinite whiteboard.

- **Spatial memory instead of working memory**: free placement + grid snapping, and nothing ever rearranges your cards — if you remember "that conversation was bottom-left", it stays bottom-left. Designed for ADHD users, useful for everyone.
- **Double-click to chat**: double-click empty canvas to start a new session; the card is born exactly where you clicked.
- **Draw an edge to fork**: drag a line from a card onto empty space, preview (and edit) the context digest to inject, confirm — a new session starts *knowing* the old conversation.
- **Card front = resume surface**: title, the digest's "next step", relative time, running state. One glance tells you what to do next.
- **Automatic digests**: after a session goes idle, a three-field digest (summary / key findings / next step) is generated with your deployment's default model; hit ⟳ on a card to regenerate manually.
- **Bilingual interface**: the map's own copy renders in Chinese or English. The pill in the map header cycles Auto → 中文 → English; Auto follows dsh's own language, and the choice is remembered across restarts. (Digests stay in the language of the conversation they summarise.)
- **Provenance visible**: dsh's native fork/subagent lineage renders as dashed edges; your injection edges are solid.

## Install

```sh
# GitHub (built artifacts are committed — no build step, no allowBuilds needed)
dsh plugin --profile web add github:Tasihi89/dsh-talk-map
```

npm package (`dsh plugin --profile web add dsh-talk-map`) coming soon.

Restart `dsh web`; a map button appears at the sidebar foot.

## Usage

| Action | Effect |
|---|---|
| Sidebar map button / Esc | toggle the map |
| Drag a card | place it (16px grid snap, persisted) |
| Double-click empty space | create a session there and enter it |
| Double-click a card | open that session |
| Drag from a card's right handle to empty space | preview injection → fork a new session |
| ⟳ on a card | regenerate the digest |
| Language pill in the map header | cycle Auto → 中文 → English |

## Where data lives

- Canvas data (positions, edges, digests): `$DSH_HOME/storages/talk_map.json` via dsh's official storage-domain, atomically persisted.
- Sessions themselves stay fully owned by dsh — this plugin reads them, and creates new ones only through official APIs when forking.
- Digests use your configured default model through dsh's local LLM channel; there are no other external requests.

## Compatibility

Built against deepseek-harness `0.1.0-rc.6` (rc-stage APIs may drift). The structural contracts live in `src/client/dsh.ts` and `src/host/dsh-host.ts` — start there when upgrading.

## Roadmap

Multi-board shelf (project = board, WIP limit) · whole-board archive/shelve · timeline view (camera fly-back) · alias cards · multi-parent merge UI · selection-level injection · quick-ask on card · two-week fade.

## Development

```sh
pnpm install
pnpm run build        # host → lib/, client → client/client.js
dsh plugin --profile dev add /abs/path/dsh-talk-map
dsh --profile dev     # add a profile patch to change the port and coexist with your main instance
```

MIT License.
