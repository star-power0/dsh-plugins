/**
 * dsh-ide-layout — host half: workspace-gated filesystem service and the
 * /dsh-ide/* HTTP routes (JSON operations + SSE change stream) on the shared
 * webserver. The browser half (exports "./client") is served by
 * client-modules from the same package's dsh.client declaration.
 *
 * Fusion notes (2026-08-20, local build):
 * - Base: myzane678/dsh-ide-layout v0.2.0 (independent three-zone layout).
 * - The project root follows the ACTIVE SESSION's cwd (DSH session model,
 *   same as the previous local build) instead of workspaceRegistry, so the
 *   plugin keeps working under web/desktop profiles that expose `sessions`
 *   but not `workspaceRegistry`.
 * - Trust fence: loopback + Origin checks kept from the classmate build;
 *   the previous local build's trusted-hosts fence is equivalent and the
 *   sessions gate below still refuses non-workspace paths.
 */

import { realpath } from 'node:fs/promises'
import type { IncomingMessage } from 'node:http'
import type { Duplex } from 'node:stream'
import { WebSocketServer } from 'ws'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-session'
import { FsService } from './host/fs-service.ts'
import type { GateVerdict, WorkspaceGate } from './host/fs-service.ts'
import { registerPanelRoutes } from './host/routes.ts'
import { PtyService } from './host/pty-service.ts'
import { attachTerminalSocket } from './host/ws-terminal.ts'
import { attachLspSocket } from './host/lsp-service.ts'
import { isLoopbackRequest, rejectUpgrade } from './host/security.ts'

/** Required services: the route registry and the session store. */
export const name = 'dsh-ide-layout'
export const inject = ['webServer', 'sessions']

interface SessionService {
  /** All live sessions, in creation order (dsh-session SessionStore). */
  list(): { header: { cwd?: string } }[]
}

/**
 * Production gate: canonicalize the requested root and require it to be the
 * canonical cwd of a live session (or a subdirectory of one). This keeps the
 * IDE scoped to the active conversation's working directory, so an agent
 * cannot use the routes to touch arbitrary disk paths.
 */
/**
 * Safely read a Cordis service that may be absent on some profiles.
 *
 * Property access on a cordis context proxy throws for services that are not
 * declared in `inject` ("cannot get property X without inject"), so use the
 * reflection-backed `ctx.get()` which reads the service store directly and
 * returns `undefined` when the name is not (yet) provided.
 */
function optionalService<T>(ctx: Context, key: string): T | undefined {
  try {
    return ctx.get(key)
  } catch {
    return undefined
  }
}

function createSessionGate(ctx: Context): WorkspaceGate {
  const sessions = (ctx as unknown as { sessions: SessionService }).sessions
  // The live session store is in-memory only, so a historical/attached
  // workspace may carry no live session whose header.cwd matches. Probe the
  // workspace registry (host) or workspace view (client) as a fallback.
  // Probed on every call (not captured at apply time) so a workspace service
  // that mounts later in the boot order is still picked up.
  const workspaceRegistry = (): { list(): { path: string }[] } | undefined =>
    optionalService<{ list(): { path: string }[] }>(ctx, 'workspaceRegistry')
      ?? optionalService<{ list(): { path: string }[] }>(ctx, 'workspaces')
  return async (root): Promise<GateVerdict> => {
    if (typeof root !== 'string' || root === '') {
      return { ok: false, error: { code: 'workspace-unknown', message: 'empty project root' } }
    }
    let canonical: string
    try {
      canonical = await realpath(root)
    } catch {
      return { ok: false, error: { code: 'workspace-unknown', message: 'path does not resolve on disk' } }
    }
    // Accept the root itself when it matches a live session cwd; otherwise
    // fall back to the first session whose cwd contains it (multi-session).
    const liveSessions = sessions.list()
    let matched = false
    for (const session of liveSessions) {
      const cwd = session.header.cwd
      if (typeof cwd !== 'string' || cwd === '') continue
      try {
        const canonicalCwd = await realpath(cwd)
        if (canonical === canonicalCwd || canonical.startsWith(`${canonicalCwd}${process.platform === 'win32' ? '\\' : '/'}`)) {
          matched = true
          break
        }
      } catch {
        // stale cwd; skip
      }
    }
    if (!matched) {
      // No live session's cwd matches: fall back to registered workspaces so
      // the IDE still opens inside a user-registered workspace directory.
      const registered = workspaceRegistry()
      if (registered) {
        try {
          for (const workspace of registered.list()) {
            const workspacePath = workspace.path
            if (typeof workspacePath !== 'string' || workspacePath === '') continue
            try {
              const canonicalWorkspace = await realpath(workspacePath)
              const sep = process.platform === 'win32' ? '\\' : '/'
              if (canonical === canonicalWorkspace || canonical.startsWith(`${canonicalWorkspace}${sep}`)) {
                return { ok: true, canonical }
              }
            } catch {
              // stale workspace path; skip
            }
          }
        } catch {
          // registry not ready; fall through to the session-gate error
        }
      }
      return { ok: false, error: { code: 'workspace-unknown', message: 'path is not inside a live session workspace' } }
    }
    return { ok: true, canonical }
  }
}

/** Model-facing announcement so agents know the IDE panels exist. */
export const IDE_GUIDANCE = '本机已安装 dsh-ide-layout 插件（DSH Web GUI 的 IDE 布局）：左侧为工作区文件树（目录+文件，点击文件在中间编辑器打开），中间为编辑器与终端。数据源为当前会话工作目录的真实文件系统，宿主进程经 /dsh-ide/* 路由提供。用户提到「文件树 / 编辑器 / IDE 布局」时即指本插件。'

/**
 * Mount the fs service and its routes.
 * @param ctx - context carrying webServer and sessions.
 */
export function apply(ctx: Context): void {
  const gate = createSessionGate(ctx)
  const fs = new FsService(gate)
  const pty = new PtyService()
  ctx.effect(() => registerPanelRoutes(ctx, fs), 'dsh-ide-layout: /dsh-ide routes')
  // 终端 WebSocket：一个 upgrade 端点，?root= 定位工作区根目录作为 shell cwd。
  ctx.effect(() => {
    const wss = new WebSocketServer({ noServer: true })
    const dispose = ctx.webServer.registerUpgrade({
      path: '/dsh-ide/ws/terminal',
      handler: (req, socket, head) => {
        // P0-01：WebSocket 与 HTTP 同级来源校验（严格模式：缺失 Origin 直接拒绝）。
        if (!isLoopbackRequest(req as IncomingMessage, true)) {
          rejectUpgrade(socket as Duplex)
          return
        }
        // `ws` 需要真实的 Node 类型；此处为宿主 webserver 的结构化面（结构兼容）做边界转换。
        wss.handleUpgrade(req as IncomingMessage, socket as Duplex, head as Buffer, (ws) => {
          attachTerminalSocket(fs, pty, req as IncomingMessage, ws)
        })
      },
    })
    return () => {
      dispose()
      pty.disposeAll()
      wss.close()
    }
  }, 'dsh-ide-layout: terminal WebSocket')
  // LSP WebSocket：一个 upgrade 端点，?root= 定位工作区根目录（语言服务器
  // 进程以该目录为 cwd 启动）。浏览器半区经此连接走完整 LSP 协议（补全/诊断）。
  ctx.effect(() => {
    const wss = new WebSocketServer({ noServer: true })
    const dispose = ctx.webServer.registerUpgrade({
      path: '/dsh-ide/ws/lsp',
      handler: (req, socket, head) => {
        // P0-01：与终端 WS 同样的严格来源校验。
        if (!isLoopbackRequest(req as IncomingMessage, true)) {
          rejectUpgrade(socket as Duplex)
          return
        }
        wss.handleUpgrade(req as IncomingMessage, socket as Duplex, head as Buffer, (ws) => {
          attachLspSocket(fs, req as IncomingMessage, ws)
        })
      },
    })
    return () => {
      dispose()
      wss.close()
    }
  }, 'dsh-ide-layout: LSP WebSocket')
}
