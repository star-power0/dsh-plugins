/** DOM mounting: FileTree into the sidebar host, EditorPane into the workbench.
 *  v11: the file tree renders inside the shell sidebar (below the workspace
 *  region) so sidebar and tree form one left column; the workbench portal
 *  hosts only the editor. */

import { useEffect, useState, createElement, type JSX, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import type { IdeState, ListenerStore, EditorTab } from './store.ts'
import { FileTree } from './components/FileTree.tsx'
import { EditorPane } from './components/EditorPane.tsx'
import { GitPanel } from './components/GitPanel.tsx'
import { ProblemsPanel } from './components/ProblemsPanel.tsx'
import { IconAlert, IconArrowLeft, IconExplorer, IconFolder, IconGit } from './icons.tsx'

const WORKBENCH_SELECTOR = '[data-ide-workbench]'
const SIDEBAR_TREE_SELECTOR = '[data-ide-sidebar-tree]'

function readTreePanelOpen(): boolean {
  try {
    return localStorage.getItem('dsh-ide-tree-panel-open') === '1'
  } catch {
    return false
  }
}

function saveTreePanelOpen(open: boolean): void {
  try {
    localStorage.setItem('dsh-ide-tree-panel-open', open ? '1' : '0')
  } catch {
    // Ignore unavailable localStorage.
  }
}

function useNativeLauncherHost(): HTMLElement | null {
  const [host, setHost] = useState<HTMLElement | null>(null)
  useEffect(() => {
    let current: HTMLElement | null = null
    const update = (): void => {
      const workspace = document.querySelector<HTMLElement>('[data-slot="sidebar.workspaces"]')
      const root = workspace?.firstElementChild as HTMLElement | null
      const rail = root !== null && Array.from(root.classList).some((name) => name.includes('rail'))
      let candidate: HTMLElement | null = null
      if (rail && root !== null) {
        candidate = root.querySelector<HTMLElement>(':scope > [data-ide-tree-launcher-host]')
        if (candidate === null) {
          candidate = document.createElement('div')
          candidate.dataset.ideTreeLauncherHost = ''
          candidate.style.display = 'contents'
          root.insertBefore(candidate, root.querySelector(':scope > [class*="search"]'))
        }
      } else {
        const actions = workspace?.querySelector<HTMLElement>('[class*="headerActions"]') ?? null
        if (actions !== null) {
          candidate = actions.parentElement?.querySelector<HTMLElement>(':scope > [data-ide-tree-launcher-host]') ?? null
          if (candidate === null) {
            candidate = document.createElement('div')
            candidate.dataset.ideTreeLauncherHost = ''
            candidate.style.display = 'contents'
            actions.before(candidate)
          }
        }
      }
      if (candidate !== current) {
        current = candidate
        setHost(candidate)
      }
    }
    const observer = new MutationObserver(update)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
    update()
    return () => observer.disconnect()
  }, [])
  return host
}

/**
 * Wait for one selector (the shell/frame mounts after boot settlement), then
 * keep watching: if the matched host element is later removed (DSH shell
 * rebuilds its DOM), wait again and re-invoke onFound so the panels remount
 * (P2-02: survives host DOM replacement instead of mounting once and dying).
 */
function waitForElement(selector: string, onFound: (el: HTMLElement) => void): () => void {
  let disposed = false
  let observer: MutationObserver | undefined
  let currentEl: HTMLElement | null = null
  const tryFind = (): void => {
    if (disposed || currentEl !== null) return
    const el = document.querySelector<HTMLElement>(selector)
    if (el !== null) {
      currentEl = el
      onFound(el)
    }
  }
  observer = new MutationObserver(() => {
    // 宿主重建：已挂载元素被移除 → 重置等待并重新挂载。
    if (currentEl !== null && !currentEl.isConnected) {
      currentEl = null
      tryFind()
      return
    }
    tryFind()
  })
  observer.observe(document.body, { childList: true, subtree: true })
  tryFind()
  return () => {
    disposed = true
    currentEl = null
    observer?.disconnect()
  }
}

export interface IdeMountApi {
  ide: ListenerStore<IdeState>
  openFile: (path: string, line?: number) => void
  /** 把选中代码追加到聊天输入框（发送给内置 agent）。 */
  askAgent: (text: string, path: string) => void
  /** 编码切换后整体替换 tab。 */
  onReloadTab: (tab: EditorTab) => void
}

/** The sidebar file tree: follows the ide root (workspace/session).
 *  v13: 顶部「文件 | Git」视图切换；Git 面板复用同一块区域。
 *  v15: 加「问题」视图（LSP 诊断聚合）。
 *  v18: 资源管理器改为覆盖原生侧栏的独立面板，关闭时只保留文件夹入口。 */
function SidebarTree({ api }: { api: IdeMountApi }): ReactNode {
  const [, force] = useState(0)
  useEffect(() => api.ide.subscribe(() => force((n) => n + 1)), [api.ide])
  const [panelOpen, setPanelOpen] = useState(readTreePanelOpen)
  const state = api.ide.getSnapshot()
  const launcherHost = useNativeLauncherHost()
  const [view, setView] = useState<'files' | 'git' | 'problems'>('files')

  const setPanelVisibility = (open: boolean): void => {
    setPanelOpen(open)
    saveTreePanelOpen(open)
    document.dispatchEvent(new CustomEvent('dsh-ide-tree-panel-toggle', { detail: open }))
  }

  if (!panelOpen) {
    return launcherHost === null ? null : createPortal(
      <button
        type="button"
        data-ide-tree-launcher=""
        onClick={() => setPanelVisibility(true)}
        title="打开资源管理器"
        aria-label="打开资源管理器"
      >
        <IconExplorer size={18} />
      </button>,
      launcherHost,
    )
  }

  // 诊断计数角标：聚合所有打开文件的 LSP 诊断（错误+警告）。
  const problemCount = Object.values(state.diagnostics).reduce((total, list) => total + list.length, 0)
  const toggle = (key: 'git' | 'problems'): void => setView((prev) => (prev === key ? 'files' : key))
  /** 带文字的紧凑切换按钮：比纯图标明显，又不回到三个等宽 tab。 */
  const viewButton = (active: boolean): CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 3, height: 22, padding: '0 7px',
    border: `1px solid ${active ? 'var(--ide-accent,#4f8cff)' : 'var(--ide-border,#e5e6eb)'}`,
    background: active ? 'var(--ide-hover, rgba(127,127,127,0.12))' : 'transparent',
    color: active ? 'inherit' : 'var(--ide-muted,#6b7280)',
    borderRadius: 4, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
    whiteSpace: 'nowrap', position: 'relative',
  })
  return (
    <div data-ide-sidebar-root="" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div data-ide-sidebar-title="" style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', flexShrink: 0,
        borderBottom: '1px solid var(--ide-border,#e5e6eb)',
        background: 'var(--ide-tabbar, rgba(127,127,127,0.06))',
      }}>
        <IconFolder size={16} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          资源管理器
        </span>
        <button
          type="button"
          data-ide-return-chat=""
          onClick={() => setPanelVisibility(false)}
          title="返回对话"
          aria-label="返回对话"
          style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: 'inherit', borderRadius: '50%', cursor: 'pointer' }}
        >
          <IconArrowLeft size={15} />
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '7px 10px', flexShrink: 0, borderBottom: '1px solid var(--ide-border,#e5e6eb)' }}>
        <button type="button" onClick={() => setView('files')} title="文件" style={viewButton(view === 'files')}>
          <IconFolder size={14} /> 文件
        </button>
        <button type="button" onClick={() => toggle('problems')} title="问题面板" style={viewButton(view === 'problems')}>
          <IconAlert size={14} /> 问题
          {problemCount > 0 && <span style={{ minWidth: 14, height: 14, padding: '0 3px', background: '#dc2626', color: '#fff', fontSize: 9, lineHeight: '14px', textAlign: 'center', borderRadius: 8, boxSizing: 'border-box' }}>{problemCount > 99 ? '99+' : problemCount}</span>}
        </button>
        <button type="button" onClick={() => toggle('git')} title="Git 面板" style={viewButton(view === 'git')}>
          <IconGit size={14} /> Git
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {view === 'files' && <FileTree root={state.root} treeTick={state.treeTick} onOpenFile={api.openFile} />}
        {view === 'git' && <GitPanel root={state.root} />}
        {view === 'problems' && <ProblemsPanel root={state.root} diagnostics={state.diagnostics} onOpenFile={api.openFile} />}
      </div>
    </div>
  )
}

/** The editor pane (workbench). */
function Workbench({ api }: { api: IdeMountApi }): JSX.Element {
  const [, force] = useState(0)
  useEffect(() => api.ide.subscribe(() => force((n) => n + 1)), [api.ide])
  const state = api.ide.getSnapshot()
  return (
    <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%' }}>
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', height: '100%' }}>
        <EditorPane
          root={state.root}
          tabs={state.tabs}
          activeTabId={state.activeTabId}
          onActivate={(id) => api.ide.update((prev) => ({ ...prev, activeTabId: id }))}
          onClose={(id) => api.ide.update((prev) => {
            const closing = prev.tabs.find((tab) => tab.id === id)
            // P1-05：dirty tab 关闭前确认，防止未保存内容静默丢弃。
            if (closing?.dirty === true && !window.confirm(`「${closing.title}」有未保存的修改，确定放弃并关闭？`)) {
              return prev
            }
            const index = prev.tabs.findIndex((tab) => tab.id === id)
            const nextTabs = prev.tabs.filter((tab) => tab.id !== id)
            // P2-01：先算 nextTabs，再按被关闭 tab 的旧索引选右侧仍存在的 tab，
            // 否则选左侧；避免指向已移除的 tab（旧逻辑取倒数第二项会再拿到 B）。
            let nextActive = prev.activeTabId
            if (prev.activeTabId === id) {
              nextActive = nextTabs[index]?.id ?? nextTabs[index - 1]?.id ?? null
            }
            // P2-05：文件关闭时清理其诊断（按文件路径匹配 file:// URI 后缀）。
            let diagnostics = prev.diagnostics
            if (closing !== undefined) {
              const needle = closing.path.replaceAll('\\', '/')
              const stale = Object.keys(diagnostics).filter((uri) => {
                const decoded = decodeURIComponent(uri).replace(/^file:\/\//, '').replace(/^\//, '').replaceAll('\\', '/')
                return decoded === needle || decoded.endsWith(`/${needle}`)
              })
              if (stale.length > 0) {
                diagnostics = { ...diagnostics }
                for (const key of stale) delete diagnostics[key]
              }
            }
            return { ...prev, tabs: nextTabs, activeTabId: nextActive, diagnostics }
          })}
          onContentChange={(id, content) => api.ide.update((prev) => ({
            ...prev,
            tabs: prev.tabs.map((tab) => tab.id === id ? { ...tab, content, dirty: true } : tab),
          }))}
          onDirtySave={(tab) => api.ide.update((prev) => ({
            ...prev,
            tabs: prev.tabs.map((item) => item.id === tab.id ? { ...tab, dirty: false } : item),
          }))}
          onCloseEditor={() => api.ide.update((prev) => {
            // P1-05：整个编辑区含 dirty tab 时先确认。
            const dirty = prev.tabs.filter((tab) => tab.dirty)
            if (dirty.length > 0 && !window.confirm(`${dirty.length} 个文件有未保存的修改，确定放弃并关闭编辑区？`)) {
              return prev
            }
            return {
              ...prev,
              editorVisible: false,
              tabs: [],
              activeTabId: null,
            }
          })}
          onAskAgent={api.askAgent}
          onOpenFile={(path, line) => api.openFile(path, line)}
          onDiagnostics={(uri, diagnostics) => api.ide.update((prev) => ({
            ...prev,
            diagnostics: { ...prev.diagnostics, [uri]: diagnostics },
          }))}
          onReloadTab={(tab) => api.ide.update((prev) => ({
            ...prev,
            tabs: prev.tabs.map((t) => t.id === tab.id ? tab : t),
          }))}
        />
      </div>
    </div>
  )
}

/**
 * Mount both roots.
 * @returns a disposer unmounting both trees.
 */
export function mountPanels(api: IdeMountApi): () => void {
  let sidebarRoot: Root | undefined
  let workbenchRoot: Root | undefined
  const disposers: Array<() => void> = []

  disposers.push(waitForElement(SIDEBAR_TREE_SELECTOR, (el) => {
    // P2-02：宿主重建（旧元素被移除、新元素出现）时先卸载旧 root 再挂载。
    sidebarRoot?.unmount()
    sidebarRoot = createRoot(el)
    sidebarRoot.render(createElement(SidebarTree, { api }))
  }))

  disposers.push(waitForElement(WORKBENCH_SELECTOR, (el) => {
    workbenchRoot?.unmount()
    workbenchRoot = createRoot(el)
    workbenchRoot.render(createElement(Workbench, { api }))
  }))

  return () => {
    for (const dispose of disposers) dispose()
    sidebarRoot?.unmount()
    workbenchRoot?.unmount()
  }
}
