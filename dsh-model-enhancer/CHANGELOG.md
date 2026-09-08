# Changelog

## 2026-08-29 - 设置页视觉层次优化（功能不变）

- 优化 provider/model 卡片、行间距、控件边界和保存操作区的层次感。
- 仅调整现有内联样式，未改变模型配置读写、RPC、图片输入或视觉桥逻辑。

## 2026-08-24

- 深色模式修复：设置页样式改用官方主题实际存在的变量（`bg-module-platform` / `border-l1` / `border-l2` / `specific-input-major` / `brand-primary`），修复深色模式下浅底白字看不见的问题。
- 修复 provider 名称与 id 相同时标题重复显示（如「orbelis orbelis」）的 bug。

## 2026-08-22

- 补充模型设置能力、与 ModLens 的边界和验证入口说明。

## 0.1.0

- 当前运行版本：自定义模型图片能力、上下文窗口和最大输出设置 UI。
