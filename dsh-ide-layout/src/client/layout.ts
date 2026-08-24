/**
 * DOM layout controller: fixed editor workbench + optional resource explorer overlay
 * + chat squeeze, chat manually resizable.
 *
 * The explorer stays outside the native sidebar flex flow. When closed, the
 * native workspace/session list remains fully interactive; when opened, the
 * explorer overlays it without compressing its internal regions. */

import type { IdeState, LayoutState, ListenerStore } from './store.ts'

/** The editor portal host (mount.tsx renders the EditorPane into it). */
let workbenchHost: HTMLDivElement | null = null
/** The sidebar file-tree host (mount.tsx renders the FileTree into it). */
let sidebarTreeHost: HTMLDivElement | null = null

export function getWorkbenchHost(): HTMLDivElement | null {
  return workbenchHost
}

export function getSidebarTreeHost(): HTMLDivElement | null {
  return sidebarTreeHost
}

/** 精确找真正的 sidebar 容器：`[class*="sidebarCol"]` 是 contains 匹配，可能误命中
 *  类名含 "sidebarCol" 的无关元素（踩过坑）。真正的 sidebar 一定包含 footArea
 *  （左下角设置区）和 regionArea（工作区/会话列表）。 */
function findSidebar(): HTMLElement | null {
  const candidates = document.querySelectorAll<HTMLElement>('[class*="sidebarCol"]')
  for (const el of candidates) {
    if (el.querySelector('[class*="footArea"]') !== null || el.querySelector('[class*="regionArea"]') !== null) {
      return el
    }
  }
  // 兜底：第一个候选
  return candidates[0] ?? null
}

/** Locate the frame grid element (sidebar's parent in the AppFrame grid). */
function findFrame(): HTMLElement | null {
  const sidebar = findSidebar()
  if (sidebar !== null && sidebar.parentElement !== null) return sidebar.parentElement
  return null
}

/** 在给定容器内精确找 sidebar（含 footArea/regionArea 的候选）。 */
function findSidebarIn(container: HTMLElement): HTMLElement | null {
  const candidates = container.querySelectorAll<HTMLElement>('[class*="sidebarCol"]')
  for (const el of candidates) {
    if (el.querySelector('[class*="footArea"]') !== null || el.querySelector('[class*="regionArea"]') !== null) {
      return el
    }
  }
  return candidates[0] ?? null
}

const MIN_CHAT_PX = 440
const EDITOR_MIN = 300

/** The layout controller: embed tree, place workbench, squeeze chat. */
export class IdeLayoutController {
  private frame: HTMLElement | null = null
  private chatHandle: HTMLDivElement | null = null
  private sidebarObserver: ResizeObserver | null = null
  private frameObserver: ResizeObserver | null = null
  private detailsObserver: ResizeObserver | null = null
  private footObserver: ResizeObserver | null = null
  private waitObserver: MutationObserver | null = null
  private sidebarInjected = false
  private maskedSidebar: HTMLElement | null = null
  private sidebarRight = 280
  private frameWidth = 0
  private detailsWidth = 0
  private disposers: Array<() => void> = []

  constructor(
    private readonly layout: ListenerStore<LayoutState>,
    private readonly ide: ListenerStore<IdeState>,
  ) {}

  mount(): void {
    const tryAttach = (): void => {
      if (this.frame === null) {
        const frame = findFrame()
        if (frame === null) return
        this.frame = frame
        this.frameWidth = frame.getBoundingClientRect().width
        this.frameObserver = new ResizeObserver(() => {
          if (this.frame !== null) this.frameWidth = this.frame.getBoundingClientRect().width
          this.apply()
        })
        this.frameObserver.observe(frame)
        this.embedWorkbench()
        this.bindDetails()
      }
      // Retry the sidebar tree embed until the sidebar column renders.
      if (!this.sidebarInjected) {
        const sidebar = this.frame !== null ? findSidebarIn(this.frame) : findSidebar()
        if (sidebar !== null) this.embedSidebarTree(sidebar)
      }
      this.apply()
    }
    this.waitObserver = new MutationObserver(() => { tryAttach() })
    this.waitObserver.observe(document.body, { childList: true, subtree: true })
    tryAttach()
  }

  /** Create the fixed editor workbench portal host + chat handle. */
  private embedWorkbench(): void {
    if (workbenchHost !== null) return
    const host = document.createElement('div')
    host.dataset.ideWorkbench = ''
    host.style.cssText = 'position:fixed;top:0;bottom:0;z-index:20;display:flex;flex-direction:row;overflow:hidden;'
      + 'background:transparent;'
    document.body.appendChild(host)
    workbenchHost = host

    // Track sidebar width (native drag) to place the workbench portal.
    this.sidebarObserver = new ResizeObserver(() => {
      const sidebar = this.frame !== null ? findSidebarIn(this.frame) : findSidebar()
      if (sidebar !== null) this.sidebarRight = sidebar.getBoundingClientRect().right
      this.apply()
    })
    const sidebar = this.frame !== null ? findSidebarIn(this.frame) : findSidebar()
    if (sidebar !== null) {
      this.sidebarRight = sidebar.getBoundingClientRect().right
      this.sidebarObserver.observe(sidebar)
    }

    this.chatHandle = this.createChatHandle()
    this.disposers.push(this.layout.subscribe(() => this.apply()))
    // 编辑区显隐（editorVisible）变化时同步布局
    this.disposers.push(this.ide.subscribe(() => this.apply()))
  }

  /** Track the details column (affects the width budget). */
  private bindDetails(): void {
    this.detailsObserver = new ResizeObserver(() => {
      const details = this.frame?.querySelector<HTMLElement>('[class*="detailsCol"]') ?? null
      this.detailsWidth = details === null ? 0 : details.getBoundingClientRect().width
      this.apply()
    })
    const details = this.frame?.querySelector<HTMLElement>('[class*="detailsCol"]') ?? null
    this.detailsWidth = details === null ? 0 : details.getBoundingClientRect().width
    if (details !== null) this.detailsObserver.observe(details)
  }

  /** Overlay state is controlled by the launcher in mount.tsx. */
  private treePanelOpen = false

  private embedSidebarTree(_sidebar: HTMLElement): void {
    this.sidebarInjected = true
    const host = document.createElement('div')
    host.dataset.ideSidebarTree = ''
    host.style.cssText = 'position:fixed;top:0;bottom:0;left:0;z-index:30;overflow:hidden;'
      + 'display:flex;flex-direction:column;pointer-events:none;background:transparent;'
    document.body.appendChild(host)
    sidebarTreeHost = host

    try {
      this.treePanelOpen = localStorage.getItem('dsh-ide-tree-panel-open') === '1'
    } catch {
      this.treePanelOpen = false
    }
    const onPanelToggle = (event: Event): void => {
      this.treePanelOpen = (event as CustomEvent<boolean>).detail === true
      this.apply()
    }
    document.addEventListener('dsh-ide-tree-panel-toggle', onPanelToggle)
    this.disposers.push(() => document.removeEventListener('dsh-ide-tree-panel-toggle', onPanelToggle))
  }

  private createChatHandle(): HTMLDivElement {
    const el = document.createElement('div')
    el.className = 'ide-chat-handle'
    // 挂在 body 上（fixed），不放在 workbench 内——workbench 有 overflow:hidden，手柄压在右边界会被裁剪一半，只剩 4px 命中区导致拖不动。
    el.style.cssText = 'position:fixed;top:0;bottom:0;z-index:40;cursor:col-resize;width:8px;margin-left:-4px;background:transparent;'
    el.addEventListener('mouseenter', () => { el.style.background = 'rgba(127,127,127,0.35)' })
    el.addEventListener('mouseleave', () => { el.style.background = 'transparent' })
    el.addEventListener('pointerdown', (event: PointerEvent) => {
      event.preventDefault()
      const startX = event.clientX
      const startWidth = this.layout.getSnapshot().chatWidth
      const onMove = (moveEvent: PointerEvent): void => {
        const width = Math.max(MIN_CHAT_PX, startWidth + (startX - moveEvent.clientX))
        this.layout.update((prev) => ({ ...prev, chatWidth: width }))
      }
      const onUp = (): void => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    })
    document.body.appendChild(el)
    return el
  }

  private syncSidebarMask(): void {
    const sidebar = this.frame !== null ? findSidebarIn(this.frame) : findSidebar()
    if (this.maskedSidebar !== null && this.maskedSidebar !== sidebar) {
      this.maskedSidebar.removeAttribute('data-ide-tree-overlay-open')
      this.maskedSidebar = null
    }
    if (sidebar !== null) {
      sidebar.toggleAttribute('data-ide-tree-overlay-open', this.treePanelOpen)
      this.maskedSidebar = this.treePanelOpen ? sidebar : null
    }
  }

  /** Squeeze the chat column and place the workbench portal + chat handle.
   *  编辑区按需显隐：editorVisible 为 false 时回到原生两栏
   *  （工作区 sidebar | agent chat），不挤压聊天列、不显示编辑区。 */
  private apply(): void {
    this.syncSidebarMask()
    const state = this.layout.getSnapshot()
    const editorVisible = this.ide.getSnapshot().editorVisible
    const panelSidebarWidth = this.treePanelOpen ? Math.max(300, this.sidebarRight) : this.sidebarRight
    const panelExtraWidth = panelSidebarWidth - this.sidebarRight
    const frameW = this.frameWidth > 0 ? this.frameWidth : window.innerWidth
    const total = Math.max(0, frameW - panelSidebarWidth - this.detailsWidth)

    // Workbench = total - chat; chat clamps so the workbench keeps its floor.
    const maxChat = Math.max(MIN_CHAT_PX, total - EDITOR_MIN)
    const chat = Math.min(Math.max(MIN_CHAT_PX, state.chatWidth), maxChat)
    const work = editorVisible ? Math.max(EDITOR_MIN, total - chat) : 0

    const centerCol = this.frame?.querySelector<HTMLElement>('[class*="centerCol"]') ?? null
    if (centerCol !== null) {
      centerCol.style.marginLeft = editorVisible ? `${work + panelExtraWidth}px` : `${panelExtraWidth}px`
      centerCol.style.minWidth = editorVisible ? '0' : ''
    }
    if (workbenchHost !== null) {
      workbenchHost.style.left = `${panelSidebarWidth}px`
      workbenchHost.style.width = `${work}px`
      workbenchHost.style.pointerEvents = editorVisible && work > 0 ? 'auto' : 'none'
      workbenchHost.style.display = editorVisible ? 'flex' : 'none'
    }
    if (sidebarTreeHost !== null) {
      sidebarTreeHost.style.pointerEvents = this.treePanelOpen ? 'auto' : 'none'
      sidebarTreeHost.style.width = this.treePanelOpen
        ? `${panelSidebarWidth}px`
        : `${Math.max(64, this.sidebarRight)}px`
      sidebarTreeHost.dataset.panelOpen = this.treePanelOpen ? 'true' : 'false'
    }
    if (this.chatHandle !== null) {
      // 手柄挂在 body（fixed），用视口绝对坐标：sidebar 右缘 + 编辑器宽度
      this.chatHandle.style.left = `${panelSidebarWidth + work}px`
      this.chatHandle.style.display = editorVisible ? 'block' : 'none'
    }
  }

  /** Detach everything (plugin unload). */
  dispose(): void {
    this.waitObserver?.disconnect()
    this.sidebarObserver?.disconnect()
    this.frameObserver?.disconnect()
    this.detailsObserver?.disconnect()
    this.footObserver?.disconnect()
    for (const dispose of this.disposers) dispose()
    this.chatHandle?.remove()
    const centerCol = this.frame?.querySelector<HTMLElement>('[class*="centerCol"]') ?? null
    centerCol?.style.removeProperty('margin-left')
    if (workbenchHost !== null) {
      workbenchHost.remove()
      workbenchHost = null
    }
    if (sidebarTreeHost !== null) {
      sidebarTreeHost.remove()
      sidebarTreeHost = null
    }
    this.maskedSidebar?.removeAttribute('data-ide-tree-overlay-open')
    this.maskedSidebar = null
    this.frame = null
    this.sidebarInjected = false
  }
}
