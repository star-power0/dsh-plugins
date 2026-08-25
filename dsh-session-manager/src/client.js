// dsh-session-manager —— client 端（浏览器）
// 设置页「会话管理」：列出所有工作区与会话，提供彻底删除（原版仅归档）。
// 数据与删除操作走 host 插件的 HTTP 端点（/session-manager/*）。
import { useState, useEffect, useCallback } from "react";

const NS = "settings.session-manager";

const css = {
  section: { maxWidth: 720, color: "var(--dsw-alias-label-primary, #1f2329)", fontFamily: "inherit" },
  lead: { fontSize: 13, lineHeight: 1.6, color: "var(--dsw-alias-label-tertiary, #6b7280)", margin: "0 0 16px" },
  card: { border: "1px solid var(--dsw-alias-border-l2, #e5e7eb)", borderRadius: 8, marginBottom: 16, overflow: "hidden" },
  cardHead: { padding: "10px 14px", fontWeight: 600, fontSize: 14, background: "var(--dsw-alias-bg-module-platform, #f7f8fa)", display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" },
  path: { fontWeight: 400, fontSize: 12, color: "var(--dsw-alias-label-tertiary, #9ca3af)" },
  row: { display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", borderTop: "1px solid var(--dsw-alias-border-l1, #f0f1f3)" },
  rowAlt: { background: "var(--dsw-alias-bg-module-platform, #fafbfc)" },
  title: { flex: "1 1 auto", fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  meta: { flex: "0 0 auto", fontSize: 12, color: "var(--dsw-alias-label-tertiary, #9ca3af)", whiteSpace: "nowrap" },
  badge: { flex: "0 0 auto", fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "var(--dsw-alias-bg-module-platform, #f0f1f3)", color: "var(--dsw-alias-label-secondary, #6b7280)" },
  badgeDanger: { flex: "0 0 auto", fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "var(--dsw-alias-state-error-tertiary, rgba(220,38,38,.1))", color: "var(--dsw-alias-state-error-primary, #dc2626)" },
  delete: { flex: "0 0 auto", padding: "4px 12px", borderRadius: 6, border: "1px solid var(--dsw-alias-state-error-primary, rgba(220,38,38,.4))", background: "transparent", color: "var(--dsw-alias-state-error-primary, #dc2626)", fontSize: 12, cursor: "pointer" },
  deleteDisabled: { opacity: 0.4, cursor: "not-allowed" },
  empty: { padding: 12, fontSize: 13, color: "var(--dsw-alias-label-tertiary, #9ca3af)" },
  actions: { display: "flex", gap: 10, alignItems: "center", marginTop: 4 },
  button: { padding: "6px 14px", borderRadius: 6, border: "none", background: "var(--dsw-alias-brand-primary, #3b82f6)", color: "var(--dsw-alias-label-primary-inverted, #fff)", fontSize: 13, cursor: "pointer" },
  status: { fontSize: 12, color: "var(--dsw-alias-label-secondary, #4b5563)" },
  error: { fontSize: 12, color: "var(--dsw-alias-state-error-primary, #dc2626)" }
};

function SessionGlyph({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 9h8M8 13h5M8 16h3" /></svg>;
}

function SessionManagerSection({ t, removeFromSidebar }) {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [data, setData] = useState({ workspaces: [], archived: [] });
  const [deletingId, setDeletingId] = useState(null);
  const [notice, setNotice] = useState(null);
  const [noticeError, setNoticeError] = useState(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/session-manager/list");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      setData(body);
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (sessionId, title) => {
    if (!window.confirm(`${t("confirm")}\n\n${title}  (${sessionId})`)) return;
    setDeletingId(sessionId);
    setNotice(null);
    setNoticeError(null);
    try {
      const res = await fetch("/session-manager/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setNotice(t("deleted"));
      removeFromSidebar(sessionId);
      await load();
    } catch (e) {
      setNoticeError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeletingId(null);
    }
  };

  const fmtTime = (ts) => {
    if (!ts) return "—";
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  if (status === "loading") return <div style={css.status}>{t("loading")}</div>;
  if (status === "error") {
    return (
      <div>
        <div style={css.error}>{t("loadFailed")}: {error}</div>
        <button type="button" style={css.button} onClick={load}>{t("reload")}</button>
      </div>
    );
  }

  const total = data.workspaces.reduce((n, w) => n + w.sessions.length, 0);
  const archived = new Set(data.archived);

  return (
    <div style={css.section}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "4px 0 18px" }}><div style={{ width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: 14, background: "linear-gradient(135deg, #0f766e, #0891b2)", color: "white" }}><SessionGlyph size={25} /></div><div><h1 style={{ margin: 0, fontSize: 20, lineHeight: 1.2, fontWeight: 700 }}>{t("nav")}</h1><p style={{ margin: "5px 0 0", fontSize: 13, color: "var(--dsw-alias-label-tertiary, #6b7280)" }}>{t("heroMeta")}</p></div></div>
      <p style={css.lead}>{t("lead")}</p>
      {total === 0 && <div style={css.empty}>{t("noSessions")}</div>}
      {data.workspaces.map((ws, wi) => (
        <div key={ws.workspaceId} style={css.card}>
          <div style={css.cardHead}>
            <span>
              {ws.title} <span style={css.path}>{ws.path}</span>
            </span>
            <span style={css.meta}>{ws.sessions.length} {t("sessions")}</span>
          </div>
          {ws.sessions.length === 0 && <div style={css.empty}>{t("noSessionsInWs")}</div>}
          {ws.sessions.map((s, si) => (
            <div key={s.sessionId} style={si % 2 === 1 ? { ...css.row, ...css.rowAlt } : css.row}>
              <span style={css.title} title={s.sessionId}>{s.title}</span>
              <span style={css.meta}>{t("turns", { n: s.turns })} · {fmtTime(s.createdAt)}</span>
              {archived.has(s.sessionId) ? <span style={css.badge}>{t("archived")}</span> : <span style={css.badgeDanger}>{t("active")}</span>}
              <button
                type="button"
                style={deletingId === s.sessionId ? { ...css.delete, ...css.deleteDisabled } : css.delete}
                disabled={deletingId !== null}
                onClick={() => remove(s.sessionId, s.title)}
              >
                {deletingId === s.sessionId ? t("deleting") : t("delete")}
              </button>
            </div>
          ))}
        </div>
      ))}
      {data.workspaces.length === 0 && total === 0 ? null : (
        <div style={css.actions}>
          <button type="button" style={css.button} onClick={load}>{t("reload")}</button>
          {notice && <span style={css.status}>{notice}</span>}
          {noticeError && <span style={css.error}>{noticeError}</span>}
        </div>
      )}
      <p style={css.lead}>{t("footnote")}</p>
    </div>
  );
}

const inject = ["slots", "locale", "sessions"];

function apply(ctx) {
  const NS_DICT = {
    zh: {
      nav: "会话管理",
      heroMeta: "工作区会话、归档与彻底删除",
      lead: "列出所有工作区中的会话（含标题、轮数与创建时间），可彻底删除。删除不可恢复，且建议在会话未运行时操作。",
      sessions: "个会话",
      turns: "{n} 轮",
      archived: "已归档",
      active: "活跃",
      delete: "删除",
      deleting: "删除中…",
      deleted: "已删除 ✓",
      confirm: "确定要彻底删除该会话吗？此操作不可恢复。",
      noSessions: "暂无会话。",
      noSessionsInWs: "该工作区没有会话。",
      reload: "刷新列表",
      loading: "加载中…",
      loadFailed: "加载失败",
      footnote: "提示：删除会移除会话数据文件与列表条目，并立即从侧边栏消失；若会话正在运行，建议先结束该会话。"
    },
    en: {
      nav: "Session Manager",
      heroMeta: "Workspace sessions, archives, and permanent deletion",
      lead: "List every session across workspaces (title, turns, created time) and delete them permanently. Deletion cannot be undone; avoid deleting a running session.",
      sessions: "sessions",
      turns: "{n} turns",
      archived: "archived",
      active: "active",
      delete: "Delete",
      deleting: "Deleting…",
      deleted: "Deleted ✓",
      confirm: "Permanently delete this session? This cannot be undone.",
      noSessions: "No sessions yet.",
      noSessionsInWs: "This workspace has no sessions.",
      reload: "Refresh",
      loading: "Loading…",
      loadFailed: "Load failed",
      footnote: "Deletion removes the session data files and list entry, then removes it from the sidebar immediately. If the session is running, stop it first."
    }
  };

  ctx.effect(() => ctx.locale.register(NS, NS_DICT), "session-manager: copy dictionaries");
  const t = ctx.locale.bind(NS);
  const removeFromSidebar = (sessionId) => {
    ctx.sessions.handleHostEnvelope({
      rpcId: `session-manager:${sessionId}`,
      payload: { type: "host/session-removed", sessionId }
    });
  };
  const onDeleted = (event) => removeFromSidebar(event.detail);
  window.addEventListener("dsh-session-deleted", onDeleted);
  ctx.effect(() => () => window.removeEventListener("dsh-session-deleted", onDeleted), "session-manager: deletion event");
  const injected = () => ({ t, removeFromSidebar });
  ctx.slots.inject("settings.section", () =>
    ctx.slots.register(
      {
        name: "settings.section",
        id: "session-manager",
        order: 12,
        label: () => t("nav"),
        inject: injected
      },
      SessionManagerSection
    )
  );
}

export { apply, inject };
