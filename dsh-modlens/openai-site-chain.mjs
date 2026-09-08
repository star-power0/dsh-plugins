import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

const SITE_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/
const CLI_TIMEOUT_MS = 180_000
const MAX_SITES = 16
const MAX_TEXT = 512

function configPath() {
  return join(homedir(), '.modlens', 'config.json')
}

async function readConfig(file = configPath()) {
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8'))
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch (error) {
    if (error?.code === 'ENOENT') return {}
    throw new Error(`cannot read ModLens configuration: ${error?.message ?? error}`)
  }
}

function cleanText(value, fallback = '') {
  return typeof value === 'string' ? value.trim().slice(0, MAX_TEXT) : fallback
}

function validUrl(value) {
  if (typeof value !== 'string' || value.trim() === '' || value.length > 2048) return false
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.username === '' && url.password === ''
  } catch {
    return false
  }
}

function normalizeSite(raw, index = 0) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const id = cleanText(raw.id).toLowerCase()
  const name = cleanText(raw.name, id || `站点 ${index + 1}`)
  const apiKey = typeof raw.apiKey === 'string' ? raw.apiKey.trim() : ''
  const baseUrl = typeof raw.baseUrl === 'string' ? raw.baseUrl.trim().replace(/\/+$/, '') : ''
  const model = cleanText(raw.model)
  if (!SITE_ID_RE.test(id) || !validUrl(baseUrl) || apiKey === '' || model === '') return null
  return {
    id,
    name,
    apiKey,
    baseUrl,
    model,
    enabled: raw.enabled !== false,
    ...(typeof raw.proxy === 'string' && raw.proxy.trim() !== '' ? { proxy: raw.proxy.trim() } : {}),
    ...(raw.extraBody && typeof raw.extraBody === 'object' && !Array.isArray(raw.extraBody) ? { extraBody: raw.extraBody } : {}),
    ...(raw.structuredOutput === true ? { structuredOutput: true } : {})
  }
}

function legacyOpenaiSite(config) {
  const provider = config?.providers?.openai
  if (!provider || typeof provider !== 'object' || Array.isArray(provider)) return null
  return normalizeSite({
    id: 'legacy-openai',
    name: 'OpenAI（旧配置）',
    apiKey: provider.apiKey,
    baseUrl: provider.baseUrl,
    model: provider.model,
    proxy: provider.proxy,
    extraBody: provider.extraBody,
    structuredOutput: provider.structuredOutput
  })
}

function allConfiguredSites(config) {
  const byId = new Map()
  const explicit = Array.isArray(config?.openaiSites) ? config.openaiSites : []
  for (let i = 0; i < Math.min(explicit.length, MAX_SITES); i += 1) {
    const site = normalizeSite(explicit[i], i)
    if (site && !byId.has(site.id)) byId.set(site.id, site)
  }
  const legacy = legacyOpenaiSite(config)
  if (legacy && !byId.has(legacy.id)) byId.set(legacy.id, legacy)
  return byId
}

function orderedConfiguredSites(config) {
  const byId = allConfiguredSites(config)
  const explicitOrder = Array.isArray(config?.openaiSiteOrder)
    ? config.openaiSiteOrder.filter((id) => typeof id === 'string').map((id) => id.trim().toLowerCase())
    : []
  const result = []
  const add = (site) => {
    if (site?.enabled && !result.some((item) => item.id === site.id)) result.push(site)
  }
  const legacy = byId.get('legacy-openai')
  add(legacy)
  for (const id of explicitOrder) add(byId.get(id))
  for (const site of byId.values()) add(site)
  return result
}

function configuredSites(config) {
  return orderedConfiguredSites(config)
}

function redact(text, sites) {
  let result = String(text ?? '')
  for (const site of sites) {
    if (site.apiKey) result = result.split(site.apiKey).join('[redacted-key]')
    if (site.baseUrl) result = result.split(site.baseUrl).join('[redacted-url]')
  }
  try {
    const url = new URL(result)
    if (url.username || url.password) {
      url.username = ''
      url.password = ''
      result = url.toString()
    }
  } catch {
    // Error text is not necessarily a URL.
  }
  return result.replace(/https?:\/\/[^\s)]+/gi, '[redacted-url]').slice(0, 300)
}

function resolveNodeExecutable(runtime = process, fileExists = existsSync) {
  if (!runtime.versions?.electron) return runtime.execPath
  const roots = [runtime.env.ProgramFiles, runtime.env.ProgramW6432].filter(Boolean)
  const candidates = [
    runtime.env.NODE_EXECUTABLE,
    runtime.env.NODE,
    ...roots.flatMap((root) => [join(root, 'nodejs', 'node.exe'), join(root, 'node', 'node.exe')]),
    runtime.env.LOCALAPPDATA && join(runtime.env.LOCALAPPDATA, 'Programs', 'node', 'node.exe')
  ].filter(Boolean)
  const found = candidates.find((candidate) => fileExists(candidate))
  if (found) return found
  throw new Error('Desktop Electron process cannot locate node.exe; set NODE_EXECUTABLE to a Node.js executable')
}

function runCli(command, args, env, signal) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    let settled = false
    const onAbort = () => {
      child.kill()
      if (!settled) {
        settled = true
        reject(new Error('ModLens site chain was cancelled'))
      }
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('error', (error) => {
      signal?.removeEventListener('abort', onAbort)
      if (!settled) {
        settled = true
        reject(error)
      }
    })
    child.on('close', (code) => {
      signal?.removeEventListener('abort', onAbort)
      if (!settled) {
        settled = true
        resolve({ stdout, stderr, code })
      }
    })
  })
}

async function runOne(site, options, sites) {
  const home = await mkdtemp(join(tmpdir(), 'modlens-site-home-'))
  try {
    const dir = join(home, '.modlens')
    await mkdir(dir, { recursive: true })
    const provider = {
      apiKey: site.apiKey,
      baseUrl: site.baseUrl,
      model: site.model,
      ...(site.proxy ? { proxy: site.proxy } : {}),
      ...(site.extraBody ? { extraBody: site.extraBody } : {}),
      ...(site.structuredOutput ? { structuredOutput: true } : {})
    }
    const file = join(dir, 'config.json')
    await writeFile(file, `${JSON.stringify({ provider: 'openai', providers: { openai: provider } }, null, 2)}\n`, { mode: 0o600 })
    const env = { ...process.env, HOME: home, USERPROFILE: home, HOMEDRIVE: '', HOMEPATH: '' }
    const args = [options.cliPath, '-i', options.input, '-p', 'openai', '-m', site.model, '--timeout', String(options.timeoutMs ?? CLI_TIMEOUT_MS)]
    if (options.prompt) args.push('--prompt', options.prompt)
    if (options.extraBody) args.push('--extra-body', JSON.stringify(options.extraBody))
    const { stdout, stderr, code } = await runCli(options.nodeExecutable ?? resolveNodeExecutable(), args, env, options.signal)
    if (code !== 0) throw new Error((stderr || stdout).trim() || `site exited with code ${code}`)
    let parsed
    try {
      parsed = JSON.parse(stdout)
    } catch {
      throw new Error(`site returned invalid JSON: ${stdout.trim().slice(-300)}`)
    }
    if (!parsed?.result || typeof parsed.result !== 'object') throw new Error('site returned no valid vision result')
    return {
      ...parsed,
      provider: `openai:${site.id}`,
      meta: { ...(parsed.meta ?? {}), model: site.model, siteId: site.id, siteName: site.name }
    }
  } catch (error) {
    throw new Error(redact(error instanceof Error ? error.message : error, sites))
  } finally {
    await rm(home, { recursive: true, force: true }).catch(() => {})
  }
}

export function loadOpenaiSites(config) {
  return configuredSites(config)
}

export async function configuredOpenaiSites(file = configPath()) {
  return configuredSites(await readConfig(file))
}

export async function runOpenaiSiteChain(options) {
  const config = options.config ?? await readConfig(options.configFile)
  const sites = configuredSites(config)
  if (sites.length === 0) return null
  const attempts = []
  let lastError
  for (const site of sites) {
    const started = Date.now()
    try {
      const parsed = await runOne(site, options, sites)
      attempts.push({ siteId: site.id, siteName: site.name, ok: true, durationSeconds: (Date.now() - started) / 1000 })
      const warnings = Array.isArray(parsed.meta?.warnings) ? [...parsed.meta.warnings] : []
      if (attempts.length > 1) warnings.push(`Failed over to ${site.name} after: ${attempts.slice(0, -1).map((item) => `${item.siteName} (${item.error})`).join('; ')}.`)
      return {
        ...parsed,
        meta: { ...parsed.meta, attempts, warnings }
      }
    } catch (error) {
      lastError = error
      attempts.push({ siteId: site.id, siteName: site.name, ok: false, durationSeconds: (Date.now() - started) / 1000, error: redact(error, sites) })
    }
  }
  throw new Error(`Every configured OpenAI vision site failed. ${attempts.map((item) => `${item.siteName}: ${item.error}`).join(' | ') || redact(lastError, sites)}`)
}

export function openaiSiteSummary(config) {
  const byId = allConfiguredSites(config)
  const sites = [...byId.values()].map((site) => ({
    id: site.id,
    name: site.name,
    baseUrl: site.baseUrl,
    model: site.model,
    hasKey: true,
    enabled: site.enabled,
    valid: true
  }))
  const explicitOrder = Array.isArray(config?.openaiSiteOrder)
    ? config.openaiSiteOrder.filter((id) => typeof id === 'string').map((id) => id.trim().toLowerCase())
    : []
  const order = ['legacy-openai', ...explicitOrder, ...sites.map((site) => site.id)]
    .filter((id, index, list) => byId.has(id) && list.indexOf(id) === index)
  const ordered = order.map((id) => sites.find((site) => site.id === id)).filter(Boolean)
  return { sites: ordered, order, enabled: configuredSites(config).length > 0 }
}

export { configPath, normalizeSite, resolveNodeExecutable }
