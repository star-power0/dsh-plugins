export const IDE_THEME_CSS = `/* IDE surfaces follow DSH theme tokens so wallpaper can remain visible behind them. */
[data-ide-workbench],
[data-ide-sidebar-tree] {
  --ide-border: var(--dsw-alias-border-l2, rgba(19, 45, 83, 0.14));
  --ide-muted: var(--dsw-alias-label-tertiary, #5d7696);
  --ide-accent: var(--dsw-alias-state-business-primary, #3f76d8);
  --ide-hover: var(--dsw-alias-interactive-bg-hover, rgba(63, 118, 216, 0.08));
  --ide-tabbar: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #ecf2fa) 36%, transparent);
  --ide-tab-active: color-mix(in srgb, var(--dsw-alias-bg-layer-1, #ffffff) 42%, transparent);
  color: var(--dsw-alias-label-primary, #13243e);
}

[data-ide-sidebar-tree][data-panel-open='true'] {
  background: var(--dsw-alias-bg-layer-1, #ffffff);
  border-right: 1px solid var(--ide-border);
}

[data-ide-tree-overlay-open] {
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
}

[data-ide-sidebar-tree][data-panel-open='false'] {
  background: transparent;
  border-right: none;
}

[data-dsh-aqua] [data-ide-sidebar-tree][data-panel-open='true'] {
  background: color-mix(in srgb, var(--dsh-aqua-glass-card-light, #ffffff) 42%, transparent);
  backdrop-filter: blur(var(--dsh-aqua-blur, 14px));
  -webkit-backdrop-filter: blur(var(--dsh-aqua-blur, 14px));
}

[data-dsh-aqua] body[data-ds-dark-theme] [data-ide-sidebar-tree][data-panel-open='true'] {
  background: color-mix(in srgb, var(--dsh-aqua-glass-card-dark, #22262f) 48%, transparent);
}

[data-dsh-aqua] [data-ide-sidebar-tree][data-panel-open='false'] {
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

[data-dsh-aqua] [data-ide-sidebar-tree] {
  color: var(--dsw-alias-label-primary, #13243e);
}

[data-dsh-aqua] [data-ide-sidebar-tree][data-panel-open='true'] {
  border-right: 1px solid var(--dsw-alias-border-l1, rgba(19, 45, 83, 0.08));
}

[data-dsh-aqua] [data-ide-workbench] {
  border-left: 1px solid var(--dsw-alias-border-l1, rgba(19, 45, 83, 0.08));
}

[data-ide-tree-panel],
[data-ide-workbench-root],
[data-ide-editor-root] {
  background: transparent;
  color: var(--dsw-alias-label-primary, #13243e);
}

[data-ide-tree-title],
[data-ide-sidebar-title] {
  color: var(--dsw-alias-label-secondary, #40597a);
  border-color: var(--ide-border);
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #ecf2fa) 22%, transparent);
}

[data-dsh-aqua] [data-ide-tree-title],
[data-dsh-aqua] [data-ide-sidebar-title] {
  background: color-mix(in srgb, var(--dsh-aqua-glass-card-light, #ffffff) 18%, transparent);
  backdrop-filter: blur(calc(var(--dsh-aqua-blur, 14px) * 0.65));
  -webkit-backdrop-filter: blur(calc(var(--dsh-aqua-blur, 14px) * 0.65));
}

[data-dsh-aqua] body[data-ds-dark-theme] [data-ide-tree-title],
[data-dsh-aqua] body[data-ds-dark-theme] [data-ide-sidebar-title] {
  background: color-mix(in srgb, var(--dsh-aqua-glass-card-dark, #22262f) 22%, transparent);
}

[data-ide-sidebar-title] button,
[data-ide-sidebar-title] [role='button'],
[data-ide-tree-panel] button,
[data-ide-editor-root] button {
  color: var(--dsw-alias-label-secondary, #40597a);
}

[data-slot='sidebar.workspaces'] [data-ide-tree-launcher] {
  width: 28px;
  height: 28px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-primary, #13243e);
  cursor: pointer;
}

[data-slot='sidebar.workspaces'] [data-ide-tree-launcher-host] {
  display: contents;
}

[data-slot='sidebar.workspaces'] [class*='sectionHeader'] > [data-ide-tree-launcher-host] {
  margin-left: 0;
}

[data-slot='sidebar.workspaces'] [class*='rail'] [data-ide-tree-launcher] {
  width: 36px;
  height: 36px;
  margin: 0 0 12px;
  color: var(--dsw-alias-label-primary, #13243e);
}

[data-ide-sidebar-title] button:hover,
[data-ide-tree-panel] button:hover,
[data-ide-editor-root] button:hover,
[data-ide-tree-launcher]:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(63, 118, 216, 0.08)) !important;
  color: var(--dsw-alias-label-primary, #13243e);
}

/* The permission picker is a native menu surface. Keep it opaque enough to
   preserve the labels underneath the Aqua wallpaper, like model/workspace menus. */
[data-dsh-aqua] [role='menu'] {
  background: var(--dsw-specific-menu, var(--dsw-alias-bg-layer-3, rgba(234, 241, 249, 0.96)));
  color: var(--dsw-alias-label-primary, #13243e);
  border-color: var(--dsw-alias-border-l2, rgba(19, 45, 83, 0.14));
  box-shadow: var(--dsw-shadow-lv2, 0 8px 24px rgba(19, 45, 83, 0.16));
  backdrop-filter: blur(var(--dsh-aqua-blur, 14px));
  -webkit-backdrop-filter: blur(var(--dsh-aqua-blur, 14px));
}

[data-dsh-aqua] body[data-ds-dark-theme] [role='menu'] {
  background: var(--dsw-specific-menu, var(--dsw-alias-bg-layer-3, rgba(28, 42, 61, 0.96)));
  color: var(--dsw-alias-label-primary, #eaf2fc);
}

[data-ide-tree-panel] [data-ide-tree-row]:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(63, 118, 216, 0.08));
}

[data-ide-tree-panel] input,
[data-ide-tree-menu],
[data-ide-delete-dialog] {
  background: var(--dsw-alias-bg-overlay, rgba(220, 231, 244, 0.6));
  color: var(--dsw-alias-label-primary, #13243e);
  border-color: var(--ide-border);
}

[data-dsh-aqua] [data-ide-tree-menu],
[data-dsh-aqua] [data-ide-delete-dialog] {
  background: var(--dsh-aqua-glass-card-light, rgba(255, 255, 255, 0.42));
  backdrop-filter: blur(var(--dsh-aqua-blur, 14px));
  -webkit-backdrop-filter: blur(var(--dsh-aqua-blur, 14px));
}

[data-dsh-aqua] body[data-ds-dark-theme] [data-ide-tree-menu],
[data-dsh-aqua] body[data-ds-dark-theme] [data-ide-delete-dialog] {
  background: var(--dsh-aqua-glass-card-dark, rgba(34, 38, 47, 0.5));
}

[data-ide-editor-root] .cm-editor,
[data-ide-editor-root] .cm-scroller,
[data-ide-editor-root] .cm-gutters,
[data-ide-editor-root] [data-ide-preview] {
  background: transparent !important;
}

[data-ide-editor-root] [data-ide-status-bar] {
  color: var(--dsw-alias-label-tertiary, #5d7696);
  border-color: var(--ide-border);
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #ecf2fa) 18%, transparent);
}

[data-dsh-aqua] [data-ide-editor-root] [data-ide-status-bar] {
  background: color-mix(in srgb, var(--dsh-aqua-glass-card-light, #ffffff) 16%, transparent);
}

[data-dsh-aqua] body[data-ds-dark-theme] [data-ide-editor-root] [data-ide-status-bar] {
  background: color-mix(in srgb, var(--dsh-aqua-glass-card-dark, #22262f) 18%, transparent);
}

[data-ide-editor-root] [data-ide-tab-strip] {
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #ecf2fa) 24%, transparent) !important;
  border-color: var(--ide-border) !important;
}

[data-dsh-aqua] [data-ide-editor-root] [data-ide-tab-strip] {
  backdrop-filter: blur(calc(var(--dsh-aqua-blur, 14px) * 0.5));
  -webkit-backdrop-filter: blur(calc(var(--dsh-aqua-blur, 14px) * 0.5));
}

[data-ide-editor-root] [data-ide-tab][data-active='true'] {
  background: var(--ide-tab-active) !important;
  color: var(--dsw-alias-label-primary, #13243e) !important;
}

[data-ide-editor-root] [data-ide-tab] {
  border-color: var(--ide-border) !important;
  color: var(--dsw-alias-label-secondary, #40597a) !important;
}

[data-dsh-aqua] [data-ide-editor-root] [data-ide-tab][data-active='true'] {
  background: color-mix(in srgb, var(--dsh-aqua-glass-card-light, #ffffff) 26%, transparent) !important;
}

[data-dsh-aqua] body[data-ds-dark-theme] [data-ide-editor-root] [data-ide-tab][data-active='true'] {
  background: color-mix(in srgb, var(--dsh-aqua-glass-card-dark, #22262f) 32%, transparent) !important;
}

[data-ide-editor-root] [data-ide-terminal] {
  background: transparent !important;
  border-color: var(--ide-border) !important;
}

[data-dsh-aqua] [data-ide-editor-root] [data-ide-terminal] {
  backdrop-filter: blur(calc(var(--dsh-aqua-blur, 14px) * 0.45));
  -webkit-backdrop-filter: blur(calc(var(--dsh-aqua-blur, 14px) * 0.45));
}

[data-ide-tree-handle],
.ide-chat-handle {
  background: transparent;
}

[data-ide-tree-handle]:hover,
.ide-chat-handle:hover {
  background: var(--dsw-alias-interactive-bg-active, rgba(63, 118, 216, 0.2)) !important;
}

[data-dsh-aqua] body[data-ds-dark-theme] [data-ide-workbench],
[data-dsh-aqua] body[data-ds-dark-theme] [data-ide-sidebar-tree],
[data-dsh-aqua] body[data-ds-dark-theme] [data-ide-tree-panel],
[data-dsh-aqua] body[data-ds-dark-theme] [data-ide-workbench-root],
[data-dsh-aqua] body[data-ds-dark-theme] [data-ide-editor-root] {
  color: var(--dsw-alias-label-primary, #eaf2fc);
}

[data-dsh-aqua] body[data-ds-dark-theme] [data-ide-sidebar-title],
[data-dsh-aqua] body[data-ds-dark-theme] [data-ide-tree-title],
[data-dsh-aqua] body[data-ds-dark-theme] [data-ide-editor-root] [data-ide-tab] {
  color: var(--dsw-alias-label-secondary, #afc3dc) !important;
}
`

let injected = false

export function ensureIdeThemeCss(): void {
  if (injected || typeof document === 'undefined') return
  const style = document.createElement('style')
  style.setAttribute('data-ide-theme-css', '')
  style.textContent = IDE_THEME_CSS
  document.head.appendChild(style)
  injected = true
}
