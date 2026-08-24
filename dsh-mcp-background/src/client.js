// dsh-mcp-background —— client settings and /mcp command UI.
import { useCallback, useEffect, useState } from "react";

const NS = "settings.mcp-manager";
const css = {
  section: { maxWidth: 760, color: "var(--dsw-alias-label-primary, #1f2329)", fontFamily: "inherit" },
  hero: { display: "flex", alignItems: "center", gap: 14, padding: "4px 0 18px" },
  icon: { width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: 14, background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "white", flex: "0 0 auto" },
  heroTitle: { margin: 0, fontSize: 20, lineHeight: 1.2, fontWeight: 700 },
  heroMeta: { margin: "5px 0 0", fontSize: 13, color: "var(--dsw-alias-label-tertiary, #6b7280)" },
  lead: { fontSize: 13, lineHeight: 1.6, color: "var(--dsw-alias-label-tertiary, #6b7280)", margin: "0 0 16px" },
  summary: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  stat: { padding: "7px 11px", borderRadius: 10, background: "var(--dsw-alias-fill-subtle, #f7f8fa)", fontSize: 12, color: "var(--dsw-alias-label-secondary, #4b5563)" },
  card: { border: "1px solid var(--dsw-alias-border-strong, #e5e7eb)", borderRadius: 12, marginBottom: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(31,35,41,.04)" },
  cardHead: { display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "var(--dsw-alias-fill-subtle, #f7f8fa)" },
  name: { fontSize: 15, fontWeight: 650, flex: "1 1 auto" },
  transport: { fontSize: 11, color: "var(--dsw-alias-label-tertiary, #6b7280)" },
  badge: { fontSize: 11, padding: "4px 9px", borderRadius: 999, fontWeight: 600 },
  body: { padding: "12px 16px 15px" },
  info: { display: "flex", flexWrap: "wrap", gap: "8px 18px", fontSize: 12, color: "var(--dsw-alias-label-secondary, #4b5563)" },
  tools: { margin: "12px 0 0", padding: "10px 12px", borderRadius: 8, background: "var(--dsw-alias-fill-subtle, #fafbfc)", fontSize: 12, lineHeight: 1.7, wordBreak: "break-word" },
  actions: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 13 },
  button: { padding: "6px 12px", borderRadius: 7, border: "1px solid var(--dsw-alias-border-strong, #d1d5db)", background: "var(--dsw-alias-fill, #fff)", color: "inherit", fontSize: 12, cursor: "pointer" },
  primary: { background: "var(--dsw-alias-accent, #2563eb)", borderColor: "var(--dsw-alias-accent, #2563eb)", color: "#fff" },
  danger: { color: "#dc2626", borderColor: "rgba(220,38,38,.35)" },
  empty: { padding: 16, borderRadius: 10, background: "var(--dsw-alias-fill-subtle, #f7f8fa)", fontSize: 13, color: "var(--dsw-alias-label-tertiary, #6b7280)" },
  error: { fontSize: 12, color: "#dc2626" },
  status: { fontSize: 12, color: "var(--dsw-alias-label-secondary, #4b5563)" }
};

function McpGlyph({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M7 5.5a3 3 0 1 1 4.2 4.2L7 14a3 3 0 1 1-4.2-4.2l4.1-4.1Z" /><path d="m10.5 13.5 3.3-3.3" /><path d="M13 5.5a3 3 0 1 1 4.2 4.2l-2 2" /><path d="M10 18.5a3 3 0 1 1-4.2-4.2l2-2" /><path d="m14.5 13.5 2.3 2.3a3 3 0 1 1-4.2 4.2l-2.1-2.1" /></svg>;
}

const colors = { connected: ["#047857", "rgba(16,185,129,.13)"], connecting: ["#2563eb", "rgba(37,99,235,.12)"], backoff: ["#b45309", "rgba(245,158,11,.15)"], failed: ["#dc2626", "rgba(220,38,38,.12)"], stopped: ["#6b7280", "rgba(107,114,128,.13)"], disabled: ["#6b7280", "rgba(107,114,128,.13)"] };

function StatusBadge({ state, t }) {
  const [color, background] = colors[state] ?? colors.failed;
  return <span style={{ ...css.badge, color, background }}>{t(`state.${state}`)}</span>;
}

function ManagerSection({ t }) {
  const [status, setStatus] = useState("loading");
  const [servers, setServers] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [expanded, setExpanded] = useState({});
  const load = useCallback(async () => {
    try { const res = await fetch("/mcp-manager/status", { cache: "no-store" }); if (!res.ok) throw new Error(`HTTP ${res.status}`); const body = await res.json(); setServers(body.servers ?? []); setStatus("ready"); setError(null); }
    catch (e) { setStatus("error"); setError(e instanceof Error ? e.message : String(e)); }
  }, []);
  useEffect(() => { load(); const timer = setInterval(load, 4000); return () => clearInterval(timer); }, [load]);
  const action = async (serverName, actionName) => {
    setBusy(`${serverName}:${actionName}`);
    try { const res = await fetch("/mcp-manager/action", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ serverName, action: actionName }) }); const body = await res.json(); if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  };
  if (status === "loading") return <div style={css.status}>{t("loading")}</div>;
  if (status === "error" && servers.length === 0) return <div><div style={css.error}>{t("loadFailed")}: {error}</div><button type="button" style={{ ...css.button, ...css.primary, marginTop: 10 }} onClick={load}>{t("reload")}</button></div>;
  const connected = servers.filter((s) => s.state === "connected").length;
  return <div style={css.section}>
    <div style={css.hero}><div style={css.icon}><McpGlyph size={25} /></div><div><h1 style={css.heroTitle}>{t("nav")}</h1><p style={css.heroMeta}>{t("heroMeta")}</p></div></div>
    <p style={css.lead}>{t("lead")}</p>
    <div style={css.summary}><span style={css.stat}>{t("total", { n: servers.length })}</span><span style={css.stat}>{t("connected", { n: connected })}</span><span style={css.stat}>{t("toolsTotal", { n: servers.reduce((n, s) => n + s.tools.length, 0) })}</span></div>
    {error && <div style={{ ...css.error, marginBottom: 10 }}>{error}</div>}
    {servers.length === 0 && <div style={css.empty}>{t("empty")}</div>}
    {servers.map((server) => { const open = expanded[server.serverName] === true; const isBusy = (actionName) => busy === `${server.serverName}:${actionName}`; return <div key={server.serverName} style={css.card}>
      <div style={css.cardHead}><McpGlyph size={19} /><span style={css.name}>{server.serverName}</span><span style={css.transport}>{server.transport}</span><StatusBadge state={server.state} t={t} /></div>
      <div style={css.body}><div style={css.info}><span>{t("toolCount", { n: server.tools.length })}</span><span>{t("attempts", { n: server.attempts })}</span>{server.lastError && <span style={css.error} title={server.lastError}>{server.lastError}</span>}</div>
        {open && <div style={css.tools}><strong>{t("tools")}</strong>{server.tools.length ? <div>{server.tools.join(" · ")}</div> : <div>{t("noTools")}</div>}</div>}
        <div style={css.actions}><button type="button" style={css.button} onClick={() => setExpanded((v) => ({ ...v, [server.serverName]: !open }))}>{open ? t("hideTools") : t("showTools")}</button>{server.state === "connected" ? <button type="button" style={{ ...css.button, ...css.danger }} disabled={busy !== null} onClick={() => action(server.serverName, "disconnect")}>{isBusy("disconnect") ? t("working") : t("disconnect")}</button> : <button type="button" style={{ ...css.button, ...css.primary }} disabled={busy !== null} onClick={() => action(server.serverName, server.state === "disabled" ? "enable" : "connect")}>{isBusy(server.state === "disabled" ? "enable" : "connect") ? t("working") : server.state === "disabled" ? t("enable") : t("connect")}</button>}{server.state !== "disabled" && <button type="button" style={css.button} disabled={busy !== null} onClick={() => action(server.serverName, "reconnect")}>{isBusy("reconnect") ? t("working") : t("reconnect")}</button>}{server.state === "disabled" ? <button type="button" style={css.button} disabled={busy !== null} onClick={() => action(server.serverName, "enable")}>{isBusy("enable") ? t("working") : t("enable")}</button> : <button type="button" style={css.button} disabled={busy !== null} onClick={() => action(server.serverName, "disable")}>{isBusy("disable") ? t("working") : t("disable")}</button>}</div>
      </div></div>; })}
    <div style={css.actions}><button type="button" style={css.button} onClick={load}>{t("reload")}</button></div>
  </div>;
}

const inject = ["slots", "locale"];

function apply(ctx) {
  const dict = { zh: { nav: "MCP 管理", heroMeta: "连接状态、工具与后台服务控制", lead: "管理已配置的 MCP 服务。状态接口只返回脱敏后的连接信息，不会显示命令、地址或凭据。", total: "服务 {n}", connected: "已连接 {n}", toolsTotal: "工具 {n}", toolCount: "{n} 个工具", attempts: "重试 {n}", tools: "可用工具", noTools: "暂无已发现工具", showTools: "查看工具", hideTools: "收起工具", connect: "连接", disconnect: "断开", reconnect: "重连", enable: "启用", disable: "禁用", working: "处理中…", reload: "刷新状态", loading: "正在读取 MCP 状态…", loadFailed: "状态读取失败", empty: "当前没有 MCP 服务。", "state.connected": "已连接", "state.connecting": "连接中", "state.backoff": "等待重连", "state.failed": "连接失败", "state.stopped": "已断开", "state.disabled": "已禁用" }, en: { nav: "MCP Manager", heroMeta: "Connection status, tools, and service controls", lead: "Manage configured MCP services. The status API exposes only redacted connection data, never commands, addresses, or credentials.", total: "{n} services", connected: "{n} connected", toolsTotal: "{n} tools", toolCount: "{n} tools", attempts: "{n} retries", tools: "Available tools", noTools: "No discovered tools", showTools: "Show tools", hideTools: "Hide tools", connect: "Connect", disconnect: "Disconnect", reconnect: "Reconnect", enable: "Enable", disable: "Disable", working: "Working…", reload: "Refresh", loading: "Reading MCP status…", loadFailed: "Status failed", empty: "No MCP services configured.", "state.connected": "Connected", "state.connecting": "Connecting", "state.backoff": "Waiting to retry", "state.failed": "Failed", "state.stopped": "Disconnected", "state.disabled": "Disabled" } };
  ctx.effect(() => ctx.locale.register(NS, dict), "mcp-background: client dictionaries");
  const t = ctx.locale.bind(NS);
  const injected = () => ({ t });
  ctx.slots.inject("settings.section", () => ctx.slots.register({ name: "settings.section", id: "mcp-manager", order: 10, label: () => t("nav"), inject: injected }, ManagerSection));
  ctx.inject(["commandUi"], (scope) => scope.effect(() => scope.commandUi.register({ name: "mcp", description: "manage MCP services", available: () => true, ui: { kind: "popupSelect", options: async () => { const res = await fetch("/mcp-manager/status", { cache: "no-store" }); if (!res.ok) throw new Error(`HTTP ${res.status}`); const body = await res.json(); return (body.servers ?? []).map((s) => ({ id: s.serverName, label: `${s.serverName} · ${t(`state.${s.state}`)}`, detail: `${s.tools.length} ${t("tools").toLowerCase()}${s.lastError ? ` · ${s.lastError}` : ""}`, onSelect: async () => { const action = s.state === "connected" ? "disconnect" : s.state === "disabled" ? "enable" : "reconnect"; const response = await fetch("/mcp-manager/action", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ serverName: s.serverName, action }) }); if (!response.ok) throw new Error(`HTTP ${response.status}`); } })) }, onSelect: async (option) => option.onSelect() } }), "mcp-background: /mcp command"));
}

export { apply, inject };
