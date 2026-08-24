# Changelog

## 2026-08-22 - 根目录浏览范围修正

### Fixed

- 输入裸 `@` 时仅展示工作区根目录的直接文件和目录，不再将子目录中的条目混入初始列表。
- 保留递归索引、文件名搜索和通过 `@目录/` 导航子目录的现有行为。

### Verification

- `pnpm exec vitest run tests/search.spec.ts tests/source.spec.ts` 通过（2 个测试文件，36 个测试）。
- `lib/client.js` 已重新生成，并确认包含根目录筛选逻辑。
- `plugin-safety check` 通过（15 个插件全部正常）。
- 完整 `pnpm run check` 的 `tsc --noEmit` 仍受 Desktop 安装目录中 DSH 包缺失声明文件影响；本次未改动该宿主类型链。
- Desktop 调试端口 `9333` 未监听，无法执行真实交互验收。
