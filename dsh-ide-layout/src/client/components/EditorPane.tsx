/** Center column: multi-tab editor with open/edit/save. CodeMirror 6 adds
 * syntax highlighting, line numbers, bracket matching and code folding
 * (replacing the MVP textarea). */

import { useEffect, useRef, useState, type JSX } from 'react'
import { createPortal } from 'react-dom'
import { basicSetup } from 'codemirror'
import { EditorView, Decoration, hoverTooltip, keymap, type DecorationSet, type Tooltip } from '@codemirror/view'
import { Prec, EditorState, StateEffect, StateField, type Extension, type Text } from '@codemirror/state'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { autocompletion, acceptCompletion, type CompletionContext, type CompletionResult } from '@codemirror/autocomplete'
import { forceLinting, linter, type Diagnostic } from '@codemirror/lint'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { python } from '@codemirror/lang-python'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { yaml } from '@codemirror/lang-yaml'
import { xml } from '@codemirror/lang-xml'
import { sql } from '@codemirror/lang-sql'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { rust } from '@codemirror/lang-rust'
import { go } from '@codemirror/lang-go'
import { php } from '@codemirror/lang-php'
import { vue } from '@codemirror/lang-vue'
import { sass } from '@codemirror/lang-sass'
import { less } from '@codemirror/lang-less'
import { StreamLanguage } from '@codemirror/language'
import { toml } from '@codemirror/legacy-modes/mode/toml'
import { powerShell } from '@codemirror/legacy-modes/mode/powershell'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import { batchLanguage } from '../batch-mode.ts'
import { apiRead, apiWrite } from '../api.ts'
import type { EditorTab } from '../store.ts'
import { languageIdForPath } from '../../core/types.ts'
import {
  LspClient, completionInfo, completionType, normalizeUri, pathToUri,
  type LspDiagnostic, type LspLocation, type LspPosition, type LspRange, type LspTextEdit,
} from '../lsp-client.ts'
import { TerminalPane } from './TerminalPane.tsx'
import { PreviewPane, isMarkdown, isPreviewable } from './PreviewPane.tsx'
import { IconClose, IconEdit, IconEye, IconSave, IconTerminal } from '../icons.tsx'
import { encodingLabel, TEXT_ENCODING_CHOICES } from '../../core/encoding.ts'

interface EditorPaneProps {
  root: string
  tabs: EditorTab[]
  activeTabId: string | null
  onActivate: (id: string) => void
  onClose: (id: string) => void
  onContentChange: (id: string, content: string) => void
  onDirtySave: (tab: EditorTab) => void
  onCloseEditor: () => void
  /** 把选中代码交给内置 agent（追加到聊天输入框）。 */
  onAskAgent: (text: string, path: string) => void
  /** 打开一个文件（相对路径），可选定位到指定行（0-based）。 */
  onOpenFile: (path: string, line?: number) => void
  /** LSP 诊断推送上抛（写入 IdeState.diagnostics，供问题面板聚合）。 */
  onDiagnostics: (uri: string, diagnostics: LspDiagnostic[]) => void
  /** 编码切换后以新内容整体替换 tab（content/encoding/mtime/dirty 一起更新）。 */
  onReloadTab: (tab: EditorTab) => void
}

/** Pick a CodeMirror language by file extension. */
function languageFor(path: string): Extension {
  const ext = (path.split('.').pop() ?? '').toLowerCase()
  switch (ext) {
    case 'js': case 'mjs': case 'cjs': return javascript()
    case 'jsx': return javascript({ jsx: true })
    case 'ts': return javascript({ typescript: true })
    case 'tsx': case 'mts': case 'cts': return javascript({ typescript: true, jsx: true })
    case 'json': case 'jsonc': case 'map': return json()
    case 'md': case 'markdown': return markdown()
    case 'py': case 'pyw': return python()
    case 'html': case 'htm': return html()
    case 'css': return css()
    case 'yaml': case 'yml': return yaml()
    case 'xml': case 'svg': case 'xsl': case 'plist': return xml()
    case 'sql': case 'mysql': case 'pgsql': return sql()
    case 'java': return java()
    case 'c': case 'h': case 'cc': case 'cpp': case 'cxx': case 'hpp': case 'hh': return cpp()
    case 'rs': return rust()
    case 'go': return go()
    case 'php': return php()
    case 'vue': return vue()
    case 'scss': return sass()
    case 'less': return less()
    case 'java': return java()
    case 'toml': return StreamLanguage.define(toml)
    case 'cmd': case 'bat': return batchLanguage
    case 'ps1': case 'psm1': case 'psd1': return StreamLanguage.define(powerShell)
    case 'sh': case 'bash': case 'zsh': return StreamLanguage.define(shell)
    default: return []
  }
}

/** 高对比高亮：经典 IDE 配色（关键字深蓝加粗 / 注释绿斜体 / 字符串暖棕 / 数字深绿）。
 *  配色刻意避开红色系：红色只留给 LSP 诊断的「红色下波浪线」（错误语义唯一来源），
 *  避免普通高亮被误认成报错。颜色用 CSS 变量承载：默认亮色系（浅背景），
 *  皮肤（如 maid-atelier）可在自己的 CSS 里按亮/暗主题覆盖变量适配深背景。 */
const ideHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.operatorKeyword, t.definitionKeyword], color: 'var(--ide-hl-keyword, #0000FF)', fontWeight: '600' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: 'var(--ide-hl-comment, #008000)', fontStyle: 'italic' },
  // 字符串用暖棕（避开 #A31515 深红，防止与错误提示混淆）。
  { tag: [t.string, t.special(t.string), t.character], color: 'var(--ide-hl-string, #B45309)' },
  { tag: [t.number, t.integer, t.float], color: 'var(--ide-hl-number, #098658)' },
  { tag: [t.bool, t.null, t.atom], color: 'var(--ide-hl-bool, #0000FF)' },
  { tag: [t.function(t.variableName), t.definition(t.function(t.variableName))], color: 'var(--ide-hl-function, #795E26)' },
  { tag: [t.className, t.typeName, t.definition(t.className)], color: 'var(--ide-hl-class, #267F99)' },
  { tag: [t.propertyName], color: 'var(--ide-hl-property, #0070C1)' },
  { tag: [t.definition(t.variableName)], color: 'var(--ide-hl-variable, #001080)' },
  // invalid 高亮改中性灰：真正的语法错误由 LSP 红色波浪线表达（红线只此一处语义）。
  { tag: t.invalid, color: 'var(--ide-hl-invalid, #6B7280)' },
  // 兜底：未显式覆盖的符号类 tag 统一用主文字色（防语言包/默认 style 带红色系）。
  { tag: [t.operator, t.punctuation, t.bracket, t.separator, t.attributeName, t.meta, t.processingInstruction], color: 'var(--ide-hl-base, #24292F)' },
  // Markdown：标题加粗深蓝 / 强调斜体 / 链接下划线蓝 / 引用与行内代码 / 删除线灰。
  { tag: [t.heading, t.heading1, t.heading2, t.heading3, t.heading4, t.heading5, t.heading6], color: 'var(--ide-hl-heading, #0000FF)', fontWeight: '600' },
  { tag: [t.emphasis, t.strong], color: 'var(--ide-hl-emphasis, #795E26)', fontStyle: 'italic' },
  { tag: [t.link, t.url], color: 'var(--ide-hl-link, #0070C1)', textDecoration: 'underline' },
  { tag: [t.quote, t.monospace], color: 'var(--ide-hl-quote, #008000)' },
  { tag: t.strikethrough, color: 'var(--ide-hl-strikethrough, #9ca3af)' },
])

interface CodeMirrorPaneProps {
  tab: EditorTab
  onContentChange: (id: string, content: string) => void
  onSave: (tab: EditorTab) => void
  /** 编辑器内右键菜单回调（选中文本非空时触发）。 */
  onContextAction: (kind: 'ask-agent' | 'copy', text: string) => void
  /** LSP 客户端（当前 root 一个，可为 null = 未启用）。 */
  lsp: LspClient | null
  /** 当前文件的最新 LSP 诊断（EditorPane 层按 uri 缓存）。 */
  diagnostics: LspDiagnostic[]
  /** 跳转定义：把目标文件（相对路径 + 行）交给 EditorPane 打开。 */
  onOpenLocation: (path: string, line: number, character: number, endCharacter: number) => void
  /** 打开本文件后要定位到的行（0-based；null = 不定位）。 */
  revealLine: number | null
  /** 跳转目标的字符位置（0-based），用于选中目标符号。 */
  revealCharacter: number | null
  /** 跳转目标的结束字符位置（0-based），用于选中目标符号。 */
  revealEndCharacter: number | null
  /** 定位完成后清空 revealLine。 */
  onRevealDone: () => void
  root: string
  /** 光标位置变化回调（状态栏行列显示）。 */
  onCursor?: (line: number, column: number) => void
  /** 编辑器字号（px，Ctrl/Cmd+滚轮调整）。 */
  fontSize: number
  /** 字号变化回调（Ctrl/Cmd+滚轮），父层持久化并显示。 */
  onFontSizeChange: (size: number) => void
}

/** LSP 0-based {line, character} → CodeMirror 文档 offset。 */
function lspPosToOffset(doc: Text, pos: LspPosition): number {
  const line = doc.line(pos.line + 1)
  return Math.min(line.from + Math.max(0, pos.character), line.to)
}

/** LSP Diagnostic → CodeMirror linter Diagnostic（offset 表示）。 */
function toCmDiagnostic(doc: Text, diagnostic: LspDiagnostic): Diagnostic {
  let severity: 'error' | 'warning' | 'info' = 'error'
  if (diagnostic.severity === 2) severity = 'warning'
  else if (diagnostic.severity === 3 || diagnostic.severity === 4) severity = 'info'
  return {
    from: lspPosToOffset(doc, diagnostic.range.start),
    to: lspPosToOffset(doc, diagnostic.range.end),
    severity,
    message: diagnostic.message,
  }
}

/** 补全触发前最宽（保守）的单词匹配：从当前光标往前取标识符字符。 */
function matchWordAt(context: CompletionContext): { from: number; text: string } | null {
  const match = context.matchBefore(/[\w$]+/)
  if (match === null) return null
  return { from: match.from, text: match.text }
}

/** 把 LSP hover 的 contents（MarkupContent / MarkedString[]）渲染成 tooltip DOM。
 *  纯文本直接换行；含代码块（```lang）时按 code 渲染。
 *  滚轮优先悬停栏：内容可滚动时 wheel 由 tooltip 自己消费（不冒泡给页面），
 *  滚到边界后停止——页面不会跟着滚。 */
function renderHoverDom(contents: unknown): HTMLElement {
  const container = document.createElement('div')
  // 皮肤会把 --dsw-alias-bg-base 全局透明化：tooltip 浮层必须自带不透明背景
  // + 文字色 + 边框，否则透出底下代码看不清。
  container.style.cssText = [
    'max-width: 480px', 'max-height: 320px', 'overflow: auto',
    'font-size: 13px', 'line-height: 1.5',
    'padding: 8px 10px', 'border-radius: 6px',
    'background: var(--dsw-alias-bg-overlay, rgba(248,250,255,0.98))',
    'color: var(--dsw-alias-label-primary, #1a1a1a)',
    'border: 1px solid var(--ide-border, #e5e6eb)',
    'box-shadow: 0 8px 24px rgba(0,0,0,0.28)',
  ].join('; ')
  // 滚轮优先：tooltip 内可滚动时接管 wheel；到边界后 stopPropagation（页面不动）。
  container.addEventListener('wheel', (event) => {
    const { scrollTop, scrollHeight, clientHeight } = container
    const canScroll = scrollHeight > clientHeight
    if (!canScroll) {
      event.stopPropagation()
      return
    }
    event.preventDefault()
    event.stopPropagation()
    const atTop = scrollTop <= 0
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1
    // 方向朝外（顶部再往上滚 / 底部再往下滚）时不滚，但也吞掉事件（页面不动）。
    if (!(atTop && event.deltaY < 0) && !(atBottom && event.deltaY > 0)) {
      container.scrollTop += event.deltaY
    }
  }, { passive: false })
  const parts: Array<{ text: string; code: boolean; language?: string }> = []
  const pushString = (text: string): void => {
    // 拆出 ```lang ... ``` 代码块，其余按纯文本。
    const regex = /```([\w+-]*)\n?([\s\S]*?)```/g
    let last = 0
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      if (match.index > last) parts.push({ text: text.slice(last, match.index), code: false })
      parts.push({ text: match[2].trimEnd(), code: true, language: match[1] })
      last = match.index + match[0].length
    }
    if (last < text.length) parts.push({ text: text.slice(last), code: false })
  }
  const value = contents as unknown
  if (typeof value === 'string') {
    pushString(value)
  } else if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string') pushString(item)
      else if (item !== null && typeof item === 'object') pushString(String((item as { value?: unknown }).value ?? ''))
    }
  } else if (value !== null && typeof value === 'object' && 'value' in (value as Record<string, unknown>)) {
    pushString(String((value as Record<string, unknown>).value))
  }
  for (const part of parts) {
    const el = document.createElement(part.code ? 'pre' : 'div')
    el.style.cssText = part.code
      ? 'margin: 2px 0; padding: 4px 6px; border-radius: 4px; background: rgba(127,127,127,0.12); font-family: "Cascadia Code", Consolas, monospace; font-size: 12px; white-space: pre-wrap; word-break: break-word;'
      : 'margin: 1px 0; white-space: pre-wrap; word-break: break-word;'
    el.textContent = part.text
    container.appendChild(el)
  }
  return container
}

/** 从 CodeMirror 状态里把 LSP hover 范围转成 tooltip 的 pos/end（可选）。
 *  注意：client 必须从 propsRef 读取（LSP 连接是异步建立的，mount 时可能
 *  还是 null；用闭包捕获会永远拿到 null → 悬停不工作）。 */
function hoverTooltipFor(
  getClient: () => LspClient | null,
  path: () => string,
): (view: EditorView, pos: number) => Promise<Tooltip | null> {
  return async (view, pos) => {
    const client = getClient()
    if (client === null) return null
    const position: LspPosition = {
      line: view.state.doc.lineAt(pos).number - 1,
      character: pos - view.state.doc.lineAt(pos).from,
    }
    const hover = await client.hover(path(), position)
    if (hover === null) return null
    return {
      pos,
      create: () => ({ dom: renderHoverDom(hover.contents) }),
    }
  }
}

/** Temporary visual marker for the definition target and the Ctrl/Cmd-click link. */
const definitionHighlightEffect = StateEffect.define<{ from: number; to: number } | null>()
const definitionHighlightField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update: (decorations, transaction) => {
    let next = decorations.map(transaction.changes)
    for (const effect of transaction.effects) {
      if (effect.is(definitionHighlightEffect)) {
        next = effect.value === null
          ? Decoration.none
          : Decoration.set([Decoration.mark({ class: 'cm-ide-definition-target' }).range(effect.value.from, effect.value.to)])
      }
    }
    return next
  },
  provide: (field) => EditorView.decorations.from(field),
})

/** Temporary visual marker for a Ctrl/Cmd-click link. */
const definitionLinkEffect = StateEffect.define<{ from: number; to: number } | null>()
const definitionLinkField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update: (decorations, transaction) => {
    let next = decorations.map(transaction.changes)
    for (const effect of transaction.effects) {
      if (effect.is(definitionLinkEffect)) {
        next = effect.value === null
          ? Decoration.none
          : Decoration.set([Decoration.mark({ class: 'cm-ide-definition-link' }).range(effect.value.from, effect.value.to)])
      }
    }
    return next
  },
  provide: (field) => EditorView.decorations.from(field),
})

/** Return the identifier range around an editor position. */
function wordRangeAt(view: EditorView, pos: number): { from: number; to: number } | null {
  const doc = view.state.doc
  const line = doc.lineAt(pos)
  const before = doc.sliceString(line.from, pos)
  const after = doc.sliceString(pos, line.to)
  const left = /[\w$]*$/.exec(before)?.[0] ?? ''
  const right = /^[\w$]*/.exec(after)?.[0] ?? ''
  const from = pos - left.length
  const to = pos + right.length
  return from === to ? null : { from, to }
}

/** F12 / Ctrl+click -> request textDocument/definition at an explicit position. */
interface JumpProps {
  lsp: LspClient | null
  tab: EditorTab
  root: string
  onOpenLocation: (path: string, line: number, character: number, endCharacter: number) => void
  onContentChange: (id: string, content: string) => void
}

/** Request a definition and pass the first target location to EditorPane. */
function jumpToDefinition(view: EditorView, props: JumpProps, positionOffset = view.state.selection.main.head): boolean {
  const client = props.lsp
  if (client === null) return false
  const position = offsetToLsp(view.state.doc, positionOffset)
  const range = wordRangeAt(view, positionOffset)
  if (range !== null) {
    view.dispatch({
      selection: { anchor: range.from, head: range.to },
      effects: definitionLinkEffect.of(range),
    })
  }
  void client.definition(props.tab.path, position).then((locations) => {
    if (locations.length === 0) {
      view.dispatch({ effects: definitionLinkEffect.of(null) })
      return
    }
    const first = locations[0]
    props.onOpenLocation(first.uri, first.range.start.line, first.range.start.character, first.range.end.character)
  }).catch(() => {
    view.dispatch({ effects: definitionLinkEffect.of(null) })
  })
  return true
}

/** 菜单按钮统一样式（与皮肤 overlay 变量配套）。 */
function menuItemStyle(): React.CSSProperties {
  return {
    display: 'block', width: '100%', textAlign: 'left', padding: '5px 14px',
    border: 'none', background: 'transparent', color: 'inherit',
    fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
  }
}

/** 菜单项按钮：hover 时背景加深（内联样式表达不了 :hover，用 hover 状态切换）。
 *  半透明灰在亮/暗浮层上都可见，与皮肤 overlay 变量兼容。 */
function MenuItemButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }): JSX.Element {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...menuItemStyle(), background: hover ? 'rgba(127,127,127,0.12)' : 'transparent' }}
    >
      {children}
    </button>
  )
}

/** 取光标所在处的标识符单词（向前向后扩展 [\w$]）。 */
function wordAt(view: EditorView, pos: number): string | null {
  const doc = view.state.doc
  const line = doc.lineAt(pos)
  const before = doc.sliceString(line.from, pos)
  const after = doc.sliceString(pos, line.to)
  const head = /[\w$]*$/.exec(before)?.[0] ?? ''
  const tail = /^[\w$]*/.exec(after)?.[0] ?? ''
  const word = head + tail
  return word === '' ? null : word
}

/** offset → LSP 0-based position。 */
function offsetToLsp(doc: Text, offset: number): LspPosition {
  const line = doc.lineAt(offset)
  return { line: line.number - 1, character: offset - line.from }
}

/** 把 WorkspaceEdit 应用到编辑器：当前文件的 edits 走 view.dispatch（倒序防偏移），
 *  其他文件的 edits 直接写盘（apiWrite，root 内路径）。返回受影响文件数。 */
async function applyWorkspaceEdit(
  view: EditorView,
  props: JumpProps,
  edit: { changes?: Record<string, LspTextEdit[]>; documentChanges?: Array<{ textDocument: { uri: string }; edits: LspTextEdit[] }> },
): Promise<number> {
  const changes = edit.documentChanges ?? Object.entries(edit.changes ?? {}).map(([uri, edits]) => ({ textDocument: { uri }, edits }))
  const ownUri = normalizeUri(pathToUri(props.root, props.tab.path))
  let touched = 0
  for (const change of changes) {
    const uri = normalizeUri(change.textDocument.uri)
    if (uri === ownUri) {
      // 当前文件：编辑器内应用（倒序，从后往前避免位置漂移）。
      const sorted = [...change.edits].sort((a, b) => b.range.start.line - a.range.start.line || b.range.start.character - a.range.start.character)
      let applied = false
      for (const textEdit of sorted) {
        const from = lspPosToOffset(view.state.doc, textEdit.range.start)
        const to = lspPosToOffset(view.state.doc, textEdit.range.end)
        view.dispatch({ changes: { from, to, insert: textEdit.newText } })
        applied = true
      }
      if (applied) props.onContentChange(props.tab.id, view.state.doc.toString())
      touched += 1
    } else if (props.root !== '') {
      // 其他文件：read → 应用 edits → write 回盘。
      const decoded = normalizeUri(uri).replace(/^file:\/\//, '').replace(/^\//, '')
      const rootUri = normalizeUri(pathToUri(props.root, '')).replace(/^file:\/\//, '').replace(/^\//, '')
      const rel = decoded.toLowerCase().startsWith(rootUri.toLowerCase())
        ? decoded.slice(rootUri.length).replace(/^[\\/]/, '')
        : null
      if (rel === null || rel === '') continue
      // P1-07：跨文件写入必须带读取时的 baseMtime（冲突检测），且拒绝截断/二进制文件
      // —— 防止静默覆盖外部工具刚写入的内容。
      const read = await apiRead(props.root, rel)
      if (!read.ok) continue
      if (read.value.truncated === true) continue
      const sorted = [...change.edits].sort((a, b) => b.range.start.line - a.range.start.line || b.range.start.character - a.range.start.character)
      let content = read.value.content
      const lines = content.split('\n')
      for (const textEdit of sorted) {
        const start = offsetFromLines(lines, textEdit.range.start)
        const end = offsetFromLines(lines, textEdit.range.end)
        if (start === -1 || end === -1) continue
        content = content.slice(0, start) + textEdit.newText + content.slice(end)
        lines.splice(0, lines.length, ...content.split('\n'))
      }
      const written = await apiWrite(props.root, rel, content, read.value.mtime)
      if (written.ok) touched += 1
    }
  }
  return touched
}

/** 由行列表计算 (line, char) 的字符偏移。 */
function offsetFromLines(lines: string[], pos: LspPosition): number {
  if (pos.line < 0 || pos.line >= lines.length) return -1
  let offset = 0
  for (let i = 0; i < pos.line; i++) offset += lines[i].length + 1
  return offset + Math.min(pos.character, lines[pos.line].length)
}

/** 重命名：请求 LSP rename，应用 WorkspaceEdit。 */
async function doRename(view: EditorView, props: JumpProps, newName: string): Promise<void> {
  const client = props.lsp
  if (client === null) return
  const cursor = view.state.selection.main.head
  const edit = await client.rename(props.tab.path, offsetToLsp(view.state.doc, cursor), newName)
  if (edit === null) return
  await applyWorkspaceEdit(view, props, edit)
}

/** 格式化：请求 LSP formatting，把 TextEdit[] 应用到当前文档。 */
async function formatDocument(view: EditorView, props: JumpProps): Promise<void> {
  const client = props.lsp
  if (client === null) return
  const edits = await client.formatting(props.tab.path)
  if (edits.length === 0) return
  const sorted = [...edits].sort((a, b) => b.range.start.line - a.range.start.line || b.range.start.character - a.range.start.character)
  // 倒序逐条 dispatch：每条都基于最新 doc，位置不漂移。
  for (const textEdit of sorted) {
    const from = lspPosToOffset(view.state.doc, textEdit.range.start)
    const to = lspPosToOffset(view.state.doc, textEdit.range.end)
    view.dispatch({ changes: { from, to, insert: textEdit.newText } })
  }
  props.onContentChange(props.tab.id, view.state.doc.toString())
}

/** 快速修复：请求光标处 codeAction，返回菜单项列表（apply 回调已绑定）。 */
async function codeActionsFor(
  view: EditorView,
  props: JumpProps,
  cursor: number,
): Promise<Array<{ title: string; apply: () => void }>> {
  const client = props.lsp
  if (client === null) return []
  const line = view.state.doc.lineAt(cursor)
  const range: LspRange = { start: { line: line.number - 1, character: 0 }, end: { line: line.number - 1, character: line.length } }
  const actions = await client.codeAction(props.tab.path, range)
  return actions.map((action) => ({
    title: action.title,
    apply: () => {
      if (action.edit !== undefined) {
        void applyWorkspaceEdit(view, props, action.edit)
      }
      // command 类修复（如 organize imports 的 executeCommand）暂不支持。
    },
  }))
}

/** One CodeMirror instance per tab. The parent remounts this component via
 * `key={tab.id}` on tab switch; the view is created once on mount and
 * destroyed on unmount (non-controlled: doc flows out via updateListener). */
function CodeMirrorPane({ tab, onContentChange, onSave, onContextAction, lsp, diagnostics, onOpenLocation, revealLine, revealCharacter, revealEndCharacter, onRevealDone, root, onCursor, fontSize, onFontSizeChange }: CodeMirrorPaneProps): JSX.Element {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  // 右键菜单：无选中时也弹出（重命名/格式化/快速修复）；text 为空表示无选中。
  const [menu, setMenu] = useState<{ text: string; x: number; y: number } | null>(null)
  // 快速修复子菜单（光标处 codeAction 列表）
  const [actions, setActions] = useState<{ items: Array<{ title: string; apply: () => void }>; x: number; y: number } | null>(null)
  // 重命名输入框
  const [renameBox, setRenameBox] = useState<{ x: number; y: number; initial: string } | null>(null)
  // Latest props for the mount-time closures (keymap / updateListener / LSP).
  const propsRef = useRef({ tab, onContentChange, onSave, lsp, diagnostics, onOpenLocation, revealLine, revealCharacter, revealEndCharacter, onRevealDone, root, onCursor, fontSize, onFontSizeChange })
  propsRef.current = { tab, onContentChange, onSave, lsp, diagnostics, onOpenLocation, revealLine, revealCharacter, revealEndCharacter, onRevealDone, root, onCursor, fontSize, onFontSizeChange }
  const definitionHoverRef = useRef<{ from: number; to: number } | null>(null)
  // Ctrl/Cmd + 滚轮调整编辑器字号（VS Code 习惯）。
  useEffect(() => {
    const host = hostRef.current
    if (host === null) return
    const onWheel = (event: WheelEvent): void => {
      if (!(event.ctrlKey || event.metaKey)) return
      event.preventDefault()
      const next = Math.min(24, Math.max(9, propsRef.current.fontSize + (event.deltaY < 0 ? 1 : -1)))
      propsRef.current.onFontSizeChange(next)
    }
    host.addEventListener('wheel', onWheel, { passive: false })
    return () => host.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    // LSP 扩展是否安装只看文件类型（语言是否支持），不依赖 lsp 是否已就绪——
    // LSP 连接异步建立，mount 时可能还是 null；扩展先装上，source 内部
    // 通过 propsRef 读最新 lsp（就绪后自动生效）。
    const lspEnabled = languageIdForPath(propsRef.current.tab.path) !== null
    const view = new EditorView({
      doc: propsRef.current.tab.content,
      extensions: [
        basicSetup,
        languageFor(propsRef.current.tab.path),
        // 注意：不能带 { fallback: true } —— 那会让语言自带高亮器（lang-* 的默认配色）优先，
        // 自定义配色完全失效；不带 fallback 时本高亮器与语言高亮并列，注册靠后 CSS 优先
        syntaxHighlighting(ideHighlight),
        EditorView.lineWrapping,
        definitionHighlightField,
        definitionLinkField,
        EditorView.theme({
          '&': {
            height: '100%', fontSize: 'var(--ide-editor-font-size, 13px)',
            backgroundColor: 'var(--dsw-alias-bg-base, #ffffff)',
            color: 'inherit',
          },
          '.cm-scroller': { fontFamily: '"Cascadia Code", Consolas, monospace', lineHeight: '1.6' },
          '.cm-gutters': {
            backgroundColor: 'var(--dsw-alias-bg-base, #ffffff)',
            borderRight: '1px solid rgba(127,127,127,0.2)',
            color: '#9ca3af',
          },
          '.cm-activeLine': { backgroundColor: 'rgba(127,127,127,0.08)' },
          '.cm-activeLineGutter': { backgroundColor: 'rgba(127,127,127,0.08)' },
          '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
            backgroundColor: 'rgba(64,128,255,0.2)',
          },
          '.cm-ide-definition-target': {
            backgroundColor: 'rgba(255, 196, 0, 0.26)',
            borderBottom: '2px solid rgba(245, 158, 11, 0.95)',
            borderRadius: '2px',
          },
          '.cm-ide-definition-link': {
            textDecoration: 'underline',
            textDecorationStyle: 'dotted',
            textDecorationColor: 'var(--ide-accent, #2563eb)',
            textUnderlineOffset: '3px',
            cursor: 'pointer',
          },
          '.cm-content': { caretColor: 'var(--ide-accent, #2563eb)' },
          '&.cm-focused': { outline: 'none' },
        }),
        // P1-04：截断文件只读（readOnly 扩展禁止编辑与输入）。
        ...(propsRef.current.tab.truncated === true
          ? [EditorState.readOnly.of(true), EditorView.editable.of(false)]
          : []),
        Prec.highest(keymap.of([
          {
            key: 'Mod-s',
            run: () => { propsRef.current.onSave(propsRef.current.tab); return true },
          },
          // VS Code 习惯：Tab 接受补全（补全未打开时返回 false → 放行默认缩进）。
          {
            key: 'Tab',
            run: (view) => acceptCompletion(view),
          },
          // F12：跳转定义。
          {
            key: 'F12',
            run: (view) => jumpToDefinition(view, propsRef.current),
          },
          // F2：重命名符号（LSP textDocument/rename）。
          {
            key: 'F2',
            run: (view) => {
              const word = wordAt(view, view.state.selection.main.head)
              const rect = view.coordsAtPos(view.state.selection.main.head)
              setRenameBox({
                x: rect !== null ? rect.left : view.dom.getBoundingClientRect().left + 40,
                y: rect !== null ? rect.bottom + 4 : view.dom.getBoundingClientRect().top + 40,
                initial: word ?? '',
              })
              return true
            },
          },
          // Shift+Alt+F：格式化文档（LSP textDocument/formatting）。
          {
            key: 'Shift-Alt-f',
            run: (view) => { void formatDocument(view, propsRef.current); return true },
          },
        ])),
        // 悬停提示（hover）：鼠标悬停在标识符上显示类型/文档（纯 LSP 请求）。
        ...(lspEnabled ? [hoverTooltip(
          hoverTooltipFor(() => propsRef.current.lsp, () => propsRef.current.tab.path),
          { hoverTime: 350 },
        )] : []),
        // Ctrl/Cmd + 点击 → 跳转定义（VS Code 习惯）。
        ...(lspEnabled ? [EditorView.domEventHandlers({
          mousedown: (event, view) => {
            if (!(event.ctrlKey || event.metaKey)) return false
            const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
            if (pos === null) return false
            event.preventDefault()
            jumpToDefinition(view, propsRef.current, pos)
            return true
          },
          mousemove: (event, view) => {
            const clearLink = (): void => {
              if (definitionHoverRef.current === null) return
              definitionHoverRef.current = null
              view.dispatch({ effects: definitionLinkEffect.of(null) })
            }
            const shouldMark = event.ctrlKey || event.metaKey
            if (!shouldMark) {
              clearLink()
              return false
            }
            const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
            if (pos === null) {
              clearLink()
              return false
            }
            const range = wordRangeAt(view, pos)
            if (range === null) {
              clearLink()
              return false
            }
            const previous = definitionHoverRef.current
            if (previous !== null && previous.from === range.from && previous.to === range.to) return false
            definitionHoverRef.current = range
            view.dispatch({ effects: definitionLinkEffect.of(range) })
            return false
          },
          keyup: (event, view) => {
            if (event.key !== 'Control' && event.key !== 'Meta') return false
            definitionHoverRef.current = null
            view.dispatch({ effects: definitionLinkEffect.of(null) })
            return false
          },
          mouseleave: (_event, view) => {
            definitionHoverRef.current = null
            view.dispatch({ effects: definitionLinkEffect.of(null) })
            return false
          },
        })] : []),
        // LSP 补全：override 数组替换语言包自带的本地补全源（由 tsserver 接管）。
        ...(lspEnabled ? [autocompletion({
          override: [(context: CompletionContext): Promise<CompletionResult | null> | null => {
            const client = propsRef.current.lsp
            if (client === null) return null
            const path = propsRef.current.tab.path
            const position: LspPosition = {
              line: context.state.doc.lineAt(context.pos).number - 1,
              character: context.pos - context.state.doc.lineAt(context.pos).from,
            }
            return client.completion(path, position).then((items) => {
              if (items === null) return null
              const word = matchWordAt(context)
              return {
                from: word !== null ? word.from : context.pos,
                options: items.map((item) => ({
                  label: item.label,
                  type: completionType(item.kind),
                  detail: item.detail,
                  info: completionInfo(item.documentation),
                  apply: item.textEdit?.newText ?? item.insertText ?? item.label,
                  boost: item.sortText !== undefined ? 0 : 1,
                })),
              }
            })
          }],
        })] : []),
        // LSP 诊断：linter source 从 propsRef 拿最新缓存诊断（EditorPane 收到
        // publishDiagnostics 后 setState → 本组件重渲染 → forceLinting 刷新）。
        ...(lspEnabled ? [linter((view) => propsRef.current.diagnostics.map((d) => toCmDiagnostic(view.state.doc, d)))] : []),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const content = update.state.doc.toString()
            propsRef.current.onContentChange(propsRef.current.tab.id, content)
            // 同步全量文本给 LSP（didChange，版本号内部递增）。
            propsRef.current.lsp?.updateDocument(propsRef.current.tab.path, content)
          }
          if (update.selectionSet || update.docChanged) {
            const head = update.state.selection.main.head
            const line = update.state.doc.lineAt(head)
            propsRef.current.onCursor?.(line.number, head - line.from + 1)
          }
        }),
      ],
      parent: hostRef.current!,
    })
    viewRef.current = view
    // 文档生命周期：didOpen（挂载时）+ didClose（卸载时）。切 tab 时组件以
    // key=tab.id 重建，旧实例卸载 → didClose，新实例挂载 → didOpen。
    propsRef.current.lsp?.openDocument(propsRef.current.tab.path, propsRef.current.tab.content)
    return () => {
      viewRef.current = null
      propsRef.current.lsp?.closeDocument(propsRef.current.tab.path)
      view.destroy()
    }
    // 组件以 key=tab.id 重建，effect 仅在挂载时执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // LSP 会话在 EditorPane 渲染后才建立（root effect），挂载时 lsp 可能还是
  // null；这里单独监听：lsp 就绪（或 root 变化重建）时把当前文档登记给服务器。
  // openDocument 幂等：docs 已有记录时仅更新文本缓存，不重复 didOpen。
  useEffect(() => {
    if (lsp === null) return
    lsp.openDocument(tab.path, tab.content)
  }, [lsp, tab.path, tab.content])

  // 收到新诊断 → 强制 lint 重跑（linter source 读最新 props）。
  useEffect(() => {
    const view = viewRef.current
    if (view !== null && lsp !== null) forceLinting(view)
  }, [diagnostics, lsp])

  // 跳转定义后定位：打开目标文件并选中定义符号，避免视线突然落在一行空白处。
  useEffect(() => {
    if (revealLine === null) return
    const view = viewRef.current
    if (view === null) return
    const lineNumber = Math.max(0, revealLine)
    const line = view.state.doc.line(Math.min(lineNumber + 1, view.state.doc.lines))
    const from = Math.min(line.from + Math.max(0, revealCharacter ?? 0), line.to)
    const endCharacter = revealEndCharacter ?? Math.max((revealCharacter ?? 0) + 1, from - line.from + 1)
    const to = Math.min(line.from + Math.max(endCharacter, from - line.from + 1), line.to)
    view.dispatch({
      selection: { anchor: from, head: Math.max(from, to) },
      effects: [
        EditorView.scrollIntoView(from, { y: 'center' }),
        definitionHighlightEffect.of({ from, to: Math.max(from, to) }),
      ],
    })
    view.focus()
    window.setTimeout(() => {
      const current = viewRef.current
      if (current !== null) current.dispatch({ effects: definitionHighlightEffect.of(null) })
    }, 1800)
    onRevealDone()
  }, [revealLine, revealCharacter, revealEndCharacter, onRevealDone])

  // 关闭浮层（右键菜单 / 快速修复子菜单 / 重命名框：外部点击或 Esc）
  useEffect(() => {
    if (menu === null && actions === null && renameBox === null) return
    const onDown = (event: MouseEvent): void => {
      const target = event.target as HTMLElement | null
      if (target !== null && target.closest('[data-ide-editor-menu], [data-ide-rename-box]') !== null) return
      setMenu(null)
      setActions(null)
      setRenameBox(null)
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      setMenu(null)
      setActions(null)
      setRenameBox(null)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [menu, actions, renameBox])

  return (
    <>
      {tab.truncated === true && (
        <div style={{
          flexShrink: 0, padding: '4px 10px', fontSize: 12, color: '#b45309',
          background: 'rgba(245,158,11,0.12)', borderBottom: '1px solid rgba(245,158,11,0.3)',
        }}>
          ⚠ 文件过大已截断显示（只读，禁止保存，防止覆盖尾部内容）
        </div>
      )}
      <div
        ref={hostRef}
        style={{ flex: 1, minHeight: 0, overflow: 'hidden', ['--ide-editor-font-size' as string]: `${fontSize}px` }}
        onContextMenu={(event) => {
          const view = viewRef.current
          if (view === null) return
          event.preventDefault()
          const selection = view.state.selection.main
          const text = view.state.sliceDoc(selection.from, selection.to)
          setMenu({ text, x: event.clientX, y: event.clientY })
        }}
      />
      {menu !== null && createPortal(
        <div
          data-ide-editor-menu=""
          style={{
            position: 'fixed', left: Math.max(4, Math.min(menu.x, window.innerWidth - 220)),
            top: Math.max(4, Math.min(menu.y, window.innerHeight - 120)),
            zIndex: 1000, minWidth: 200, padding: '4px 0',
            // 皮肤把 --dsw-alias-bg-base 全局透明化，浮层用 overlay（近不透明层变量）
            // + label-primary（文字色）自足背景，避免透明菜单透出底下内容看不清。
            background: 'var(--dsw-alias-bg-overlay, rgba(248,250,255,0.96))',
            color: 'var(--dsw-alias-label-primary, #1a1a1a)',
            border: '1px solid var(--ide-border,#e5e6eb)', borderRadius: 6,
            boxShadow: '0 8px 24px rgba(0,0,0,0.28)', fontSize: 13, fontFamily: 'inherit',
          }}
          onContextMenu={(event) => event.preventDefault()}
        >
          <MenuItemButton
            onClick={() => {
              const view = viewRef.current
              const m = menu
              setMenu(null)
              if (view === null || m === null) return
              const cursor = view.state.selection.main.head
              void codeActionsFor(view, propsRef.current, cursor).then((items) => {
                if (items.length > 0) setActions({ items, x: m.x, y: m.y })
              })
            }}
          >
            💡 快速修复
          </MenuItemButton>
          <MenuItemButton
            onClick={() => {
              const view = viewRef.current
              const m = menu
              setMenu(null)
              if (view === null || m === null) return
              const cursor = view.state.selection.main.head
              const word = wordAt(view, cursor)
              setRenameBox({ x: m.x, y: m.y, initial: word ?? '' })
            }}
          >
            ✏️ 重命名符号 (F2)
          </MenuItemButton>
          <MenuItemButton
            onClick={() => {
              const view = viewRef.current
              setMenu(null)
              if (view === null) return
              void formatDocument(view, propsRef.current)
            }}
          >
            🎨 格式化文档 (Shift+Alt+F)
          </MenuItemButton>
          <div style={{ height: 1, margin: '4px 8px', background: 'var(--ide-border,#e5e6eb)' }} />
          {menu.text.trim() !== '' && (
            <MenuItemButton
              onClick={() => { const m = menu; setMenu(null); if (m !== null) onContextAction('ask-agent', m.text) }}
            >
              🤖 发送给 agent 分析/修改
            </MenuItemButton>
          )}
          {menu.text.trim() !== '' && (
            <MenuItemButton
              onClick={() => { const m = menu; setMenu(null); if (m !== null) onContextAction('copy', m.text) }}
            >
              📋 复制选中
            </MenuItemButton>
          )}
        </div>,
        document.body,
      )}
      {/* 快速修复子菜单（codeAction 列表） */}
      {actions !== null && createPortal(
        <div
          data-ide-editor-menu=""
          style={{
            position: 'fixed', left: Math.max(4, Math.min(actions.x, window.innerWidth - 260)),
            top: Math.max(4, Math.min(actions.y, window.innerHeight - 160)),
            zIndex: 1001, minWidth: 240, padding: '4px 0',
            background: 'var(--dsw-alias-bg-overlay, rgba(248,250,255,0.98))',
            color: 'var(--dsw-alias-label-primary, #1a1a1a)',
            border: '1px solid var(--ide-border,#e5e6eb)', borderRadius: 6,
            boxShadow: '0 8px 24px rgba(0,0,0,0.28)', fontSize: 13, fontFamily: 'inherit',
          }}
          onContextMenu={(event) => event.preventDefault()}
        >
          <div style={{ padding: '4px 14px', fontSize: 11, color: '#9ca3af' }}>快速修复</div>
          {actions.items.map((item) => (
            <MenuItemButton
              key={item.title}
              onClick={() => { setActions(null); item.apply() }}
            >
              {item.title}
            </MenuItemButton>
          ))}
        </div>,
        document.body,
      )}
      {/* 重命名输入框 */}
      {renameBox !== null && createPortal(
        <div
          data-ide-rename-box=""
          style={{
            position: 'fixed', left: Math.max(4, Math.min(renameBox.x, window.innerWidth - 260)),
            top: Math.max(4, Math.min(renameBox.y, window.innerHeight - 80)),
            zIndex: 1001, width: 240, padding: '6px 10px',
            background: 'var(--dsw-alias-bg-overlay, rgba(248,250,255,0.98))',
            color: 'var(--dsw-alias-label-primary, #1a1a1a)',
            border: '1px solid var(--ide-accent,#4f8cff)', borderRadius: 6,
            boxShadow: '0 8px 24px rgba(0,0,0,0.28)', fontSize: 13, fontFamily: 'inherit',
          }}
          onContextMenu={(event) => event.preventDefault()}
        >
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>重命名符号</div>
          <input
            autoFocus
            defaultValue={renameBox.initial}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '4px 6px',
              fontSize: 13, fontFamily: 'inherit', outline: 'none',
              background: 'var(--dsw-alias-bg-base,#ffffff)', color: 'inherit',
              border: '1px solid var(--ide-border,#e5e6eb)', borderRadius: 4,
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') { setRenameBox(null); return }
              if (event.key !== 'Enter') return
              const value = (event.currentTarget as HTMLInputElement).value.trim()
              const box = renameBox
              setRenameBox(null)
              const view = viewRef.current
              if (box === null || view === null || value === '') return
              void doRename(view, propsRef.current, value)
            }}
          />
        </div>,
        document.body,
      )}
    </>
  )
}

function tabTitle(path: string): string {
  return path.split('/').pop() ?? path
}

/** 复制到剪贴板（含旧引擎 fallback），供「复制选中」使用。 */
async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const area = document.createElement('textarea')
      area.value = text
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand('copy')
      area.remove()
      return ok
    } catch {
      return false
    }
  }
}

/**
 * 面板拖拽手柄的 pointerdown 处理（终端 / 输出面板共用）：
 * - **拖拽中直接操作 DOM 高度（target.style.height），不触发 React 重渲染**——
 *   这是消除「底部抖动」的关键：之前每帧 setState 让 React 重渲染整个 EditorPane
 *   （CodeMirror/终端/状态栏全树 layout），浏览器布局每帧重排 → 面板边框抖动。
 * - setPointerCapture 锁定指针事件（拖出面板/窗口不丢事件）；向上拖 = 高度变大。
 * - 松手：onCommit(最终 px) 同步回 React 状态（供持久化），onDragEnd 回调一次
 *   （终端用它触发「立即 fit」）。
 */
function beginDragResize(
  event: React.PointerEvent<HTMLElement>,
  min: number,
  max: number,
  onCommit: (px: number) => void,
  onDragEnd?: () => void,
): void {
  event.preventDefault()
  const el = event.currentTarget
  // 手柄的父元素 = 面板容器（终端 / 输出），拖拽时直接改它的高度
  const target = el.parentElement
  if (target === null) return
  let captured = false
  try {
    el.setPointerCapture(event.pointerId)
    captured = true
  } catch {
    // 某些环境（如触摸）捕获可能失败；退化为 window 监听。
  }
  const startY = event.clientY
  const startHeight = target.getBoundingClientRect().height
  const onMove = (moveEvent: PointerEvent): void => {
    const next = Math.max(min, Math.min(startHeight + (startY - moveEvent.clientY), max))
    // 原生 DOM 直改：无 React 重渲染、无整树布局抖动
    target.style.height = `${next}px`
  }
  const onEnd = (): void => {
    el.removeEventListener('pointermove', onMove)
    el.removeEventListener('pointerup', onEnd)
    el.removeEventListener('pointercancel', onEnd)
    window.removeEventListener('pointerup', onEnd)
    window.removeEventListener('pointercancel', onEnd)
    try {
      el.releasePointerCapture(event.pointerId)
    } catch {
      // capture 可能已自动释放
    }
    // 同步最终高度到 React 状态（此时 DOM 已是最终值，状态对齐后无跳变）
    onCommit(target.getBoundingClientRect().height)
    onDragEnd?.()
  }
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onEnd)
  el.addEventListener('pointercancel', onEnd)
  if (!captured) {
    // capture 失败时兜底：指针拖出元素后，window 层仍能收到松手事件
    window.addEventListener('pointerup', onEnd)
    window.addEventListener('pointercancel', onEnd)
  }
}

/** 面板顶部拖拽手柄的通用渲染（内联样式）。 */
function resizeHandleStyle(): React.CSSProperties {
  return {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    height: 8,
    cursor: 'ns-resize',
    zIndex: 10,
    background: 'transparent',
  }
}

export function EditorPane({
  root, tabs, activeTabId, onActivate, onClose, onContentChange, onDirtySave, onCloseEditor, onAskAgent, onOpenFile, onDiagnostics, onReloadTab,
}: EditorPaneProps): JSX.Element {
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null
  const [status, setStatus] = useState('')
  const [termVisible, setTermVisible] = useState(false)
  // 终端面板高度（px），顶部手柄可拖拽调整
  const [termHeight, setTermHeight] = useState(240)
  // 终端「立即 fit」触发器：手柄松手时 +1，TerminalPane 跳过防抖立即 fit+resize
  const [termFitTick, setTermFitTick] = useState(0)
  // LSP：每 root 三个语言服务器客户端（ts = typescript-language-server，
  // py = pyright，ps = PowerShell Editor Services），按当前文件类型选用；
  // 诊断按 uri 缓存（共享一个 map）。
  const [tsLsp, setTsLsp] = useState<LspClient | null>(null)
  const [pyLsp, setPyLsp] = useState<LspClient | null>(null)
  const [psLsp, setPsLsp] = useState<LspClient | null>(null)
  const [javaLsp, setJavaLsp] = useState<LspClient | null>(null)
  const [rustLsp, setRustLsp] = useState<LspClient | null>(null)
  const [diagMap, setDiagMap] = useState<Map<string, LspDiagnostic[]>>(new Map())
  // LSP 状态按服务器分槽（ts/py/ps 各自独立）——避免一个服务器失败时
  // 状态栏把错误盖到其他语言上（如 PSES 失败却显示在打开的 .ts 文件上）。
  const [lspStatus, setLspStatus] = useState<{ ts?: string; py?: string; ps?: string; java?: string; rust?: string }>({})
  // 服务器完整错误日志（window/logMessage type 3），状态栏 hover 可见全文。
  const [lspFullError, setLspFullError] = useState<Record<string, string>>({})
  // 状态栏：光标行列
  const [cursorPos, setCursorPos] = useState<{ line: number; column: number } | null>(null)
  // 编辑器字号（px）：Ctrl/Cmd+滚轮调整，localStorage 记忆（VS Code 习惯）。
  const [editorFontSize, setEditorFontSize] = useState(() => {
    const saved = Number.parseInt(localStorage.getItem('dsh-ide-editor-font-size') ?? '', 10)
    return Number.isFinite(saved) && saved >= 9 && saved <= 24 ? saved : 13
  })
  const changeFontSize = (size: number): void => {
    setEditorFontSize(size)
    localStorage.setItem('dsh-ide-editor-font-size', String(size))
  }
  // Markdown 预览开关：默认编辑（源码），点工具栏「预览」切换为渲染视图。
  const [mdPreview, setMdPreview] = useState(false)
  // 编码选择菜单：null = 关闭，{x, y} = 菜单位于按钮下方
  const [encMenu, setEncMenu] = useState<{ x: number; y: number } | null>(null)

  // 当前文件的 LSP 客户端
  const lspFor = (path: string): LspClient | null => {
    const language = languageIdForPath(path)
    if (language === null) return null
    if (language === 'python') return pyLsp
    if (language === 'powershell') return psLsp
    if (language === 'java') return javaLsp
    if (language === 'rust') return rustLsp
    return tsLsp
  }

  // 每 root 五个 LSP 会话：root 变化时重建（旧实例 dispose）。
  useEffect(() => {
    if (root === '') {
      setTsLsp(null); setPyLsp(null); setPsLsp(null); setJavaLsp(null); setRustLsp(null)
      setDiagMap(new Map())
      return
    }
    const makeClient = (server: 'ts' | 'py' | 'ps' | 'java' | 'rust'): LspClient => new LspClient({
      root,
      rootUri: pathToUri(root, ''),
      server,
      onDiagnostics: (uri, diagnostics) => {
        // 本地缓存（编辑器波浪线）+ 上抛（问题面板聚合）。
        setDiagMap((prev) => {
          const next = new Map(prev)
          next.set(uri, diagnostics)
          return next
        })
        onDiagnostics(uri, diagnostics)
      },
      onOpen: () => setLspStatus((prev) => ({ ...prev, [server]: '已连接' })),
      onFatal: (reason) => setLspStatus((prev) => ({ ...prev, [server]: `LSP 不可用: ${reason}` })),
      onServerLog: (type, message) => {
        // type 3 = Error：服务器失败时的完整 stderr，存起来供状态栏 hover 展示全文。
        if (type === 3) setLspFullError((prev) => ({ ...prev, [server]: message }))
      },
    })
    const ts = makeClient('ts')
    const py = makeClient('py')
    const ps = makeClient('ps')
    const java = makeClient('java')
    const rust = makeClient('rust')
    setTsLsp(ts); setPyLsp(py); setPsLsp(ps); setJavaLsp(java); setRustLsp(rust)
    setDiagMap(new Map())
    setLspStatus({ ts: '未连接', py: '未连接', ps: '未连接', java: '未连接', rust: '未连接' })
    // LSP 懒加载：不在这里 connect()。LspClient.openDocument() 会在第一个文件
    // 真正打开时自动 start() 对应语言的服务器，会话视图窗口不再派生语言服务器。
    return () => {
      ts.dispose(); py.dispose(); ps.dispose(); java.dispose(); rust.dispose()
      setTsLsp(null); setPyLsp(null); setPsLsp(null); setJavaLsp(null); setRustLsp(null)
    }
  }, [root])

  /** 跳转定义：LSP 返回的 uri（file:///...）→ 相对 root 路径 + 行号。
   *  目标文件已打开则直接定位；未打开则走 mount 层的 openFile。 */
  const [revealTarget, setRevealTarget] = useState<{ path: string; line: number; character: number; endCharacter: number } | null>(null)
  const onOpenLocation = (uri: string, line: number, character: number, endCharacter: number): void => {
    if (root === '') return
    const decoded = normalizeUri(uri).replace(/^file:\/\//, '')
    // 归一化后路径可能是 /c:/... 或 c:/...，去掉前导斜杠。
    const candidate = decoded.replace(/^\//, '').replaceAll('/', '\\')
    const normRoot = normalizeUri(pathToUri(root, '')).replace(/^file:\/\//, '').replace(/^\//, '').replaceAll('/', '\\').replace(/\\$/, '')
    const normCandidate = candidate.replace(/^[a-zA-Z]:/, (drive) => drive.toUpperCase())
    const normRootUpper = normRoot.replace(/^[a-zA-Z]:/, (drive) => drive.toUpperCase())
    if (normCandidate.toLowerCase().startsWith(normRootUpper.toLowerCase())) {
      const relative = normCandidate.slice(normRootUpper.length).replace(/^\\/, '')
      if (relative !== '') {
        setRevealTarget({ path: relative, line, character, endCharacter })
        onOpenFile(relative, line)
      }
    }
  }

  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => { if (saveTimer.current !== undefined) clearTimeout(saveTimer.current) }, [])

  /** 保存并返回是否成功（供 Ctrl+S 共用）。 */
  const saveNow = async (tab: EditorTab): Promise<boolean> => {
    // P1-04：截断文件只读，禁止保存（防尾部数据被覆盖丢失）。
    if (tab.truncated === true) {
      setStatus(`⚠ ${tab.path} 过大已被截断，只读不可保存`)
      if (saveTimer.current !== undefined) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => setStatus(''), 4000)
      return false
    }
    const result = await apiWrite(root, tab.path, tab.content, tab.savedMtime, tab.encoding ?? 'utf-8')
    if (result.ok) {
      onDirtySave({ ...tab, savedMtime: result.value.mtime, encoding: tab.encoding })
      setStatus(`已保存 ${tab.path}`)
    } else {
      setStatus(`保存失败: ${result.error.message}`)
    }
    if (saveTimer.current !== undefined) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => setStatus(''), 2500)
    return result.ok
  }

  const save = (tab: EditorTab): void => {
    void saveNow(tab)
  }

  const requestSave = (tab: EditorTab): void => {
    if (saveTimer.current !== undefined) clearTimeout(saveTimer.current)
    save(tab)
  }

  // 切换文件编码：以新编码重新读取文件并整体替换 tab（未保存修改先确认丢弃）。
  const switchEncoding = async (id: string): Promise<void> => {
    const tab = activeTab
    if (tab === null) return
    if (tab.dirty && !window.confirm('切换编码将以新编码重新加载文件，当前未保存的修改将丢失。确定继续？')) {
      return
    }
    const result = await apiRead(root, tab.path, id)
    if (!result.ok) {
      setStatus(`切换编码失败: ${result.error.message}`)
      if (saveTimer.current !== undefined) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => setStatus(''), 3500)
      return
    }
    const reloaded: EditorTab = {
      ...tab,
      content: result.value.content,
      encoding: result.value.encoding,
      savedMtime: result.value.mtime,
      dirty: false,
      truncated: result.value.truncated,
    }
    onReloadTab(reloaded)
    setStatus(`已用 ${encodingLabel(result.value.encoding ?? id)} 重新加载 ${tab.title}`)
    if (saveTimer.current !== undefined) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => setStatus(''), 2500)
  }

  // 编码菜单：外部点击（菜单内除外）或 Esc 关闭。
  useEffect(() => {
    if (encMenu === null) return
    const onDown = (event: MouseEvent): void => {
      const target = event.target as HTMLElement | null
      if (target !== null && target.closest('[data-ide-encoding-menu]') !== null) return
      setEncMenu(null)
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setEncMenu(null)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey) }
  }, [encMenu])

  return (
    <div data-ide-editor-root="" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Tab strip */}
      <div data-ide-tab-strip="" style={{
        display: 'flex', alignItems: 'stretch', borderBottom: '1px solid var(--ide-border, #e5e6eb)',
        background: 'var(--ide-tabbar, rgba(127,127,127,0.06))', flexShrink: 0, overflowX: 'auto',
      }}>
        {tabs.length === 0 && (
          <div style={{ padding: '6px 12px', fontSize: 12, color: '#9ca3af' }}>
            从左侧文件树点击文件打开编辑器
          </div>
        )}
        {tabs.map((tab) => (
          <div
            key={tab.id}
            data-ide-tab=""
            data-active={tab.id === activeTabId ? 'true' : 'false'}
            onClick={() => onActivate(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
              fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
              borderRight: '1px solid var(--ide-border, #e5e6eb)',
              background: tab.id === activeTabId ? 'var(--ide-tab-active, #ffffff)' : 'transparent',
              color: tab.id === activeTabId ? 'inherit' : '#6b7280',
            }}
            title={tab.path}
          >
            <span>{tab.dirty ? '● ' : ''}{tabTitle(tab.path)}</span>
            <span
              onClick={(event) => { event.stopPropagation(); onClose(tab.id) }}
              style={{ color: '#9ca3af', fontSize: 12, padding: '0 2px' }}
            >
              <IconClose size={12} />
            </span>
          </div>
        ))}
        {/* 右侧按钮组：保存 | 终端 | 关闭编辑区 */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, paddingRight: 8, flexShrink: 0 }}>
          {activeTab !== null && isMarkdown(activeTab.path) && (
            <button
              onClick={() => setMdPreview((preview) => !preview)}
              title={mdPreview ? '回到 Markdown 源码编辑' : '渲染 Markdown 预览'}
              style={{
                padding: '4px 10px', fontSize: 12, cursor: 'pointer',
                color: mdPreview ? 'var(--ide-hl-keyword, #0000FF)' : '#9ca3af',
                background: 'transparent', border: '1px solid var(--ide-border,#e5e6eb)',
                borderRadius: 4, whiteSpace: 'nowrap',
              }}
            >
              {mdPreview ? <><IconEdit size={13} /> 编辑</> : <><IconEye size={13} /> 预览</>}
            </button>
          )}
          <button
            onClick={() => { if (activeTab !== null) requestSave(activeTab) }}
            disabled={activeTab === null || !activeTab.dirty}
            title={activeTab === null ? '先打开一个文件' : activeTab.dirty ? `保存 ${activeTab.path}（Ctrl+S）` : '没有未保存的更改'}
            style={{
              padding: '4px 10px', fontSize: 12,
              cursor: activeTab !== null && activeTab.dirty ? 'pointer' : 'default',
              color: activeTab !== null && activeTab.dirty ? '#16a34a' : '#9ca3af',
              background: 'transparent', border: '1px solid var(--ide-border,#e5e6eb)',
              borderRadius: 4, whiteSpace: 'nowrap',
            }}
          >
            <><IconSave size={13} /> 保存</>
          </button>
          <button
            onClick={() => setTermVisible((visible) => !visible)}
            title="终端（显示/隐藏底部终端面板）"
            style={{
              padding: '4px 10px', fontSize: 12, cursor: 'pointer',
              color: termVisible ? 'var(--ide-hl-keyword, #0000FF)' : '#9ca3af',
              background: 'transparent', border: '1px solid var(--ide-border,#e5e6eb)',
              borderRadius: 4, whiteSpace: 'nowrap',
            }}
          >
            {termVisible ? <><IconTerminal size={13} /> 终端</> : <><IconTerminal size={13} /> 终端</>}
          </button>
          <button
            onClick={onCloseEditor}
            title="关闭编辑区"
            style={{
              padding: '4px 10px', fontSize: 12, cursor: 'pointer',
              color: '#9ca3af', background: 'transparent', border: '1px solid var(--ide-border,#e5e6eb)',
              borderRadius: 4, whiteSpace: 'nowrap',
            }}
          >
            <><IconClose size={13} /> 关闭编辑区</>
          </button>
        </div>
      </div>

      {/* Editor body + terminal panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {activeTab === null ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
            选择左侧文件开始编辑
          </div>
        ) : isPreviewable(activeTab.path) && (isMarkdown(activeTab.path) ? mdPreview : true) ? (
          /* 图片 / PDF：渲染预览（二进制）；Markdown：mdPreview 开启时渲染预览。 */
          <PreviewPane root={root} path={activeTab.path} source={activeTab.content} />
        ) : (
          <CodeMirrorPane
            key={activeTab.id}
            tab={activeTab}
            onContentChange={onContentChange}
            onSave={(tab) => requestSave(tab)}
            lsp={lspFor(activeTab.path)}
            diagnostics={diagMap.get(normalizeUri(pathToUri(root, activeTab.path))) ?? []}
            onOpenLocation={onOpenLocation}
            revealLine={revealTarget !== null && revealTarget.path === activeTab.path ? revealTarget.line : null}
            revealCharacter={revealTarget !== null && revealTarget.path === activeTab.path ? revealTarget.character : null}
            revealEndCharacter={revealTarget !== null && revealTarget.path === activeTab.path ? revealTarget.endCharacter : null}
            onRevealDone={() => setRevealTarget(null)}
            root={root}
            onCursor={(line, column) => setCursorPos({ line, column })}
            fontSize={editorFontSize}
            onFontSizeChange={changeFontSize}
            onContextAction={(kind, text) => {
              if (kind === 'copy') {
                void writeClipboard(text)
              } else {
                onAskAgent(text, activeTab.path)
                setStatus('已发送到聊天区，按 Enter 发送')
                if (saveTimer.current !== undefined) clearTimeout(saveTimer.current)
                saveTimer.current = setTimeout(() => setStatus(''), 2500)
              }
            }}
          />
        )}
        {termVisible && (
          <div data-ide-terminal="" style={{
            height: termHeight,
            flexShrink: 0,
            position: 'relative',
            borderTop: '1px solid var(--ide-border,#e5e6eb)',
            background: 'var(--dsw-alias-bg-base,#ffffff)',
          }}>
            {/* 拖拽手柄：上拉=终端变高，下拉=变矮（clamp 120px ~ 视口 70%）；
                拖拽中直改 DOM（无 React 重渲染 → 不抖），松手同步状态并触发立即 fit */}
            <div
              onPointerDown={(event) => beginDragResize(event, 120, window.innerHeight * 0.7, (px) => setTermHeight(px), () => setTermFitTick((t) => t + 1))}
              title="拖拽调整终端高度"
              style={resizeHandleStyle()}
              onMouseEnter={(event) => { (event.currentTarget as HTMLElement).style.background = 'rgba(127,127,127,0.35)' }}
              onMouseLeave={(event) => { (event.currentTarget as HTMLElement).style.background = 'transparent' }}
            />
            <TerminalPane root={root} fitTick={termFitTick} />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', padding: '3px 10px',
        fontSize: 12, color: '#6b7280', borderTop: '1px solid var(--ide-border, #e5e6eb)', flexShrink: 0,
        gap: 12, alignItems: 'center',
      }}>
        <span style={{ display: 'flex', gap: 12, alignItems: 'center', overflow: 'hidden' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{root}</span>
          {activeTab !== null && languageIdForPath(activeTab.path) !== null && (() => {
            // 按当前文件语言显示对应语言服务器的状态（ts/py/ps 分槽，互不污染）。
            const language = languageIdForPath(activeTab.path)
            const server = language === 'python' ? 'py' : language === 'powershell' ? 'ps' : language === 'java' ? 'java' : language === 'rust' ? 'rust' : 'ts'
            const status = lspStatus[server] ?? ''
            return (
              <span title={lspFullError[server] !== undefined ? lspFullError[server] : '语言服务器状态'}>
                {status === '已连接' ? '✓ LSP' : status !== '' ? `… ${status}` : '… LSP'}
              </span>
            )
          })()}
        </span>
        <span style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
          {activeTab !== null && (
            <>
              <span title="光标位置">{cursorPos !== null ? `行 ${cursorPos.line}, 列 ${cursorPos.column}` : ''}</span>
              <span title={`编辑器字号（Ctrl+滚轮调整）: ${editorFontSize}px`}>{editorFontSize}px</span>
              <button
                type="button"
                data-ide-encoding-button=""
                onClick={(e) => { e.stopPropagation(); setEncMenu((prev) => prev ? null : { x: e.clientX, y: e.clientY }) }}
                title="文件编码（切换可解决乱码）"
                style={{ fontSize: 11, color: '#6b7280', background: 'transparent', border: '1px solid var(--ide-border,#e5e6eb)', borderRadius: 3, padding: '1px 6px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {encodingLabel(activeTab.encoding ?? 'utf-8')}
              </button>
              {(() => {
                const list = diagMap.get(normalizeUri(pathToUri(root, activeTab.path))) ?? []
                const errors = list.filter((d) => d.severity === 1).length
                const warnings = list.filter((d) => d.severity === 2).length
                if (errors === 0 && warnings === 0) return <span title="无诊断">✓</span>
                return (
                  <span title={`${errors} 错误, ${warnings} 警告`}>
                    {errors > 0 && <span style={{ color: '#dc2626' }}>{errors} 错误</span>}
                    {warnings > 0 && <span style={{ color: '#d97706' }}>{warnings} 警告</span>}
                  </span>
                )
              })()}
            </>
          )}
          <span>{status !== '' ? status : (activeTab !== null ? (activeTab.dirty ? '未保存' : '已保存') : '')}</span>
        </span>
      </div>
      {encMenu !== null && activeTab !== null && createPortal(
        <div
          data-ide-encoding-menu=""
          style={{ position: 'fixed', left: Math.max(4, Math.min(encMenu.x, window.innerWidth - 220)), top: Math.max(4, Math.min(encMenu.y - 200, window.innerHeight - 40)), zIndex: 1000, minWidth: 200, padding: '4px 0', background: 'var(--dsw-alias-bg-overlay, rgba(248,250,255,0.96))', color: 'var(--dsw-alias-label-primary, #1a1a1a)', border: '1px solid var(--ide-border,#e5e6eb)', borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.28)', fontSize: 13, fontFamily: 'inherit' }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {TEXT_ENCODING_CHOICES.map((choice) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => { setEncMenu(null); switchEncoding(choice.id) }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px 14px', border: 'none', background: (activeTab.encoding ?? 'utf-8') === choice.id ? 'rgba(127,127,127,0.12)' : 'transparent', color: 'inherit', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {choice.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}

/**
 * Open a file into the editor store (async load).
 * P1-06: uses a functional updater so a late-returning read merges into the
 * latest tab list instead of overwriting newer tabs (fast-open A, B → A's
 * stale snapshot must not drop B). P1-04: a truncated file is opened
 * read-only so the tail cannot be clobbered by a save.
 */
export async function openFileInTabs(
  root: string,
  path: string,
  onUpdate: (updater: (prev: { tabs: EditorTab[]; activeTabId: string | null }) => { tabs: EditorTab[]; activeTabId: string | null }) => void,
): Promise<void> {
  // 图片 / PDF：不读文本（二进制），content 占位空串，预览组件经 /dsh-ide/media 加载。
  const ext = (path.split('.').pop() ?? '').toLowerCase()
  const binaryPreview = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'avif', 'svg', 'pdf'].includes(ext)
  if (binaryPreview) {
    const tab: EditorTab = {
      id: `file:${path}`,
      path,
      title: tabTitle(path),
      content: '',
      dirty: false,
      truncated: false,
    }
    onUpdate((prev) => {
      const existing = prev.tabs.find((item) => item.path === path)
      if (existing !== undefined) return { tabs: prev.tabs, activeTabId: existing.id }
      return { tabs: [...prev.tabs, tab], activeTabId: tab.id }
    })
    return
  }
  const result = await apiRead(root, path)
  if (!result.ok) return
  const truncated = result.value.truncated === true
  const tab: EditorTab = {
    id: `file:${path}`,
    path,
    title: tabTitle(path),
    content: result.value.content,
    dirty: false,
    savedMtime: result.value.mtime,
    truncated,
    encoding: result.value.encoding,
  }
  onUpdate((prev) => {
    const existing = prev.tabs.find((item) => item.path === path)
    if (existing !== undefined) return { tabs: prev.tabs, activeTabId: existing.id }
    return { tabs: [...prev.tabs, tab], activeTabId: tab.id }
  })
}
