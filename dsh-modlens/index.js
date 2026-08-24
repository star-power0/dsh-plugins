// Unified DSH ModLens plugin.
// The engine and guard implementations remain isolated so their observable
// contracts, storage paths, routes, and failure semantics stay unchanged.
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const engine = await import(new URL('./engine/dsh/index.js', import.meta.url))
const guard = await import(new URL('./guard/index.js', import.meta.url))

export const name = 'dsh-modlens'
export const inject = ['tools', 'agents', 'attachments', 'llm']
export const MEDIA_EXT = engine.MEDIA_EXT
export const __config = engine.__config
export const __toolCache = engine.__toolCache

function engineConfig(config) {
  // Production defaults mirror the pre-merge instance settings: the guard owns
  // request-time image routing and ModLens wrapper-provider registration, so
  // the engine contributes its read-image tool + settings card only. Each
  // flag stays an opt-in (set `true` explicitly to enable the engine's own
  // visionProvider / pasteToPath / autoRead), so nothing the old split could
  // do is lost — it just no longer runs by default.
  return {
    ...config,
    visionProvider: config.visionProvider ?? false,
    pasteToPath: config.pasteToPath ?? false,
    autoRead: config.autoRead ?? false,
    settingsCard: config.settingsCard ?? true,
    toolName: config.toolName || 'modlens_read_image',
  }
}

function guardConfig(config) {
  return {
    ...config,
    root: config.root,
    visionOnly: config.visionOnly,
  }
}

export function apply(ctx, config = {}) {
  // Preserve the historical activation order: ModLens mounts its tool,
  // adapter, paste/config routes first; the guard then wraps admission and
  // request-time image conversion around that already-mounted engine.
  engine.apply(ctx, engineConfig(config))
  guard.apply(ctx, guardConfig(config))
}

// Keep the private implementation paths discoverable for diagnostics and
// migration tests without creating a second DSH loader entry.
export const paths = Object.freeze({
  root: here,
  engine: join(here, 'engine'),
  guard: join(here, 'guard'),
})

// Keep createRequire reachable to make the package's Node resolution anchor
// explicit for consumers that inspect the unified plugin.
export const runtimeRequire = createRequire(import.meta.url)

export {
  engine,
  guard,
}
