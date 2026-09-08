/**
 * Card auto-sync: sessions of already-imported workspaces board themselves —
 * no manual "sync group" needed. Two entry points share one placement path:
 *
 *   - live: session 'turn/end' (a completed turn means the log has content;
 *     an explicit user-message check below keeps empty shells off anyway)
 *   - startup backfill: every placeable session of every framed workspace
 *     that has no card yet (history from before this feature, plus anything
 *     missed while the host was down)
 *
 * A session boards only when ALL hold:
 *   - its workspace has a stored frame (global.wsFrames) — the user opted in
 *     by importing it; never-imported workspaces stay off the board
 *   - no card for it exists yet
 *   - header origin ≠ 'subagent' (worker sessions stay off the board)
 *   - not archived (hidden from every grouping surface)
 *   - the log has at least one non-tool user message (non-blank)
 *
 * Placement mirrors the client import (MapCanvas importWorkspace/syncGroup):
 * a remembered spot from layoutMemory wins, otherwise a grid slot continuing
 * the group's arrangement below its members; an empty stored frame parks the
 * card inside itself. The store write rides the domain/changed SSE feed to
 * any open map; the frame refits client-side around its members.
 */
import type { SessionQueryService } from './dsh-host.ts'
import { INBOX_BOARD_ID, type Card, type MapGlobal, type TalkMapStore } from './store.ts'

/** Grid/card metrics — MUST match MapCanvas.tsx (client owns rendering). */
const GRID = 16
const CARD_W = 224
const CARD_H = 120
const GAP_X = 48
const GAP_Y = 56
const COLS = 3
const FRAME_PAD = 32
const FRAME_LABEL_H = 30

function snap(value: number): number {
  return Math.round(value / GRID) * GRID
}

function gridPosition(origin: { x: number; y: number }, index: number): { x: number; y: number } {
  const column = index % COLS
  const row = Math.floor(index / COLS)
  return {
    x: snap(origin.x + column * (CARD_W + GAP_X)),
    y: snap(origin.y + row * (CARD_H + GAP_Y)),
  }
}

/** Structural subset of ctx.workspaceRegistry (dsh-workspace @ rc.6). */
export interface WorkspaceLite {
  readonly id: string
  readonly path: string
  readonly title: string
  readonly sessionIds: readonly string[]
}

export interface WorkspaceRegistryLite {
  list(): WorkspaceLite[]
  resolveByPath(path: string): Promise<WorkspaceLite | undefined>
  readonly archivedSessionIds: readonly string[]
}

export interface AutoSyncHostServices {
  sessionQuery: SessionQueryService
  workspaceRegistry: WorkspaceRegistryLite
  logger?: { info?(message: string): void; warn(message: string): void }
  effect(callback: () => (() => void | Promise<void>), label?: string): void
  on(event: string, listener: (...args: unknown[]) => void): () => void
}

export class CardAutoSync {
  /** Sessions with a placement attempt in flight — a turn/end burst must not
   * double-board the same session through two concurrent pass-the-check runs. */
  private readonly placing = new Set<string>()

  constructor(
    private readonly services: AutoSyncHostServices,
    private readonly storeReady: Promise<TalkMapStore>,
  ) {}

  /** Wire the turn/end trigger and run the one-time startup backfill. */
  start(): () => void {
    const off = this.services.on('session/event', (...args: unknown[]) => {
      const session = args[0] as { id?: string }
      const event = args[1] as { type?: string }
      if (event?.type !== 'turn/end' || typeof session?.id !== 'string') return
      void this.place(session.id)
    })
    void this.backfill()
    return off
  }

  /** Try to board one session; every failure is logged, never thrown.
   * `batch` carries a pre-computed grid slot for startup backfill; the live
   * path omits it and takes grid slot 0 below the group's current members. */
  async place(sessionId: string, batch?: { origin: { x: number; y: number }; index: number }): Promise<void> {
    if (this.placing.has(sessionId)) return
    this.placing.add(sessionId)
    try {
      await this.placeInner(sessionId, batch)
    } catch (error) {
      this.services.logger?.warn(`[dsh-talk-map] auto-board ${sessionId} failed: ${String(error)}`)
    } finally {
      this.placing.delete(sessionId)
    }
  }

  private hasCardSession(store: TalkMapStore, sessionId: string): boolean {
    for (const [, card] of store.cards.entries()) {
      if (card.sessionId === sessionId) return true
    }
    return false
  }

  private async placeInner(sessionId: string, batch?: { origin: { x: number; y: number }; index: number }): Promise<void> {
    const store = await this.storeReady
    if (this.hasCardSession(store, sessionId)) return
    // Blank guard (also covers the live path — an empty log never boards).
    const surface = await this.services.sessionQuery.readSurface(sessionId)
    const hasUserMessage = surface.events.some((event) => {
      if (event.type !== 'user/message') return false
      const kind = (event.data as { source?: { kind?: string } } | undefined)?.source?.kind
      return kind !== 'tool'
    })
    if (!hasUserMessage) return

    const record = (await this.services.sessionQuery.listSessions())
      .find(entry => entry.header.id === sessionId)
    if (record === undefined) return
    // rc.6 headers persist `origin` (subagent sessions carry it on disk); the
    // structural SessionRecordLite type predates the field, hence the cast.
    if ((record.header as { origin?: unknown }).origin === 'subagent') return

    const registry = this.services.workspaceRegistry
    if (registry.archivedSessionIds.includes(sessionId)) return
    const workspace = registry.list().find(entry => entry.sessionIds.includes(sessionId))
      ?? await registry.resolveByPath(record.header.cwd ?? '')
    if (workspace === undefined) return

    const global = store.global()
    const frame = global.wsFrames?.[workspace.id]
    if (frame === undefined) return // workspace not imported — the user opted out

    const card = this.positionCard(store, global, workspace, sessionId, batch)
    await store.cards.put(`card-${crypto.randomUUID()}`, card)
    this.services.logger?.info?.(`[dsh-talk-map] auto-boarded ${sessionId} into "${workspace.title}"`)
  }

  /** Remembered spot first, else one grid slot on the batch origin (backfill)
   * or slot 0 below the group's current members (live turn/end), else — for
   * an empty group — parked inside the stored frame.
   *
   * The slot index counts FRESH cards only (mirrors MapCanvas syncGroup's
   * gridIndex): feeding it the member count double-counts the row offset —
   * origin already sits below every member — and walks each card hundreds of
   * pixels further down (the 60k-px staircase this fixed). */
  private positionCard(
    store: TalkMapStore,
    global: MapGlobal,
    workspace: WorkspaceLite,
    sessionId: string,
    batch?: { origin: { x: number; y: number }; index: number },
  ): Card {
    const base = {
      boardId: INBOX_BOARD_ID,
      sessionId,
      createdAt: Date.now(),
    }
    const memory = global.layoutMemory?.[sessionId]
    if (memory !== undefined) {
      return {
        ...base,
        x: snap(memory.x),
        y: snap(memory.y),
        ...(memory.colorTag !== undefined ? { colorTag: memory.colorTag } : {}),
      }
    }
    let origin = batch?.origin
    if (origin === undefined) {
      const memberIds = new Set(workspace.sessionIds)
      const members = [...store.cards.entries()]
        .map(([, card]) => card)
        .filter(card => memberIds.has(card.sessionId))
      origin = members.length > 0
        ? {
            x: Math.min(...members.map(card => card.x)),
            y: Math.max(...members.map(card => card.y + CARD_H)) + GAP_Y,
          }
        : (() => {
            // Frame rect is guaranteed by the caller's import check.
            const rect = global.wsFrames?.[workspace.id] ?? { x: 0, y: 0, width: 400, height: 260 }
            return { x: rect.x + FRAME_PAD, y: rect.y + FRAME_LABEL_H + FRAME_PAD }
          })()
    }
    const position = gridPosition(origin, batch?.index ?? 0)
    return { ...base, x: position.x, y: position.y }
  }

  /** One-time pass at startup: board every placeable session of every framed
   * workspace that lacks a card — history predating this feature and sessions
   * missed while the host was down. Each workspace's fresh sessions share ONE
   * batch origin (computed from the pre-existing members) and flow through
   * the 3-wide grid from slot 0, exactly like the client's import. */
  private async backfill(): Promise<void> {
    try {
      const store = await this.storeReady
      const global = store.global()
      const frames = global.wsFrames ?? {}
      const framed = new Set(Object.keys(frames))
      if (framed.size === 0) return
      const registry = this.services.workspaceRegistry
      const archived = new Set(registry.archivedSessionIds)
      for (const workspace of registry.list()) {
        if (!framed.has(workspace.id)) continue
        const memberIds = new Set(workspace.sessionIds)
        const members = [...store.cards.entries()]
          .map(([, card]) => card)
          .filter(card => memberIds.has(card.sessionId))
        const origin = members.length > 0
          ? {
              x: Math.min(...members.map(card => card.x)),
              y: Math.max(...members.map(card => card.y + CARD_H)) + GAP_Y,
            }
          : (() => {
              const rect = frames[workspace.id] ?? { x: 0, y: 0, width: 400, height: 260 }
              return { x: rect.x + FRAME_PAD, y: rect.y + FRAME_LABEL_H + FRAME_PAD }
            })()
        let index = 0
        for (const sessionId of workspace.sessionIds) {
          if (archived.has(sessionId)) continue
          if (this.hasCardSession(store, sessionId)) continue
          // Memory-backed cards park off-grid and consume no slot (mirrors
          // client syncGroup: the counter advances on non-memory only).
          const remembered = global.layoutMemory?.[sessionId] !== undefined
          await this.place(sessionId, remembered ? undefined : { origin, index })
          if (!remembered) index++
        }
      }
    } catch (error) {
      this.services.logger?.warn(`[dsh-talk-map] auto-board backfill failed: ${String(error)}`)
    }
  }
}
