/**
 * /dsh-ide/* route layer: JSON envelope (ok/error) for the fs operations and
 * one SSE stream per project root. Services own gating; this layer owns HTTP
 * shape and subscriber bookkeeping. Reference: dsh-web-ui aionui-panel routes
 * (Apache-2.0), trimmed to list/read/write + fs change stream.
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import { spawn } from 'node:child_process'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type { PanelError } from '../core/types.ts'
import type { FsService } from './fs-service.ts'
import * as git from './git.ts'
import { isLoopbackRequest } from './security.ts'
import type { TextEncodingId } from '../core/encoding.ts'

const OK = (value: unknown): { ok: true; value: unknown } => ({ ok: true, value })
const FAIL = (error: PanelError): { ok: false; error: PanelError } => ({ ok: false, error })

const BAD_REQUEST: PanelError = { code: 'internal', message: 'malformed request' }

/** SSE keep-alive comment interval (proxies drop idle connections). */
const HEARTBEAT_MS = 15_000

interface Subscriber {
  root: string
  res: ServerResponse
}

function forbidden(res: ServerResponse): void {
  res.writeHead(403, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify({ error: 'forbidden: loopback-only' }))
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of req) {
    const buffer = chunk as Buffer
    chunks.push(buffer)
    total += buffer.length
    if (total > 1 << 20) return null
  }
  const text = Buffer.concat(chunks).toString('utf8')
  if (text === '') return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

function strField(payload: unknown, key: string): string | null {
  if (typeof payload !== 'object' || payload === null) return null
  const value = (payload as Record<string, unknown>)[key]
  return typeof value === 'string' && value !== '' ? value : null
}

function strOrEmpty(payload: unknown, key: string): string | null {
  if (typeof payload !== 'object' || payload === null) return null
  const value = (payload as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : null
}

function json(res: ServerResponse, envelope: { ok: boolean; value?: unknown; error?: PanelError }, status = 200): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(envelope))
}

/** Path safety for git args: no traversal, no drive letters, relative only. */
function isSafeGitPath(value: string): boolean {
  return !value.includes('..') && !value.startsWith('/') && !value.startsWith('\\') && !value.includes(':')
}

/**
 * Run a git operation against the gated root; errors become PanelError.
 * P0-03: git resolves the repo upward from any subdirectory, so unless
 * `allowSubdirRoot` is set (status probe), the requested root must itself be
 * the canonical repository top level. Otherwise the operation is refused —
 * it could touch files in a parent repo outside the selected root.
 */
async function withGitRoot(
  fs: FsService,
  root: string,
  run: (cwd: string) => Promise<unknown>,
  opts: { allowSubdirRoot?: boolean } = {},
): Promise<{ ok: true; value: unknown } | { ok: false; error: PanelError }> {
  const gated = await fs.verify(root)
  if (!gated.ok || gated.canonical === undefined) {
    return { ok: false, error: gated.error ?? { code: 'forbidden', message: 'root not gated' } }
  }
  if (!opts.allowSubdirRoot) {
    const top = await git.repoTopLevel(gated.canonical)
    if (top !== null && top !== gated.canonical) {
      return {
        ok: false,
        error: {
          code: 'git-root-outside',
          message: '所选目录位于父 Git 仓库内，请在 Git 面板中选择该仓库根目录',
        },
      }
    }
  }
  try {
    return { ok: true, value: await run(gated.canonical) }
  } catch (error) {
    return { ok: false, error: { code: 'git-error', message: error instanceof Error ? error.message : String(error) } }
  }
}

/** A git operation with an optional path arg (shared request shape). */
async function gitWithOptionalPath(
  fs: FsService,
  root: string,
  payload: unknown,
  run: (cwd: string, path: string | undefined) => Promise<unknown>,
): Promise<{ ok: true; value: unknown } | { ok: false; error: PanelError }> {
  const path = strField(payload, 'path')
  if (path !== null && !isSafeGitPath(path)) {
    return { ok: false, error: { code: 'git-error', message: 'unsafe git path' } }
  }
  return withGitRoot(fs, root, (cwd) => run(cwd, path ?? undefined))
}

/** Register the /dsh-ide routes (prefix for JSON, exact for the SSE stream). */
export function registerPanelRoutes(ctx: Context, fs: FsService): () => void {
  const subscribers = new Set<Subscriber>()
  let heartbeatTimer: NodeJS.Timeout | undefined

  const push = (subscriber: Subscriber, payload: unknown): void => {
    subscriber.res.write(`event: change\ndata: ${JSON.stringify(payload)}\n\n`)
  }

  const handler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (!isLoopbackRequest(req)) {
      forbidden(res)
      return
    }
    if (req.method !== 'POST') {
      res.writeHead(405)
      res.end()
      return
    }
    const contentType = req.headers['content-type'] ?? ''
    if (!contentType.toLowerCase().startsWith('application/json')) {
      json(res, FAIL(BAD_REQUEST), 415)
      return
    }
    const pathname = new URL(req.url ?? '/', 'http://x').pathname
    const payload = await readJsonBody(req)
    if (payload === null) {
      json(res, FAIL(BAD_REQUEST))
      return
    }
    const root = strField(payload, 'root')
    if (root === null) {
      json(res, FAIL(BAD_REQUEST))
      return
    }
    switch (pathname) {
      case '/dsh-ide/list': {
        const path = strField(payload, 'path') ?? ''
        const result = await fs.list(root, path)
        json(res, 'entries' in result ? OK(result) : FAIL(result))
        return
      }
      case '/dsh-ide/read': {
        const path = strField(payload, 'path')
        if (path === null) {
          json(res, FAIL(BAD_REQUEST))
          return
        }
        const encodingRaw = strField(payload, 'encoding')
        const encoding = encodingRaw ?? 'utf-8'
        const result = await fs.read(root, path, encoding as TextEncodingId | 'auto')
        json(res, 'content' in result ? OK(result) : FAIL(result))
        return
      }
      case '/dsh-ide/write': {
        const path = strField(payload, 'path')
        const content = strOrEmpty(payload, 'content')
        if (path === null || content === null) {
          json(res, FAIL(BAD_REQUEST))
          return
        }
        const rawBase = typeof payload === 'object' && payload !== null
          ? (payload as Record<string, unknown>).baseMtime
          : undefined
        const baseMtime = typeof rawBase === 'number' && Number.isFinite(rawBase) ? rawBase : undefined
        const encodingRaw = strField(payload, 'encoding')
        const encoding = (encodingRaw ?? 'utf-8') as TextEncodingId
        const result = await fs.write(root, path, content, baseMtime, encoding)
        json(res, 'mtime' in result ? OK(result) : FAIL(result))
        return
      }
      case '/dsh-ide/mkdir': {
        const path = strField(payload, 'path')
        if (path === null) {
          json(res, FAIL(BAD_REQUEST))
          return
        }
        const result = await fs.createDir(root, path)
        json(res, 'ok' in result ? OK(result) : FAIL(result))
        return
      }
      case '/dsh-ide/rename': {
        const from = strField(payload, 'from')
        const to = strField(payload, 'to')
        if (from === null || to === null) {
          json(res, FAIL(BAD_REQUEST))
          return
        }
        const result = await fs.rename(root, from, to)
        json(res, 'ok' in result ? OK(result) : FAIL(result))
        return
      }
      case '/dsh-ide/remove': {
        const path = strField(payload, 'path')
        if (path === null) {
          json(res, FAIL(BAD_REQUEST))
          return
        }
        const result = await fs.remove(root, path)
        json(res, 'ok' in result ? OK(result) : FAIL(result))
        return
      }
      case '/dsh-ide/reveal': {
        const path = strField(payload, 'path') ?? ''
        const result = await fs.resolve(root, path)
        if (!('abs' in result)) {
          json(res, FAIL(result))
          return
        }
        try {
          // Windows Explorer 定位到文件（/select, 前缀，路径带逗号也能处理）。
          spawn('explorer.exe', [`/select,${result.abs}`], { detached: true, stdio: 'ignore' }).unref()
        } catch {
          json(res, FAIL({ code: 'internal', message: 'cannot open explorer' }))
          return
        }
        json(res, OK({ ok: true }))
        return
      }
      case '/dsh-ide/git/status': {
        // status 是只读探测：root 非仓库（含父仓库子目录）时返回 isRepo:false，
        // 由前端发现嵌套仓库；写操作（stage/commit 等）仍受 withGitRoot 严格校验。
        const result = await withGitRoot(fs, root, (cwd) => git.status(cwd), { allowSubdirRoot: true })
        json(res, result.ok ? OK(result.value) : FAIL(result.error))
        return
      }
      case '/dsh-ide/git/repos': {
        // Discover git repos below the gated root (root itself included) so the
        // panel can offer nested repos when the workspace root is not one.
        const result = await withGitRoot(fs, root, async (cwd) => {
          const repos = await git.findRepos(cwd)
          return Promise.all(repos.map(async (repo) => ({
            path: repo,
            name: repo === cwd ? repo : repo.slice(cwd.length + 1).replaceAll('\\', '/'),
            branch: await git.currentBranch(repo).catch(() => 'HEAD'),
          })))
        })
        json(res, result.ok ? OK(result.value) : FAIL(result.error))
        return
      }
      case '/dsh-ide/git/diff': {
        const staged = strField(payload, 'staged') === 'true'
        const result = await gitWithOptionalPath(fs, root, payload, (cwd, path) => git.diff(cwd, path, staged))
        json(res, result.ok ? OK(result.value) : FAIL(result.error))
        return
      }
      case '/dsh-ide/git/stage': {
        const result = await gitWithOptionalPath(fs, root, payload, (cwd, path) => git.stage(cwd, path).then(() => ({ ok: true })))
        json(res, result.ok ? OK(result.value) : FAIL(result.error))
        return
      }
      case '/dsh-ide/git/unstage': {
        const result = await gitWithOptionalPath(fs, root, payload, (cwd, path) => git.unstage(cwd, path).then(() => ({ ok: true })))
        json(res, result.ok ? OK(result.value) : FAIL(result.error))
        return
      }
      case '/dsh-ide/git/discard': {
        const result = await gitWithOptionalPath(fs, root, payload, (cwd, path) => {
          if (path === undefined) return Promise.reject(new Error('discard requires a path'))
          return git.discard(cwd, path).then(() => ({ ok: true }))
        })
        json(res, result.ok ? OK(result.value) : FAIL(result.error))
        return
      }
      case '/dsh-ide/git/commit': {
        const message = strField(payload, 'message')
        if (message === null) {
          json(res, FAIL(BAD_REQUEST))
          return
        }
        const result = await withGitRoot(fs, root, (cwd) => git.commit(cwd, message).then(() => ({ ok: true })))
        json(res, result.ok ? OK(result.value) : FAIL(result.error))
        return
      }
      case '/dsh-ide/git/log': {
        const rawCount = strField(payload, 'count')
        const count = rawCount === null ? 30 : Number.parseInt(rawCount, 10)
        const result = await withGitRoot(fs, root, (cwd) => git.log(cwd, Number.isFinite(count) ? count : 30))
        json(res, result.ok ? OK(result.value) : FAIL(result.error))
        return
      }
      case '/dsh-ide/git/commit-diff': {
        const hash = strField(payload, 'hash')
        if (hash === null || !/^[0-9a-fA-F]{4,40}$/.test(hash)) {
          json(res, FAIL(BAD_REQUEST))
          return
        }
        const result = await withGitRoot(fs, root, (cwd) => git.commitDiff(cwd, hash))
        json(res, result.ok ? OK(result.value) : FAIL(result.error))
        return
      }
      default:
        res.writeHead(404)
        res.end()
    }
  }

  const sse = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (!isLoopbackRequest(req)) {
      forbidden(res)
      return
    }
    const url = new URL(req.url ?? '/', 'http://x')
    const root = url.searchParams.get('root')
    if (root === null || root === '') {
      res.writeHead(400)
      res.end()
      return
    }
    const gated = await fs.verify(root)
    if (!gated.ok || gated.canonical === undefined) {
      json(res, FAIL(gated.error ?? { code: 'forbidden', message: 'root not gated' }), 400)
      return
    }
    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    })
    res.write('retry: 2000\n\n')
    const subscriber: Subscriber = { root: gated.canonical, res }
    subscribers.add(subscriber)
    if (heartbeatTimer === undefined) {
      heartbeatTimer = setInterval(() => {
        for (const current of subscribers) current.res.write(': ping\n\n')
      }, HEARTBEAT_MS)
    }
    const disposeWatch = fs.watch(gated.canonical, () => {
      push(subscriber, { kind: 'fs', root: gated.canonical })
    })
    req.on('close', () => {
      disposeWatch()
      subscribers.delete(subscriber)
      if (subscribers.size === 0 && heartbeatTimer !== undefined) {
        clearInterval(heartbeatTimer)
        heartbeatTimer = undefined
      }
    })
  }

  const media = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (!isLoopbackRequest(req)) {
      forbidden(res)
      return
    }
    const url = new URL(req.url ?? '/', 'http://x')
    const root = url.searchParams.get('root')
    const path = url.searchParams.get('path')
    if (root === null || root === '' || path === null || path === '') {
      res.writeHead(400)
      res.end('missing root/path')
      return
    }
    const result = await fs.readBinary(root, path)
    if (!('buffer' in result)) {
      res.writeHead(404)
      res.end('not found')
      return
    }
    const ext = (path.split('.').pop() ?? '').toLowerCase()
    const mime: Record<string, string> = {
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
      webp: 'image/webp', bmp: 'image/bmp', ico: 'image/x-icon', avif: 'image/avif',
      svg: 'image/svg+xml', pdf: 'application/pdf',
    }
    res.writeHead(200, {
      'content-type': mime[ext] ?? 'application/octet-stream',
      'content-length': String(result.buffer.length),
      'cache-control': 'no-store',
    })
    res.end(result.buffer)
  }

  const disposers = [
    ctx.webServer.register({ kind: 'prefix', path: '/dsh-ide', handler }),
    ctx.webServer.register({ kind: 'exact', path: '/dsh-ide/events', handler: sse }),
    ctx.webServer.register({ kind: 'exact', path: '/dsh-ide/media', handler: media }),
  ]
  return () => {
    for (const dispose of disposers) dispose()
    if (heartbeatTimer !== undefined) clearInterval(heartbeatTimer)
    for (const subscriber of subscribers) subscriber.res.end()
    subscribers.clear()
  }
}
