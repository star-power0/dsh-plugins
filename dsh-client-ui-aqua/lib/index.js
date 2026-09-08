//#region lib/types/index.js
/**
* Aqua theme-layer plugin, node half. Pure UI plugin: the only host-side
* surface is a tiny same-origin key/value store that persists the browser
* half's skin state (`dsh.ui-aqua.*` localStorage keys) to
* `<root>/storages/ui_aqua_state.json`. The file — not localStorage — is the
* durable truth: the Host binds a fresh random loopback port on every boot,
* and localStorage is origin-scoped, so a port change would otherwise reset
* every knob to its shipped default. The browser half seeds from GET at boot
* (synchronous, before the layer mounts) and POSTs debounced updates.
*/
import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'

/** Request path carrying the skin state JSON. */
const STATE_URL = '/ui-aqua/state'
/** POST body cap — the wallpaper data URL dominates; ~localStorage quota. */
const STATE_MAX_BYTES = 12 * 1024 * 1024

/**
 * Host plugin body. Registers GET/POST on {@link STATE_URL} through the
 * webServer service; both verbs fail closed (no state file → GET 404, the
 * client keeps its localStorage-only behavior).
 * @param ctx - host cordis context.
 * @param config - insert-row config; `root` selects the DSH home directory.
 */
export function apply(ctx, config = {}) {
  const webServer = ctx.webServer
  if (!webServer || typeof webServer.register !== 'function') return () => {}
  const root = typeof config.root === 'string' && config.root
    ? config.root
    : (process.env.DSH_HOME || '')
  if (!root) return () => {}
  const stateFile = join(root, 'storages', 'ui_aqua_state.json')
  mkdirSync(dirname(stateFile), { recursive: true })
  const readState = () => {
    try {
      return readFileSync(stateFile, 'utf8')
    } catch {
      return null
    }
  }
  const writeState = (text) => {
    const tmp = `${stateFile}.${process.pid}.tmp`
    writeFileSync(tmp, text)
    renameSync(tmp, stateFile)
  }
  const dispose = webServer.register({
    kind: 'exact',
    path: STATE_URL,
    handler: (req, res) => {
      if (req.method === 'GET') {
        const text = readState()
        if (text === null) {
          res.statusCode = 404
          res.end()
          return
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(text)
        return
      }
      if (req.method === 'POST') {
        const chunks = []
        let size = 0
        let overflow = false
        req.on('data', (chunk) => {
          size += chunk.length
          if (size > STATE_MAX_BYTES) {
            overflow = true
            chunks.length = 0
            return
          }
          chunks.push(chunk)
        })
        req.on('end', () => {
          try {
            if (overflow) {
              res.statusCode = 413
              res.end('too large')
              return
            }
            const data = JSON.parse(Buffer.concat(chunks).toString('utf8'))
            if (!data || typeof data !== 'object' || !data.keys || typeof data.keys !== 'object') {
              throw new Error('bad payload')
            }
            writeState(JSON.stringify(data))
            res.statusCode = 204
            res.end()
          } catch {
            res.statusCode = 400
            res.end('bad request')
          }
        })
        req.on('error', () => {
          try {
            res.statusCode = 400
            res.end()
          } catch {
            /* ignore */
          }
        })
        return
      }
      res.statusCode = 405
      res.end()
    },
  })
  return () => {
    try {
      dispose()
    } catch {
      /* ignore */
    }
  }
}

export const inject = ['webServer']
//#endregion
export default { inject, apply }
