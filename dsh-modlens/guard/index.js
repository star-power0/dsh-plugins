// dsh-modlens-guard —— host side (node)
//
// Routes images by the CURRENT model's declared capability, and makes the
// state of that routing visible instead of silently degrading.
//
//   input includes "image"  -> native multimodal path, this plugin stands down
//   input is text-only      -> images are rewritten to modlens evidence text
//                              for THIS request only; the durable log keeps
//                              the real image blocks
//
// When the bridge cannot read an image (no engine configured, engine failing,
// modlens absent) a text-only step carrying images is REJECTED rather than
// entered with an apology block: a silent degrade looks identical to a normal
// answer, which is exactly the failure this plugin exists to surface.
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runOpenaiSiteChain, openaiSiteSummary } from "../openai-site-chain.mjs";

const name = "modlens-guard";
const inject = ["llm", "attachments"];

// The host refuses images BEFORE the agent ever runs, in two places:
//   apiproxy prompt()      -> MODEL_DOES_NOT_SUPPORT_IMAGES  (sending an image)
//   apiproxy selectModel() -> model-unavailable              (switching models)
// Both gate on ctx.llm.resolveModelInfo().inputModalities, so `agent/pre-step`
// — where this plugin routes images — is never reached for a text-only model.
// admitImages() re-opens exactly those two gates while the bridge can actually
// read an image, and nothing else:
//
//   * modelAcceptsImages() below calls the UNWRAPPED resolver. If the guard
//     read its own fiction it would classify a text-only model as native and
//     hand the raw image to a model that cannot see it — strictly worse than
//     the refusal, since the model would then invent a description.
//   * buildModelCatalog() also resolves every model to populate the settings
//     list. Widening that would make every text-only model advertise image
//     support and contradict the model-enhancer capability toggle, so the
//     override is scoped to admission and skips catalog-shaped lookups.
const ADMISSION_STACK_HINT = /\b(admit|prompt|selectModel)\b/;
const CATALOG_STACK_HINT = /buildModelCatalog|listModels/;
const TRUE_RESOLVERS = new WeakMap();
const ASSEMBLED_MODELS = new WeakMap();
const PERSISTED_FIELDS = ["reads", "failures", "blocks", "lastOkAt", "lastFailAt", "lastError"];
let persistChain = Promise.resolve();
const TRUE_LIST_MODELS = new WeakMap();
const WRAPPED_UPSTREAMS = new WeakMap();
const VISION_MODEL_SNAPSHOTS = new WeakMap();
const VISION_EVIDENCE_CACHE = new Map();
// The evidence cache is also durable: a fresh process must not re-read every
// historical image. attachmentId is a sha256 content hash, so cached evidence
// stays valid for the same bytes; only the newest entries are kept on disk.
const EVIDENCE_CACHE_LIMIT = 256;
let EVIDENCE_CACHE_ROOT = "";
let evidenceCacheTimer = null;
let evidenceCacheChain = Promise.resolve();
const TURN_STATUSES = new Map();
const SESSION_TURNS = new Map();
const ORIGINAL_LIST_MODELS = Symbol.for("dsh-modlens-guard.original-list-models");

function shouldAdmitForStack(stack) {
  if (CATALOG_STACK_HINT.test(stack)) return false;
  return ADMISSION_STACK_HINT.test(stack);
}

/**
 * Should this resolveModelInfo() call be told the model takes images?
 * Only for the two admission gates, and only while a read would really work.
 * Identified by call site rather than by argument, because both gates and the
 * catalog pass the same (provider, model) pair.
 */
function admitImages() {
  if (currentStatus().state !== "ready") return false;
  return shouldAdmitForStack(new Error().stack ?? "");
}

const CLI_TIMEOUT_MS = 180_000;
const MEDIA_EXT = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/heic": ".heic",
  "image/heif": ".heif"
};

// Engine names as modlens itself spells them, plus the ones needing no key.
const ENGINES = ["antigravity-cli", "gemini-api", "openai", "anthropic", "claude-cli", "kimi-cli"];
const KEYLESS_ENGINES = ["antigravity-cli", "claude-cli", "kimi-cli"];
const ENGINE_ALIASES = {
  antigravity: "antigravity-cli",
  agy: "antigravity-cli",
  gemini: "gemini-api",
  "openai-compat": "openai",
  claude: "anthropic",
  "claude-code": "claude-cli"
};
const ENGINE_ENV_KEYS = {
  "gemini-api": ["GEMINI_API_KEY"],
  openai: ["OPENAI_API_KEY"],
  anthropic: ["ANTHROPIC_API_KEY"]
};

let ACTIVE_CONFIG = {};

const STATE = {
  pluginLoaded: false,
  openaiSites: { sites: [], order: [], enabled: false },
  lastSiteRuns: [],
  cliPath: "",
  lastOkAt: null,
  lastFailAt: null,
  lastError: "",
  lastModelCheck: null,
  lastPreStep: null,
  reads: 0,
  failures: 0,
  blocks: 0,
  persistPath: "",
  visionProviders: [],
  visionOnly: false,
  probeAt: null,
  probeDurationMs: null,
  probeProvider: "",
  probeModel: "",
  probeOk: null
};

function persistentStatePath(root) {
  const fallbackRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
  return join(root ?? process.env.DSH_HOME ?? fallbackRoot, "storages", "modlens_guard_state.json");
}

function evidenceCachePath(root) {
  const fallbackRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
  return join(root ?? process.env.DSH_HOME ?? fallbackRoot, "storages", "modlens_evidence_cache.json");
}

/**
 * Load the durable evidence cache (attachmentId -> evidence text) into
 * process memory. A missing or damaged file must never prevent the plugin
 * loading, and in-memory entries (e.g. a test seeding the cache before
 * apply) are never overwritten by disk values.
 */
function loadEvidenceCache(root) {
  EVIDENCE_CACHE_ROOT = root ?? process.env.DSH_HOME ?? join(dirname(fileURLToPath(import.meta.url)), "../../../..");
  try {
    const parsed = JSON.parse(readFileSync(evidenceCachePath(root), "utf8"));
    if (parsed === null || typeof parsed !== "object" || !Array.isArray(parsed.entries)) return;
    for (const entry of parsed.entries) {
      if (typeof entry?.key !== "string" || entry.key === "" || typeof entry?.text !== "string") continue;
      if (VISION_EVIDENCE_CACHE.has(entry.key)) continue;
      VISION_EVIDENCE_CACHE.set(entry.key, entry.text);
    }
  } catch {
    // A missing or damaged cache file must never prevent the plugin loading.
  }
}

/**
 * Persist the evidence cache to disk, debounced and serialized: the same
 * history rides every step, so a burst of reads must collapse into one
 * write, and a failed write must never surface as an image-read failure.
 * Only the newest EVIDENCE_CACHE_LIMIT entries are kept on disk.
 */
function persistEvidenceCache() {
  if (evidenceCacheTimer !== null) return;
  evidenceCacheTimer = setTimeout(() => {
    evidenceCacheTimer = null;
    evidenceCacheChain = evidenceCacheChain.then(async () => {
      try {
        const file = evidenceCachePath(EVIDENCE_CACHE_ROOT);
        await mkdir(dirname(file), { recursive: true });
        const entries = [];
        for (const [key, text] of VISION_EVIDENCE_CACHE) {
          if (typeof key !== "string" || key === "" || typeof text !== "string") continue;
          entries.push({ key, text });
        }
        const kept = entries.length > EVIDENCE_CACHE_LIMIT ? entries.slice(entries.length - EVIDENCE_CACHE_LIMIT) : entries;
        const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
        await writeFile(temp, JSON.stringify({ entries: kept }, null, 2), { mode: 0o600 });
        await rename(temp, file);
      } catch {
        // A failed cache write must never surface as an image-read failure.
      }
    });
  }, 300);
}

function visionOnlyStatePath(root) {
  const fallbackRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
  return join(root ?? process.env.DSH_HOME ?? fallbackRoot, "storages", "modlens_guard_preferences.json");
}

function loadVisionOnly(root, config) {
  try {
    const stored = JSON.parse(readFileSync(visionOnlyStatePath(root), "utf8"))?.visionOnly;
    if (typeof stored === "boolean") config.visionOnly = stored;
  } catch {}
  STATE.visionOnly = config.visionOnly === true;
}

async function persistVisionOnly(root, enabled) {
  const file = visionOnlyStatePath(root);
  await mkdir(dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temp, JSON.stringify({ visionOnly: enabled === true }, null, 2), "utf8");
  await rename(temp, file);
}

function numberOrNull(value) {
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function loadPersistentState(root) {
  const file = persistentStatePath(root);
  if (STATE.persistPath === file) return;
  STATE.persistPath = file;
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    for (const field of PERSISTED_FIELDS) {
      if (field === "lastError") STATE[field] = typeof parsed[field] === "string" ? sanitize(parsed[field]) : "";
      else if (field === "lastOkAt" || field === "lastFailAt") STATE[field] = numberOrNull(parsed[field]);
      else if (Number.isFinite(parsed[field]) && parsed[field] >= 0) STATE[field] = Math.floor(parsed[field]);
    }
  } catch {
    // A missing or damaged diagnostics file must never prevent the plugin loading.
  }
  STATE.persistedReads = STATE.reads;
  STATE.persistedFailures = STATE.failures;
  STATE.persistedBlocks = STATE.blocks;
  STATE.persistedFailAt = STATE.lastFailAt ?? 0;
}

function persistedSnapshot() {
  return Object.fromEntries(PERSISTED_FIELDS.map((field) => [field, STATE[field]]));
}

function persistState() {
  if (STATE.persistPath === "") return;
  const file = STATE.persistPath;
  persistChain = persistChain.then(async () => {
    await mkdir(dirname(file), { recursive: true });
    let disk = {};
    try { disk = JSON.parse(await readFile(file, "utf8")); } catch {}
    const merged = {
      reads: Math.max(0, Math.floor(Number(disk.reads) || 0)) + Math.max(0, STATE.reads - (STATE.persistedReads ?? 0)),
      failures: Math.max(0, Math.floor(Number(disk.failures) || 0)) + Math.max(0, STATE.failures - (STATE.persistedFailures ?? 0)),
      blocks: Math.max(0, Math.floor(Number(disk.blocks) || 0)) + Math.max(0, STATE.blocks - (STATE.persistedBlocks ?? 0)),
      lastOkAt: Math.max(numberOrNull(disk.lastOkAt) ?? 0, STATE.lastOkAt ?? 0) || null,
      lastFailAt: Math.max(numberOrNull(disk.lastFailAt) ?? 0, STATE.lastFailAt ?? 0) || null,
      lastError: STATE.lastFailAt !== null && (disk.lastFailAt ?? 0) > (STATE.persistedFailAt ?? 0) ? sanitize(disk.lastError) : STATE.lastError
    };
    STATE.persistedReads = merged.reads;
    STATE.persistedFailures = merged.failures;
    STATE.persistedBlocks = merged.blocks;
    STATE.persistedFailAt = merged.lastFailAt;
    const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temp, JSON.stringify(merged, null, 2), "utf8");
    await rename(temp, file);
  }).catch(() => {});
}

function recordSuccess(at = Date.now()) {
  STATE.reads += 1;
  STATE.lastOkAt = at;
  persistState();
}

function recordFailure(error, at = Date.now()) {
  STATE.failures += 1;
  STATE.lastFailAt = at;
  STATE.lastError = sanitize(error);
  persistState();
}

function recordBlock() {
  STATE.blocks += 1;
  persistState();
}

/** Strip anything credential-shaped out of text that reaches the browser. */
function sanitize(text) {
  const raw = typeof text === "string" ? text : String(text ?? "");
  return raw
    .replace(/(sk|key|token|bearer)[-_a-z0-9]*\s*[:=]?\s*[A-Za-z0-9._-]{8,}/gi, "$1 <redacted>")
    .replace(/https?:\/\/[^\s"']+/gi, "<url>")
    .replace(/[A-Za-z]:[\\/][^\s"']+/g, "<path>")
    .replace(/(?:^|\s)\/[^\s"']+/g, " <path>")
    .replace(/[A-Za-z0-9_-]{32,}/g, "<redacted>")
    .slice(0, 300)
    .trim();
}

/** Locate the pinned local modlens copy and its CLI entry. */
function resolveModlens() {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = join(here, "..", "engine");
  const cli = join(root, "dist", "main.js");
  return { root, cli, present: existsSync(cli) };
}

function modlensConfigPath() {
  return join(homedir(), ".modlens", "config.json");
}

function canonicalEngine(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().toLowerCase();
  if (ENGINES.includes(trimmed)) return trimmed;
  return ENGINE_ALIASES[trimmed] ?? "";
}

function settingsKeysFor(engine) {
  const aliases = Object.keys(ENGINE_ALIASES).filter((alias) => ENGINE_ALIASES[alias] === engine);
  return [...aliases, engine];
}

function readGuardConfig() {
  try {
    const parsed = JSON.parse(readFileSync(modlensConfigPath(), "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Which engines look usable, read from the same two sources a real modlens
 * read uses: ~/.modlens/config.json, and the documented env vars. Never
 * returns a key, only whether one is present.
 */
function engineState(env = process.env) {
  let config = {};
  let configError = "";
  try {
    config = JSON.parse(readFileSync(modlensConfigPath(), "utf8"));
    if (config === null || typeof config !== "object" || Array.isArray(config)) {
      config = {};
      configError = "config file does not hold a JSON object";
    }
  } catch (error) {
    if (error?.code !== "ENOENT") configError = sanitize(error?.message ?? error);
  }
  const usable = [];
  for (const engine of ENGINES) {
    const stored = Object.assign({}, ...settingsKeysFor(engine).map((key) => config.providers?.[key] ?? {}));
    const inFile = settingsKeysFor(engine).some((key) => config.providers?.[key] !== undefined);
    const envKey = (ENGINE_ENV_KEYS[engine] ?? []).some((key) => typeof env[key] === "string" && env[key].trim() !== "");
    const hasKey = (typeof stored.apiKey === "string" && stored.apiKey !== "") || envKey;
    if (KEYLESS_ENGINES.includes(engine)) {
      // A keyless CLI engine counts only when the file names it: its binary
      // may not exist, so claiming it unconditionally would report ready for
      // an engine that cannot run.
      if (inFile) usable.push(engine);
      continue;
    }
    if (hasKey) usable.push(engine);
  }
  return { usable, pinned: canonicalEngine(config.provider), configError };
}

/** The single state the settings card and the send-guard both read. */
function currentStatus() {
  const engines = engineState();
  const siteState = openaiSiteSummary(readGuardConfig());
  if (siteState.enabled) engines.usable.unshift("openai-sites");
  const safeSiteState = {
    enabled: siteState.enabled,
    order: [...siteState.order],
    sites: siteState.sites.map(({ id, name, model, hasKey, enabled, valid }) => ({ id, name, model, hasKey, enabled, valid }))
  };
  const modlens = resolveModlens();
  let state = "ready";
  let reason = "";
  if (!STATE.pluginLoaded || !modlens.present) {
    state = "off";
    reason = "modlens bridge is not installed or not loaded";
  } else if (engines.configError !== "") {
    state = "unconfigured";
    reason = `modlens config unreadable: ${engines.configError}`;
  } else if (engines.usable.length === 0) {
    state = "unconfigured";
    reason = "no modlens vision engine is configured";
  } else if (STATE.lastFailAt !== null && (STATE.lastOkAt === null || STATE.lastFailAt > STATE.lastOkAt)) {
    state = "failing";
    reason = STATE.lastError || "the last image read failed";
  }
  return {
    state,
    reason,
    pluginLoaded: STATE.pluginLoaded && modlens.present,
    engines: engines.usable,
    pinned: engines.pinned,
    lastOkAt: STATE.lastOkAt,
    lastFailAt: STATE.lastFailAt,
    lastError: STATE.lastError,
    lastModelCheck: STATE.lastModelCheck,
    lastPreStep: STATE.lastPreStep,
    reads: STATE.reads,
    failures: STATE.failures,
    blocks: STATE.blocks,
    visionProviders: [...STATE.visionProviders],
    openaiSites: safeSiteState,
    siteRuns: STATE.lastSiteRuns,
    visionOnly: STATE.visionOnly,
    probeAt: STATE.probeAt,
    probeDurationMs: STATE.probeDurationMs,
    probeProvider: STATE.probeProvider,
    probeModel: STATE.probeModel,
    probeOk: STATE.probeOk
  };
}

/** Images hide both at top level and nested inside tool results. */
function contentHasImage(blocks) {
  return (
    Array.isArray(blocks) &&
    blocks.some((b) => b?.type === "image" || (b?.type === "tool-result" && contentHasImage(b.content)))
  );
}

/** Return only content-block shapes for diagnostics; never retain user text. */
function contentShape(blocks) {
  const types = [];
  let images = 0;
  const visit = (items) => {
    if (!Array.isArray(items)) return;
    for (const block of items) {
      if (typeof block?.type === "string") types.push(block.type);
      if (block?.type === "image") images += 1;
      if (block?.type === "tool-result") visit(block.content);
    }
  };
  visit(blocks);
  return { types, images };
}

async function convertBlocks(blocks, convertOne) {
  const out = [];
  for (const block of blocks) {
    if (block?.type === "image") {
      out.push(await convertOne(block));
    } else if (block?.type === "tool-result" && contentHasImage(block.content)) {
      out.push({ ...block, content: await convertBlocks(block.content, convertOne) });
    } else {
      out.push(block);
    }
  }
  return out;
}

/**
 * Does this model accept images natively? Only a positive declaration counts
 * as text-only: an unresolvable model or a missing inputModalities field is
 * UNKNOWN, and unknown must take the native path so a real vision model is
 * never intercepted.
 */
async function modelAcceptsImages(ctx, provider, model) {
  const at = Date.now();
  if (typeof provider !== "string" || typeof model !== "string") {
    STATE.lastModelCheck = { provider: "", model: "", modalities: null, acceptsImages: true, at, resolverError: "invalid model selection" };
    return true;
  }
  try {
    // Deliberately the untouched resolver: see admitImages(). Reading the
    // widened answer here would skip the rewrite this plugin exists to do.
    const resolve = TRUE_RESOLVERS.get(ctx.llm) ?? ctx.llm.resolveModelInfo.bind(ctx.llm);
    const info = await resolve.call(ctx.llm, provider, model);
    const modalities = info?.inputModalities;
    const acceptsImages = !Array.isArray(modalities) || modalities.includes("image");
    STATE.lastModelCheck = {
      provider: sanitize(provider),
      model: sanitize(model),
      modalities: Array.isArray(modalities) ? modalities.filter((value) => typeof value === "string") : null,
      acceptsImages,
      at,
      resolverError: ""
    };
    return acceptsImages;
  } catch (error) {
    STATE.lastModelCheck = {
      provider: sanitize(provider),
      model: sanitize(model),
      modalities: null,
      acceptsImages: true,
      at,
      resolverError: sanitize(error instanceof Error ? error.message : error)
    };
    return true;
  }
}

/**
 * Does this model DECLARE image input natively? Unlike modelAcceptsImages(),
 * unknown capability is NOT treated as multimodal here: hiding the read-image
 * tool from a possibly text-only model would take away its only way to see an
 * image, so only an explicit `image` in inputModalities hides the tool.
 */
async function modelDeclaresImages(ctx, provider, model) {
  if (typeof provider !== "string" || typeof model !== "string") return false;
  // A `modlens-<upstream>` wrapper is a TEXT-ONLY upstream wearing an image
  // declaration so sessions with image history pass admission. Its wire path
  // auto-converts attached images, but the read-image tool is still how it
  // reads a path/URL pasted as text — the tool exists FOR these models, so a
  // wrapper always keeps it. Only a natively multimodal catalog entry hides.
  if (provider.startsWith("modlens-")) return false;
  try {
    // Same untouched resolver as modelAcceptsImages(): never trust the widened
    // admission answer this plugin itself installs.
    const resolve = TRUE_RESOLVERS.get(ctx.llm) ?? ctx.llm.resolveModelInfo.bind(ctx.llm);
    const info = await resolve.call(ctx.llm, provider, model);
    const modalities = info?.inputModalities;
    return Array.isArray(modalities) && modalities.includes("image");
  } catch {
    return false;
  }
}

function resolveNodeExecutable(runtime = process, fileExists = existsSync) {
  // In Web/CLI, execPath is node. In Electron Desktop it is the Electron
  // binary, which cannot execute a Node CLI as `node script.js`.
  if (!runtime.versions.electron) return runtime.execPath;
  const roots = [runtime.env.ProgramFiles, runtime.env.ProgramW6432].filter(Boolean);
  const candidates = [
    runtime.env.NODE_EXECUTABLE,
    runtime.env.NODE,
    ...roots.flatMap((root) => [
      join(root, "nodejs", "node.exe"),
      join(root, "node", "node.exe")
    ]),
    runtime.env.LOCALAPPDATA && join(runtime.env.LOCALAPPDATA, "Programs", "node", "node.exe")
  ].filter(Boolean);
  const found = candidates.find((candidate) => fileExists(candidate));
  if (found) return found;
  throw new Error("Desktop Electron process cannot locate node.exe; set NODE_EXECUTABLE to a Node.js executable");
}

function runCli(command, args, signal) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const onAbort = () => child.kill();
    signal?.addEventListener("abort", onAbort, { once: true });
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      signal?.removeEventListener("abort", onAbort);
      reject(error);
    });
    child.on("close", (code) => {
      signal?.removeEventListener("abort", onAbort);
      resolve({ stdout, stderr, code });
    });
  });
}

function renderEvidence(value) {
  const lines = [value?.summary ?? ""];
  const text = value?.ocr?.full_text?.trim();
  if (text) lines.push("", "Transcription:", text.length > 4000 ? `${text.slice(0, 4000)}…` : text);
  const uncertainty = value?.uncertainty ?? [];
  if (uncertainty.length > 0) lines.push("", `Uncertain: ${uncertainty.join("; ")}`);
  return lines.join("\n");
}

function turnStatusKey(sessionId, turn) {
  return typeof sessionId === "string" && sessionId !== "" && Number.isInteger(turn) ? `${sessionId}:${turn}` : null;
}

function setTurnStatus(sessionId, turn, status) {
  const key = turnStatusKey(sessionId, turn);
  if (!key) return;
  TURN_STATUSES.set(key, { ...status, at: Date.now() });
  while (TURN_STATUSES.size > 64) TURN_STATUSES.delete(TURN_STATUSES.keys().next().value);
}

function currentTurnStatus(sessionId, turn) {
  const key = turnStatusKey(sessionId, turn);
  return key ? TURN_STATUSES.get(key) ?? null : null;
}

function imageCacheKey(block) {
  const attachment = block?.attachment;
  const id = attachment?.attachmentId ?? attachment?.id;
  return typeof id === "string" && id !== "" ? id : null;
}

function clearVisionEvidenceCache() {
  if (evidenceCacheTimer !== null) {
    clearTimeout(evidenceCacheTimer);
    evidenceCacheTimer = null;
  }
  VISION_EVIDENCE_CACHE.clear();
}

async function readImageBlock(ctx, block, signal, scope = {}) {
  const { sessionId, turn } = scope;
  if (turnStatusKey(sessionId, turn)) setTurnStatus(sessionId, turn, { state: "reading" });
  const cacheKey = imageCacheKey(block);
  if (cacheKey && VISION_EVIDENCE_CACHE.has(cacheKey)) {
    setTurnStatus(sessionId, turn, { state: "ready" });
    return { ok: true, text: VISION_EVIDENCE_CACHE.get(cacheKey) };
  }

  const modlens = resolveModlens();
  let dir;
  try {
    if (!modlens.present) throw new Error("modlens CLI is not installed");
    const stored = await ctx.attachments.readImage(block.attachment, signal);
    if (!stored?.data) throw new Error("attachment carried no image bytes");
    const mediaType = stored.ref?.mediaType ?? block.attachment?.mediaType;
    const ext = MEDIA_EXT[mediaType];
    if (!ext) throw new Error(`unsupported image type ${mediaType ?? "(none declared)"}`);
    dir = await mkdtemp(join(tmpdir(), "modlens-guard-"));
    const file = join(dir, `image${ext}`);
    await writeFile(file, Buffer.from(stored.data), { mode: 0o600 });
    let parsed;
    if (openaiSiteSummary(readGuardConfig()).enabled) {
      parsed = await runOpenaiSiteChain({
        config: readGuardConfig(),
        cliPath: modlens.cli,
        nodeExecutable: resolveNodeExecutable(),
        input: file,
        timeoutMs: CLI_TIMEOUT_MS,
        signal
      });
      STATE.lastSiteRuns = parsed.meta?.attempts ?? [];
    } else {
      const { stdout, stderr, code } = await runCli(
        resolveNodeExecutable(),
        [modlens.cli, "-i", file, "--timeout", String(CLI_TIMEOUT_MS)],
        signal
      );
      if (code !== 0) throw new Error((stderr || stdout).trim() || `modlens CLI exited with code ${code}`);
      const raw = stdout.trim();
      if (raw === "") throw new Error("modlens CLI returned no JSON output");
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error(`modlens CLI returned invalid JSON: ${raw.slice(-300)}`);
      }
      STATE.lastSiteRuns = parsed.meta?.attempts ?? [];
    }
    const evidence = `[Image read by the modlens vision bridge]\n${renderEvidence(parsed.result)}`;
    if (cacheKey) {
      VISION_EVIDENCE_CACHE.set(cacheKey, evidence);
      persistEvidenceCache();
    }
    setTurnStatus(sessionId, turn, { state: "ready" });
    recordSuccess();
    return { ok: true, text: evidence };
  } catch (error) {
    setTurnStatus(sessionId, turn, { state: "failed", reason: sanitize(error) });
    recordFailure(error);
    return { ok: false, text: "" };
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

function shouldWrapModel(info) {
  const modalities = info?.inputModalities;
  return Array.isArray(modalities) && !modalities.includes("image");
}

function hasImageInMessages(messages) {
  return Array.isArray(messages) && messages.some((message) => contentHasImage(message?.content));
}

function installVisionOnlyCatalog(ctx, config) {
  if (typeof ctx.llm?.listModels !== "function") return null;
  const current = ctx.llm.listModels;
  const original = current[ORIGINAL_LIST_MODELS] ?? current;
  if (TRUE_LIST_MODELS.has(ctx.llm) && TRUE_LIST_MODELS.get(ctx.llm) === original) return original;
  TRUE_LIST_MODELS.set(ctx.llm, original);
  const wrapped = async function(provider, signal) {
    if (String(provider).startsWith("modlens-")) return original.call(ctx.llm, provider, signal);
    const models = await original.call(ctx.llm, provider, signal);
    return config.visionOnly ? models.filter((model) => !shouldWrapModel(model)) : models;
  };
  Object.defineProperty(wrapped, ORIGINAL_LIST_MODELS, { value: original });
  ctx.llm.listModels = wrapped;
  if (typeof ctx.effect === "function") {
    ctx.effect(() => () => {
      if (ctx.llm.listModels === wrapped) ctx.llm.listModels = original;
      TRUE_LIST_MODELS.delete(ctx.llm);
      VISION_MODEL_SNAPSHOTS.delete(ctx.llm);
    }, "modlens-guard: vision-only model catalog");
  }
  return original;
}

function setVisionOnly(config, enabled) {
  config.visionOnly = enabled === true;
  STATE.visionOnly = config.visionOnly;
}

function probeImageBytes() {
  return Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
}

async function probeVision(config = {}) {
  const started = Date.now();
  const modlens = resolveModlens();
  let dir;
  try {
    if (!modlens.present) throw new Error("modlens CLI is not installed");
    dir = await mkdtemp(join(tmpdir(), "modlens-probe-"));
    const file = join(dir, "probe.png");
    await writeFile(file, probeImageBytes(), { mode: 0o600 });
    let parsed;
    if (openaiSiteSummary(readGuardConfig()).enabled) {
      parsed = await runOpenaiSiteChain({
        config: readGuardConfig(),
        cliPath: modlens.cli,
        nodeExecutable: resolveNodeExecutable(),
        input: file,
        timeoutMs: CLI_TIMEOUT_MS
      });
    } else {
      const { stdout, stderr, code } = await runCli(resolveNodeExecutable(), [modlens.cli, "-i", file, "--timeout", String(CLI_TIMEOUT_MS)]);
      if (code !== 0) throw new Error((stderr || stdout).trim() || `modlens CLI exited with code ${code}`);
      parsed = JSON.parse(stdout);
    }
    STATE.lastSiteRuns = parsed.meta?.attempts ?? [];
    const meta = parsed?.meta ?? {};
    STATE.probeAt = Date.now();
    STATE.probeDurationMs = Math.max(0, Date.now() - started);
    STATE.probeProvider = sanitize(parsed?.provider ?? "");
    STATE.probeModel = sanitize(meta.model ?? "");
    STATE.probeOk = true;
    STATE.lastOkAt = STATE.probeAt;
    STATE.lastError = "";
    persistState();
    return {
      ok: true,
      durationMs: STATE.probeDurationMs,
      provider: STATE.probeProvider,
      model: STATE.probeModel,
      attempts: STATE.lastAttempts
    };
  } catch (error) {
    STATE.probeAt = Date.now();
    STATE.probeDurationMs = Math.max(0, Date.now() - started);
    STATE.probeProvider = "";
    STATE.probeModel = "";
    STATE.probeOk = false;
    STATE.lastFailAt = STATE.probeAt;
    STATE.lastError = sanitize(error);
    return { ok: false, durationMs: STATE.probeDurationMs, error: STATE.lastError };
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

// dsh-llm's forAdapter() strips an assistant message's replayState when the
// message's source.provider belongs to a different adapter than the dispatch
// target. This wrapper delegates to the upstream provider (modlens-X -> X), so
// without alignment replayState (thinkingSignature etc.) gets stripped and
// reasoning_content is never replayed to thinking-mode gateways, which return
// 400 ("The reasoning_content in the thinking mode must be passed back to the
// API"). Align source.provider to the upstream for messages whose replay
// genuinely belongs to that upstream, so forAdapter keeps replayState. This is
// provider-agnostic: it covers every modlens-wrapped model regardless of
// gateway or model family (DeepSeek, GPT, Claude, Gemini, ...).
//
// Also backfill source.api/model from replayState: pi-ai's transformMessages
// keeps thinking blocks only when assistantMsg matches the dispatch target on
// provider AND api AND model ("same model"), otherwise it converts thinking to
// plain text (losing reasoning_content). Custom gateways store api/model in the
// replayState, not in source, so without backfilling the replay's thinking
// blocks would be dropped even though the provider was aligned.
function alignReplaySource(messages, upstream) {
  let changed = false;
  const aligned = messages.map((message) => {
    const source = message?.source;
    if (message?.role !== "assistant" || source?.kind !== "model") return message;
    const replayState = source.replayState;
    if (replayState === undefined || replayState.provider !== upstream) return message;
    const api = source.api ?? replayState.api;
    const model = source.model ?? replayState.model;
    const next = { ...source, provider: upstream };
    if (api !== undefined && api !== source.api) next.api = api;
    if (model !== undefined && model !== source.model) next.model = model;
    const sourceChanged = next.provider !== source.provider || next.api !== source.api || next.model !== source.model;
    if (!sourceChanged) return message;
    changed = true;
    return { ...message, source: next };
  });
  return changed ? aligned : messages;
}

// DeepSeek thinking-mode gateways (this one is strict about it: nova) require
// EVERY assistant message in the history to carry reasoning_content, including
// pure tool-call turns that produced no thinking block. pi-ai only emits a
// reasoning_content fallback when compat.requiresReasoningContentOnAssistantMessages
// is set, which its detectCompat() gates on provider/baseUrl === deepseek —
// false for custom proxies, and the DSH config schema cannot force that flag.
// The one path that always emits reasoning_content is a same-model assistant
// message carrying a non-empty thinking block with a signature. Inject a
// zero-width-space reasoning block (invisible, non-empty so pi-ai keeps it) on
// assistant messages that have no reasoning block, so the gateway sees an
// explicit reasoning_content on every turn. Provider-agnostic: harmless for
// gateways that don't enforce the rule. Block shape is the dsh layer's
// `{ type: "reasoning", text }` — dsh-llm-pi-ai converts that to pi-ai's
// `{ type: "thinking", thinking }` before serialization.
const REASONING_PLACEHOLDER = "\u200b";
function injectReasoningPlaceholder(messages) {
  let changed = false;
  const injected = messages.map((message) => {
    if (message?.role !== "assistant") return message;
    const content = Array.isArray(message.content) ? message.content : [];
    if (content.some((block) => block?.type === "reasoning")) return message;
    if (!content.some((block) => block?.type === "toolCall") && !content.some((block) => block?.type === "text")) return message;
    const next = {
      ...message,
      content: [
        { type: "reasoning", text: REASONING_PLACEHOLDER, thinkingSignature: "reasoning_content" },
        ...content
      ]
    };
    // pi-ai's replayedAssistant() (dsh-llm-pi-ai) validates replayState.blocks
    // one-to-one against assistant content ("block count does not match
    // assistant content"). Prepend the matching reasoning replay block so the
    // count and indices stay in sync and the signature replays as
    // reasoning_content for strict thinking-mode gateways.
    const source = message?.source;
    const replayState = source?.replayState;
    if (source && replayState && Array.isArray(replayState.blocks)) {
      next.source = {
        ...source,
        replayState: {
          ...replayState,
          blocks: [
            { type: "reasoning", thinkingSignature: "reasoning_content" },
            ...replayState.blocks
          ]
        }
      };
    }
    changed = true;
    return next;
  });
  return changed ? injected : messages;
}

function registerVisionAdapter(ctx, config = {}, listUpstream = ctx.llm?.listModels) {
  if (typeof ctx.llm?.registerAdapter !== "function" || typeof ctx.llm?.stream !== "function") return;
  const owned = new Set();
  const register = (upstream, providerId, displayName) => {
    if (owned.has(providerId)) return;
    const withVision = (info) => ({ ...info, provider: providerId, inputModalities: ["text", "image"] });
    try {
      ctx.llm.registerAdapter([providerId], {
        providerInfo(provider) { return { id: provider, name: displayName }; },
        providerRetryPolicy() { return undefined; },
        async listModels(_provider, signal) {
          const models = await listUpstream.call(ctx.llm, upstream, signal);
          return models.filter((model) => shouldWrapModel(model)).map((model) => ({
            ...withVision(model),
            name: `${model.name ?? model.id} (ModLens)`
          }));
        },
        async resolveModel(_provider, model, signal) {
          const resolve = TRUE_RESOLVERS.get(ctx.llm) ?? ctx.llm.resolveModelInfo;
          const info = await resolve.call(ctx.llm, upstream, model, signal);
          if (!shouldWrapModel({ id: model, inputModalities: ["text"] })) {
            throw new Error(`model "${model}" is outside the ModLens wrapper scope`);
          }
          return { ...withVision(info), id: model };
        },
        stream(options) {
          return (async function* () {
            const messages = await convertForVisionWire(ctx, options.messages, options.signal, {
              sessionId: options.sessionId,
              turn: SESSION_TURNS.get(options.sessionId)
            });
            yield* ctx.llm.stream({ ...options, provider: upstream, messages: injectReasoningPlaceholder(alignReplaySource(messages, upstream)) });
          })();
        }
      });
      owned.add(providerId);
      STATE.visionProviders = [...owned].sort();
    } catch (error) {
      if (!/already|duplicate/i.test(String(error))) ctx.logger?.warn?.(`modlens-guard: vision provider registration skipped: ${sanitize(error)}`);
    }
  };
  const discover = async () => {
    // Desktop rc.6 loads plugins before the llm service; defer until adapters-updated fires.
    if (!ctx || !ctx.llm || typeof ctx.llm.listProviders !== "function") return;
    for (const info of ctx.llm.listProviders()) {
      const upstream = info?.id;
      if (!upstream || upstream.startsWith("modlens-") || typeof ctx.llm.listModels !== "function") continue;
      let models;
      try { models = await listUpstream.call(ctx.llm, upstream); } catch { continue; }
      if (models.some((model) => shouldWrapModel(model))) {
        register(upstream, `modlens-${upstream}`, `${info.name ?? upstream} (ModLens)`);
      }
    }
  };
  void discover();
  ctx.on?.("llm/adapters-updated", () => { void discover(); });
}

async function convertForVisionWire(ctx, messages, signal, scope) {
  if (!hasImageInMessages(messages)) return messages;
  const out = [];
  for (const message of messages) {
    if (!contentHasImage(message?.content)) { out.push(message); continue; }
    const content = await convertBlocks(message.content, async (block) => {
      const read = await readImageBlock(ctx, block, signal, scope);
      if (!read.ok) {
        recordBlock();
        throw new Error(`ModLens could not read an image: ${STATE.lastError || "bridge failure"}`);
      }
      return { type: "text", text: read.text };
    });
    out.push({ ...message, content });
  }
  return out;
}

const BLOCK_HINT =
  "[modlens unavailable] The current model accepts text only and this message carries an image, " +
  "but the modlens vision bridge could not read it. Tell the user the image was NOT read, state the " +
  "reason below, and do not guess at the image contents. Reason: ";

function apply(ctx, config = {}) {
  ACTIVE_CONFIG = config;
  STATE.openaiSites = openaiSiteSummary(config);
  loadPersistentState(config.root);
  loadVisionOnly(config.root, config);
  loadEvidenceCache(config.root);
  STATE.pluginLoaded = resolveModlens().present;
  const originalListModels = installVisionOnlyCatalog(ctx, config);
  registerVisionAdapter(ctx, config, originalListModels ?? ctx.llm?.listModels);

  STATE.cliPath = resolveModlens().cli;

  // Re-open the host's pre-agent image gates so routing can happen at all.
  // Scoped to this plugin's lifetime; unloading restores the original.
  if (ctx.llm && typeof ctx.llm.resolveModelInfo === "function" && !TRUE_RESOLVERS.has(ctx.llm)) {
    const original = ctx.llm.resolveModelInfo;
    TRUE_RESOLVERS.set(ctx.llm, original);
    ctx.llm.resolveModelInfo = async (provider, model, signal) => {
      const info = await original.call(ctx.llm, provider, model, signal);
      const modalities = info?.inputModalities;
      // Widen only a MODEL THAT DECLARED text-only. An absent declaration is
      // already permissive at both gates, and a native model needs no help.
      if (!Array.isArray(modalities) || modalities.includes("image")) return info;
      if (!admitImages()) return info;
      return { ...info, inputModalities: [...modalities, "image"] };
    };
    if (typeof ctx.effect === "function") {
      ctx.effect(() => () => {
        ctx.llm.resolveModelInfo = original;
        TRUE_RESOLVERS.delete(ctx.llm);
      }, "modlens-guard: image admission override");
    }
  }

  // Capture the model selected for this assembled request. Agent options can
  // remain stale after a session-local model switch; prompt assembly is the
  // authoritative source used by the host request layer.
  const readImageToolName = config.toolName || "modlens_read_image";
  ctx.on("system-prompt/assemble", async (assembly, context, next) => {
    const assembled = await next();
    const agent = context?.agent;
    const provider = assembled.variables?.provider;
    const model = assembled.variables?.model;
    if (typeof provider === "string" && typeof model === "string") {
      if (agent) ASSEMBLED_MODELS.set(agent, { provider, model });
      // The read-image tool exists so TEXT-ONLY models can see images. A
      // NATIVELY multimodal model must not even see it — calling it is pure
      // waste. Two keep-it exceptions mirror the router's conservative
      // defaults: an unknown capability, and a `modlens-*` wrapper (a
      // text-only upstream wearing an image declaration so image-history
      // sessions pass admission; the tool is still how it reads a path/URL
      // pasted as text).
      if (Array.isArray(assembled.tools) && (await modelDeclaresImages(ctx, provider, model))) {
        const filtered = assembled.tools.filter((tool) => tool?.name !== readImageToolName);
        if (filtered.length !== assembled.tools.length) {
          return { ...assembled, tools: filtered };
        }
      }
    }
    return assembled;
  });

  // Route images by the current model's capability, at request time only.
  ctx.on("agent/pre-step", async (payload, next) => {
    const sessionId = typeof payload.agent?.id === "string" ? payload.agent.id : "";
    const turn = Number.isInteger(payload.turn) ? payload.turn : null;
    if (turn !== null && sessionId !== "") SESSION_TURNS.set(sessionId, turn);
    const decision = await next();
    const observedMessages = Array.isArray(decision.messages) ? decision.messages : [];
      const shapes = observedMessages.map((message) => contentShape(message.content));
      STATE.lastPreStep = {
        at: Date.now(),
        decision: typeof decision.kind === "string" ? decision.kind : "unknown",
        messages: shapes.length,
        blockTypes: shapes.flatMap((shape) => shape.types),
        imageBlocks: shapes.reduce((total, shape) => total + shape.images, 0)
      };
      if (decision.kind !== "enter") return decision;
      if (!observedMessages.some((message) => contentHasImage(message.content))) return decision;

      const options = payload.agent?.options ?? {};
      const selected = ASSEMBLED_MODELS.get(payload.agent) ?? options;
      if (await modelAcceptsImages(ctx, selected.provider, selected.model)) return decision;

      const status = currentStatus();
      if (status.state !== "ready") {
        if (turnStatusKey(sessionId, turn)) setTurnStatus(sessionId, turn, { state: "failed", reason: status.reason || status.state });
        recordBlock();
        const messages = [];
        for (const message of decision.messages) {
          if (!contentHasImage(message.content)) {
            messages.push(message);
            continue;
          }
          const content = await convertBlocks(message.content, () => ({
            type: "text",
            text: `${BLOCK_HINT}${status.reason || status.state}`
          }));
          messages.push({ ...message, content });
        }
        return { kind: "enter", messages };
      }

      const messages = [];
      for (const message of decision.messages) {
        if (!contentHasImage(message.content)) {
          messages.push(message);
          continue;
        }
        const content = await convertBlocks(message.content, async (block) => {
          const read = await readImageBlock(ctx, block, payload.signal, { sessionId, turn });
          if (read.ok) return { type: "text", text: read.text };
          recordBlock();
          return { type: "text", text: `${BLOCK_HINT}${STATE.lastError || "image read failed"}` };
        });
        messages.push({ ...message, content });
      }
    return { kind: "enter", messages };
  });

  // Status route for the settings card and the client-side send guard.
  if (typeof ctx.inject === "function") {
    ctx.inject(["webServer"], (scope) => {
      scope.effect(
        () =>
          scope.webServer.register({
            kind: "prefix",
            path: "/modlens-guard",
            handler: async (req, res) => {
              const url = new URL(req.url ?? "/", "http://x");
              const send = (code, body) => {
                res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
                res.end(JSON.stringify(body));
              };
              if (req.method === "GET" && url.pathname === "/modlens-guard/turn-status") {
                const turn = Number(url.searchParams.get("turn"));
                const sessionId = url.searchParams.get("sessionId") ?? "";
                send(200, { ok: true, status: currentTurnStatus(sessionId, turn) });
                return;
              }
              if (req.method === "GET" && url.pathname === "/modlens-guard/status") {
                send(200, { ok: true, status: currentStatus() });
                return;
              }
              if (req.method === "POST" && url.pathname === "/modlens-guard/probe") {
                const result = await probeVision();
                send(result.ok ? 200 : 503, { ok: result.ok, result, status: currentStatus() });
                return;
              }
              if (req.method === "POST" && url.pathname === "/modlens-guard/vision-only") {
                let bodyText = "";
                for await (const chunk of req) bodyText += chunk;
                const body = JSON.parse(bodyText || "{}");
                config.visionOnly = body.enabled === true;
                STATE.visionOnly = config.visionOnly;
                await persistVisionOnly(config.root, config.visionOnly);
                ctx.emit?.("llm/adapters-updated");
                send(200, { ok: true, status: currentStatus() });
                return;
              }
              if (req.method === "POST" && url.pathname === "/modlens-guard/check-model") {
                try {
                  let bodyText = "";
                  for await (const chunk of req) bodyText += chunk;
                  const body = JSON.parse(bodyText || "{}");
                  const acceptsImages = await modelAcceptsImages(ctx, body.provider, body.model);
                  send(200, { ok: true, acceptsImages, status: currentStatus() });
                } catch (error) {
                  send(400, { ok: false, error: sanitize(error) });
                }
                return;
              }
              send(404, { ok: false, error: "not found" });
            }
          }),
        "modlens-guard: status route"
      );
    });
  }
}

export {
  name,
  apply,
  inject,
  sanitize,
  engineState,
  currentStatus,
  resolveModlens,
  contentHasImage,
  contentShape,
  resolveNodeExecutable,
  admitImages,
  shouldAdmitForStack,
  modelAcceptsImages,
  modelDeclaresImages,
  readImageBlock,
  persistentStatePath,
  loadPersistentState,
  persistedSnapshot,
  registerVisionAdapter,
  convertForVisionWire,
  currentTurnStatus,
  setTurnStatus,
  imageCacheKey,
  clearVisionEvidenceCache,
  loadEvidenceCache,
  persistEvidenceCache,
  evidenceCachePath,
  VISION_EVIDENCE_CACHE,
  STATE
};



