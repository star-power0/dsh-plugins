# Changelog

## 2026-08-25

- 深色/浅色主题下的「黑块」修复：壁纸插件此前只把 `bg-base` / `sidebar-fill` 置透明、输入卡片与气泡做玻璃，其余带自身不透明底色的表面在深色下保持近黑（新会话按钮 `button-elevated-fill`、输入框 `+` 号 `specific-selector`、代码块 `markdown-code-block/inline-code`、goal 设置 `specific-tip`、菜单/胶囊 `specific-menu`/`bg-module-platform`）。现在深浅两套都改为半透明玻璃（alpha 0.5–0.62），代码块 `pre` 额外加 `backdrop-filter` 毛玻璃。
  - 实现要点：主题 presenter 会把全部 token 内联写到 `<body>`（内联优先级高于任何样式表，且它每次应用都会先 removeProperty 再重写），所以玻璃覆盖必须也内联写入并带 `!important`（`applyEffects` 里 `setProperty(…, "important")`），并用 `MutationObserver` 监听 `<body>` style，主题一重写就把覆盖推回去——这样无论加载顺序、深浅切换都不会被冲掉。
- 启动提速：`localStorage` 除 `id` 外一并持久化解析好的 `url`/`type`，`apply()` 时先 `syncLayers()`+`applyEffects()` 立即挂壁纸层与 scrim、不等 inventory 重扫；inventory 返回后照常 reconcile（旧壁纸失效自动清理）。消除了「启动时先空白、过一会儿才上壁纸」的间隙。
- 附带修掉一处构建隐患：CSS 注释里的反引号会截断模板字符串（`build-client.mjs` 是纯文本包装不解析语法，需靠 `verify-client.mjs` 捕获），已改为尖括号写法。

## 2026-08-22

- 补充当前 Profile 接入、可播放类型、媒体路由和验证范围说明。

## 0.1.4

- 当前运行版本：Wallpaper Engine Video/Web 壁纸发现、媒体路由、背景渲染和玻璃控制。
