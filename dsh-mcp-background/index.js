// dsh-mcp-background —— non-blocking MCP bridge with plugin-owned management API.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ListToolsResultSchema, ToolListChangedNotificationSchema } from "@modelcontextprotocol/sdk/types.js";
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const name = "mcp-background";
const inject = ["tools", "webServer"];
const activeNames = new WeakMap();
const registries = new WeakMap();
const MAX_TOOL_NAME = 64;
const ACTIONS = new Set(["connect", "disconnect", "reconnect", "enable", "disable"]);

function childEnv(extra) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (/^(?:DSH_|ANTHROPIC_|OPENAI_)/i.test(key)) delete env[key];
  return { ...env, ...(extra ?? {}) };
}

function createTransport(config) {
  if (config.transport === "stdio") return new StdioClientTransport({ command: config.command, args: config.args ?? [], env: childEnv(config.env), cwd: config.cwd });
  if (config.transport === "streamable-http") return new StreamableHTTPClientTransport(new URL(config.url), { requestInit: { headers: config.headers ?? {} } });
  throw new Error(`mcp-background(${config.serverName}): unsupported transport ${String(config.transport)}`);
}

function publicName(serverName, rawName) {
  const raw = `mcp__${serverName}__${rawName}`;
  const normalized = raw.replace(/[^A-Za-z0-9_-]/g, "_");
  if (normalized === raw && normalized.length <= MAX_TOOL_NAME) return normalized;
  const hash = createHash("sha256").update(`${serverName}\0${rawName}`).digest("hex").slice(0, 12);
  return `${normalized.slice(0, MAX_TOOL_NAME - hash.length - 1)}_${hash}`;
}

function textOf(content, toolName) {
  const parts = [];
  for (const item of content ?? []) {
    if (item?.type === "text" && typeof item.text === "string") parts.push(item.text);
    else if (item?.type === "image") parts.push(`[image: ${item.mimeType ?? "unknown"}, content discarded]`);
    else if (item?.type === "audio") parts.push(`[audio: ${item.mimeType ?? "unknown"}, content discarded]`);
    else parts.push("[unsupported MCP content]");
  }
  return parts.join("\n") || `(${toolName} returned no text content)`;
}

async function listTools(client) {
  const tools = [];
  let cursor;
  do {
    const response = await client.request({ method: "tools/list", ...(cursor === undefined ? {} : { params: { cursor } }) }, ListToolsResultSchema);
    tools.push(...response.tools);
    cursor = response.nextCursor;
  } while (cursor !== undefined);
  return tools;
}

function safeError(error) {
  const text = String(error instanceof Error ? error.message : error)
    .replace(/https?:\/\/\S+/gi, "[address]")
    .replace(/(?:Bearer\s+|token[=:]\s*|key[=:]\s*)[^\s,;]+/gi, "[credential]")
    .replace(/[A-Za-z0-9_-]{24,}/g, "[redacted]");
  return text.slice(0, 180) || "Connection failed";
}

async function readDisabled(file) {
  try {
    const value = JSON.parse(await readFile(file, "utf8"));
    return new Set(Array.isArray(value?.serverNames) ? value.serverNames.filter((x) => typeof x === "string") : []);
  } catch { return new Set(); }
}

async function writeDisabled(file, names) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temp, JSON.stringify({ serverNames: [...names].sort() }, null, 2), "utf8");
  await rename(temp, file);
}

function registryFor(root, disabledFile) {
  let registry = registries.get(root);
  if (registry) return registry;
  registry = { controllers: new Map(), disabledFile, disabled: new Set(), ready: readDisabled(disabledFile).then((names) => { registry.disabled = names; return names; }) };
  registries.set(root, registry);
  return registry;
}

function startBackgroundConnection(ctx, config, registry) {
  const label = `mcp-background(${config.serverName})`;
  const reconnect = { enabled: config.reconnect?.enabled ?? true, initialDelayMs: config.reconnect?.initialDelayMs ?? 500, maxDelayMs: config.reconnect?.maxDelayMs ?? 30000, maxAttempts: config.reconnect?.maxAttempts ?? 10 };
  const timeoutMs = config.toolCallTimeoutMs ?? 60000;
  let disposed = false;
  let manuallyStopped = false;
  let client;
  let disposers = new Map();
  let timer;
  let attempts = 0;
  let syncing = Promise.resolve();
  let state = "connecting";
  let lastError = null;
  let updatedAt = Date.now();
  const touch = (next, error = null) => { state = next; lastError = error; updatedAt = Date.now(); };
  const clearTools = () => { for (const dispose of disposers.values()) dispose(); disposers = new Map(); };
  const snapshot = () => ({ serverName: config.serverName, transport: config.transport, state, disabled: registry.disabled.has(config.serverName), attempts, tools: [...disposers.keys()], lastError, updatedAt });
  const sync = async (generation) => {
    const next = new Map();
    for (const tool of await listTools(generation)) {
      const toolName = publicName(config.serverName, tool.name);
      if (next.has(toolName)) throw new Error(`server listed duplicate tool ${tool.name}`);
      next.set(toolName, { name: toolName, description: tool.description ?? "", parameters: tool.inputSchema, output: { schema: { type: "object", properties: { content: { type: "array", items: {} }, structuredContent: {} }, required: ["content"], additionalProperties: false }, render: (_args, value) => [{ type: "text", text: textOf(value.content, tool.name) }] }, async execute(args, exec) {
        const result = await generation.callTool({ name: tool.name, arguments: args && typeof args === "object" ? args : {} }, undefined, { signal: exec.signal, timeout: timeoutMs });
        const content = Array.isArray(result.content) ? result.content : [{ type: "text", text: JSON.stringify(result.toolResult ?? "(no output)") }];
        if (result.isError === true) throw new Error(textOf(content, tool.name));
        return { content, ...(result.structuredContent === undefined ? {} : { structuredContent: result.structuredContent }) };
      } });
    }
    if (disposed || client !== generation) return;
    clearTools();
    try { for (const [toolName, definition] of next) disposers.set(toolName, ctx.tools.register(definition)); } catch (error) { clearTools(); throw error; }
  };
  const close = async () => { if (timer !== undefined) clearTimeout(timer); timer = undefined; clearTools(); const closing = client; client = undefined; try { await closing?.close(); } catch {} };
  const schedule = () => {
    if (disposed || manuallyStopped || registry.disabled.has(config.serverName) || !reconnect.enabled) return;
    attempts += 1;
    if (attempts > reconnect.maxAttempts) { clearTools(); touch("failed", `Stopped after ${reconnect.maxAttempts} attempts`); ctx.logger.error(`${label}: gave up after ${reconnect.maxAttempts} failed attempts`); return; }
    const delay = Math.min(reconnect.maxDelayMs, reconnect.initialDelayMs * 2 ** (attempts - 1));
    touch("backoff"); ctx.logger.warn(`${label}: reconnecting in ${delay}ms (attempt ${attempts}/${reconnect.maxAttempts})`);
    timer = setTimeout(connect, delay); timer.unref?.();
  };
  const connect = async () => {
    if (disposed || manuallyStopped || registry.disabled.has(config.serverName)) return;
    if (timer !== undefined) clearTimeout(timer); timer = undefined;
    touch("connecting");
    const generation = new Client({ name: "dsh-mcp-background", version: "1.1.0" }, { capabilities: {} });
    client = generation;
    generation.onclose = () => { if (!disposed && client === generation) { clearTools(); client = undefined; schedule(); } };
    generation.setNotificationHandler(ToolListChangedNotificationSchema, async () => { syncing = syncing.then(() => sync(generation)).catch((error) => { touch("connected", safeError(error)); ctx.logger.error(`${label}: tool re-sync failed: ${safeError(error)}`); }); await syncing; });
    try {
      await generation.connect(createTransport(config)); await sync(generation);
      if (disposed || client !== generation) return;
      attempts = 0; touch("connected"); ctx.logger.info(`${label}: connected and registered ${disposers.size} tools`);
    } catch (error) {
      if (!disposed && client === generation) { const message = safeError(error); ctx.logger.warn(`${label}: connection failed: ${message}`); touch("failed", message); client = undefined; try { await generation.close(); } catch {} schedule(); }
    }
  };
  const controller = {
    snapshot,
    async connect() { manuallyStopped = false; await close(); void connect(); },
    async disconnect() { manuallyStopped = true; await close(); touch("stopped"); },
    async reconnect() { manuallyStopped = false; await close(); void connect(); },
    async setDisabled(disabled) { registry.disabled[disabled ? "add" : "delete"](config.serverName); await writeDisabled(registry.disabledFile, registry.disabled); if (disabled) { manuallyStopped = true; await close(); touch("disabled"); } else { manuallyStopped = false; void connect(); } },
    async dispose() { disposed = true; await close(); await syncing.catch(() => {}); }
  };
  registry.controllers.set(config.serverName, controller);
  registry.ready.then(() => { if (registry.disabled.has(config.serverName)) touch("disabled"); else void connect(); });
  return controller;
}

function publicStatus(registry) {
  return [...registry.controllers.values()].map((controller) => controller.snapshot()).sort((a, b) => a.serverName.localeCompare(b.serverName));
}

function installRoutes(ctx, registry) {
  if (registry.routesInstalled || ctx.webServer === undefined) return;
  registry.routesInstalled = true;
  ctx.effect(() => ctx.webServer.register({ kind: "prefix", path: "/mcp-manager", handler: async (req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    const send = (code, body) => { res.writeHead(code, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }); res.end(JSON.stringify(body)); };
    try {
      await registry.ready;
      if (req.method === "GET" && url.pathname === "/mcp-manager/status") return send(200, { servers: publicStatus(registry) });
      if (req.method !== "POST" || url.pathname !== "/mcp-manager/action") return send(404, { ok: false, error: "not found" });
      let raw = ""; for await (const chunk of req) raw += chunk;
      let body; try { body = JSON.parse(raw || "{}"); } catch { return send(400, { ok: false, error: "invalid json body" }); }
      if (typeof body?.serverName !== "string" || !ACTIONS.has(body?.action)) return send(400, { ok: false, error: "invalid action request" });
      const controller = registry.controllers.get(body.serverName);
      if (!controller) return send(404, { ok: false, error: "unknown MCP server" });
      if (body.action === "connect") await controller.connect();
      if (body.action === "disconnect") await controller.disconnect();
      if (body.action === "reconnect") await controller.reconnect();
      if (body.action === "enable") await controller.setDisabled(false);
      if (body.action === "disable") await controller.setDisabled(true);
      return send(200, { ok: true, server: controller.snapshot() });
    } catch (error) { return send(500, { ok: false, error: safeError(error) }); }
  }}), "mcp-background: manager routes");
}

async function apply(ctx, config = {}) {
  if (typeof config.serverName !== "string" || !/^[A-Za-z0-9_-]{1,32}$/.test(config.serverName)) throw new Error("mcp-background: serverName must contain 1-32 letters, numbers, underscores, or hyphens");
  let names = activeNames.get(ctx.root); if (!names) activeNames.set(ctx.root, names = new Set());
  if (names.has(config.serverName)) throw new Error(`mcp-background: duplicate serverName ${config.serverName}`);
  names.add(config.serverName); ctx.effect(() => () => names.delete(config.serverName), "mcp-background: server name");
  const root = config.root ?? process.env.DSH_HOME ?? path.join(os.homedir(), ".dsh");
  const registry = registryFor(ctx.root, path.join(root, "storages", "mcp_background_disabled.json"));
  installRoutes(ctx, registry);
  const controller = startBackgroundConnection(ctx, config, registry);
  ctx.effect(() => async () => { registry.controllers.delete(config.serverName); await controller.dispose(); }, "mcp-background: connection");
}

export { name, apply, inject, safeError };
