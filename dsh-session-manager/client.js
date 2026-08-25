window.__ModuleLoader__.load({
	id: "dsh-session-manager",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.js
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(client_exports);
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var NS = "settings.session-manager";
var css = {
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "4", y: "5", width: "16", height: "14", rx: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 9h8M8 13h5M8 16h3" })
  ] });
}
function SessionManagerSection({ t, removeFromSidebar }) {
  const [status, setStatus] = (0, import_react.useState)("loading");
  const [error, setError] = (0, import_react.useState)(null);
  const [data, setData] = (0, import_react.useState)({ workspaces: [], archived: [] });
  const [deletingId, setDeletingId] = (0, import_react.useState)(null);
  const [notice, setNotice] = (0, import_react.useState)(null);
  const [noticeError, setNoticeError] = (0, import_react.useState)(null);
  const load = (0, import_react.useCallback)(async () => {
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
  (0, import_react.useEffect)(() => {
    load();
  }, [load]);
  const remove = async (sessionId, title) => {
    if (!window.confirm(`${t("confirm")}

${title}  (${sessionId})`)) return;
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
    if (!ts) return "\u2014";
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  if (status === "loading") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.status, children: t("loading") });
  if (status === "error") {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.error, children: [
        t("loadFailed"),
        ": ",
        error
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: css.button, onClick: load, children: t("reload") })
    ] });
  }
  const total = data.workspaces.reduce((n, w) => n + w.sessions.length, 0);
  const archived = new Set(data.archived);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.section, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 14, padding: "4px 0 18px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: 14, background: "linear-gradient(135deg, #0f766e, #0891b2)", color: "white" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionGlyph, { size: 25 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { style: { margin: 0, fontSize: 20, lineHeight: 1.2, fontWeight: 700 }, children: t("nav") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: "5px 0 0", fontSize: 13, color: "var(--dsw-alias-label-tertiary, #6b7280)" }, children: t("heroMeta") })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: css.lead, children: t("lead") }),
    total === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.empty, children: t("noSessions") }),
    data.workspaces.map((ws, wi) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.card, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.cardHead, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
          ws.title,
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.path, children: ws.path })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: css.meta, children: [
          ws.sessions.length,
          " ",
          t("sessions")
        ] })
      ] }),
      ws.sessions.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.empty, children: t("noSessionsInWs") }),
      ws.sessions.map((s, si) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: si % 2 === 1 ? { ...css.row, ...css.rowAlt } : css.row, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.title, title: s.sessionId, children: s.title }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: css.meta, children: [
          t("turns", { n: s.turns }),
          " \xB7 ",
          fmtTime(s.createdAt)
        ] }),
        archived.has(s.sessionId) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.badge, children: t("archived") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.badgeDanger, children: t("active") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            style: deletingId === s.sessionId ? { ...css.delete, ...css.deleteDisabled } : css.delete,
            disabled: deletingId !== null,
            onClick: () => remove(s.sessionId, s.title),
            children: deletingId === s.sessionId ? t("deleting") : t("delete")
          }
        )
      ] }, s.sessionId))
    ] }, ws.workspaceId)),
    data.workspaces.length === 0 && total === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.actions, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: css.button, onClick: load, children: t("reload") }),
      notice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.status, children: notice }),
      noticeError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.error, children: noticeError })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: css.lead, children: t("footnote") })
  ] });
}
var inject = ["slots", "locale", "sessions"];
function apply(ctx) {
  const NS_DICT = {
    zh: {
      nav: "\u4F1A\u8BDD\u7BA1\u7406",
      heroMeta: "\u5DE5\u4F5C\u533A\u4F1A\u8BDD\u3001\u5F52\u6863\u4E0E\u5F7B\u5E95\u5220\u9664",
      lead: "\u5217\u51FA\u6240\u6709\u5DE5\u4F5C\u533A\u4E2D\u7684\u4F1A\u8BDD\uFF08\u542B\u6807\u9898\u3001\u8F6E\u6570\u4E0E\u521B\u5EFA\u65F6\u95F4\uFF09\uFF0C\u53EF\u5F7B\u5E95\u5220\u9664\u3002\u5220\u9664\u4E0D\u53EF\u6062\u590D\uFF0C\u4E14\u5EFA\u8BAE\u5728\u4F1A\u8BDD\u672A\u8FD0\u884C\u65F6\u64CD\u4F5C\u3002",
      sessions: "\u4E2A\u4F1A\u8BDD",
      turns: "{n} \u8F6E",
      archived: "\u5DF2\u5F52\u6863",
      active: "\u6D3B\u8DC3",
      delete: "\u5220\u9664",
      deleting: "\u5220\u9664\u4E2D\u2026",
      deleted: "\u5DF2\u5220\u9664 \u2713",
      confirm: "\u786E\u5B9A\u8981\u5F7B\u5E95\u5220\u9664\u8BE5\u4F1A\u8BDD\u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002",
      noSessions: "\u6682\u65E0\u4F1A\u8BDD\u3002",
      noSessionsInWs: "\u8BE5\u5DE5\u4F5C\u533A\u6CA1\u6709\u4F1A\u8BDD\u3002",
      reload: "\u5237\u65B0\u5217\u8868",
      loading: "\u52A0\u8F7D\u4E2D\u2026",
      loadFailed: "\u52A0\u8F7D\u5931\u8D25",
      footnote: "\u63D0\u793A\uFF1A\u5220\u9664\u4F1A\u79FB\u9664\u4F1A\u8BDD\u6570\u636E\u6587\u4EF6\u4E0E\u5217\u8868\u6761\u76EE\uFF0C\u5E76\u7ACB\u5373\u4ECE\u4FA7\u8FB9\u680F\u6D88\u5931\uFF1B\u82E5\u4F1A\u8BDD\u6B63\u5728\u8FD0\u884C\uFF0C\u5EFA\u8BAE\u5148\u7ED3\u675F\u8BE5\u4F1A\u8BDD\u3002"
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
      deleting: "Deleting\u2026",
      deleted: "Deleted \u2713",
      confirm: "Permanently delete this session? This cannot be undone.",
      noSessions: "No sessions yet.",
      noSessionsInWs: "This workspace has no sessions.",
      reload: "Refresh",
      loading: "Loading\u2026",
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
  ctx.slots.inject(
    "settings.section",
    () => ctx.slots.register(
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL2NsaWVudC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gZHNoLXNlc3Npb24tbWFuYWdlciBcdTIwMTRcdTIwMTQgY2xpZW50IFx1N0FFRlx1RkYwOFx1NkQ0Rlx1ODlDOFx1NTY2OFx1RkYwOVxyXG4vLyBcdThCQkVcdTdGNkVcdTk4NzVcdTMwMENcdTRGMUFcdThCRERcdTdCQTFcdTc0MDZcdTMwMERcdUZGMUFcdTUyMTdcdTUxRkFcdTYyNDBcdTY3MDlcdTVERTVcdTRGNUNcdTUzM0FcdTRFMEVcdTRGMUFcdThCRERcdUZGMENcdTYzRDBcdTRGOUJcdTVGN0JcdTVFOTVcdTUyMjBcdTk2NjRcdUZGMDhcdTUzOUZcdTcyNDhcdTRFQzVcdTVGNTJcdTY4NjNcdUZGMDlcdTMwMDJcclxuLy8gXHU2NTcwXHU2MzZFXHU0RTBFXHU1MjIwXHU5NjY0XHU2NENEXHU0RjVDXHU4RDcwIGhvc3QgXHU2M0QyXHU0RUY2XHU3Njg0IEhUVFAgXHU3QUVGXHU3MEI5XHVGRjA4L3Nlc3Npb24tbWFuYWdlci8qXHVGRjA5XHUzMDAyXHJcbmltcG9ydCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZUNhbGxiYWNrIH0gZnJvbSBcInJlYWN0XCI7XHJcblxyXG5jb25zdCBOUyA9IFwic2V0dGluZ3Muc2Vzc2lvbi1tYW5hZ2VyXCI7XHJcblxyXG5jb25zdCBjc3MgPSB7XHJcbiAgc2VjdGlvbjogeyBtYXhXaWR0aDogNzIwLCBjb2xvcjogXCJ2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgIzFmMjMyOSlcIiwgZm9udEZhbWlseTogXCJpbmhlcml0XCIgfSxcclxuICBsZWFkOiB7IGZvbnRTaXplOiAxMywgbGluZUhlaWdodDogMS42LCBjb2xvcjogXCJ2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2YjcyODApXCIsIG1hcmdpbjogXCIwIDAgMTZweFwiIH0sXHJcbiAgY2FyZDogeyBib3JkZXI6IFwiMXB4IHNvbGlkIHZhcigtLWRzdy1hbGlhcy1ib3JkZXItbDIsICNlNWU3ZWIpXCIsIGJvcmRlclJhZGl1czogOCwgbWFyZ2luQm90dG9tOiAxNiwgb3ZlcmZsb3c6IFwiaGlkZGVuXCIgfSxcclxuICBjYXJkSGVhZDogeyBwYWRkaW5nOiBcIjEwcHggMTRweFwiLCBmb250V2VpZ2h0OiA2MDAsIGZvbnRTaXplOiAxNCwgYmFja2dyb3VuZDogXCJ2YXIoLS1kc3ctYWxpYXMtYmctbW9kdWxlLXBsYXRmb3JtLCAjZjdmOGZhKVwiLCBkaXNwbGF5OiBcImZsZXhcIiwgYWxpZ25JdGVtczogXCJjZW50ZXJcIiwgZ2FwOiA4LCBqdXN0aWZ5Q29udGVudDogXCJzcGFjZS1iZXR3ZWVuXCIgfSxcclxuICBwYXRoOiB7IGZvbnRXZWlnaHQ6IDQwMCwgZm9udFNpemU6IDEyLCBjb2xvcjogXCJ2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5Y2EzYWYpXCIgfSxcclxuICByb3c6IHsgZGlzcGxheTogXCJmbGV4XCIsIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsIGdhcDogMTIsIHBhZGRpbmc6IFwiOHB4IDE0cHhcIiwgYm9yZGVyVG9wOiBcIjFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwxLCAjZjBmMWYzKVwiIH0sXHJcbiAgcm93QWx0OiB7IGJhY2tncm91bmQ6IFwidmFyKC0tZHN3LWFsaWFzLWJnLW1vZHVsZS1wbGF0Zm9ybSwgI2ZhZmJmYylcIiB9LFxyXG4gIHRpdGxlOiB7IGZsZXg6IFwiMSAxIGF1dG9cIiwgZm9udFNpemU6IDEzLCBmb250V2VpZ2h0OiA1MDAsIG92ZXJmbG93OiBcImhpZGRlblwiLCB0ZXh0T3ZlcmZsb3c6IFwiZWxsaXBzaXNcIiwgd2hpdGVTcGFjZTogXCJub3dyYXBcIiB9LFxyXG4gIG1ldGE6IHsgZmxleDogXCIwIDAgYXV0b1wiLCBmb250U2l6ZTogMTIsIGNvbG9yOiBcInZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzljYTNhZilcIiwgd2hpdGVTcGFjZTogXCJub3dyYXBcIiB9LFxyXG4gIGJhZGdlOiB7IGZsZXg6IFwiMCAwIGF1dG9cIiwgZm9udFNpemU6IDExLCBwYWRkaW5nOiBcIjJweCA4cHhcIiwgYm9yZGVyUmFkaXVzOiAxMCwgYmFja2dyb3VuZDogXCJ2YXIoLS1kc3ctYWxpYXMtYmctbW9kdWxlLXBsYXRmb3JtLCAjZjBmMWYzKVwiLCBjb2xvcjogXCJ2YXIoLS1kc3ctYWxpYXMtbGFiZWwtc2Vjb25kYXJ5LCAjNmI3MjgwKVwiIH0sXHJcbiAgYmFkZ2VEYW5nZXI6IHsgZmxleDogXCIwIDAgYXV0b1wiLCBmb250U2l6ZTogMTEsIHBhZGRpbmc6IFwiMnB4IDhweFwiLCBib3JkZXJSYWRpdXM6IDEwLCBiYWNrZ3JvdW5kOiBcInZhcigtLWRzdy1hbGlhcy1zdGF0ZS1lcnJvci10ZXJ0aWFyeSwgcmdiYSgyMjAsMzgsMzgsLjEpKVwiLCBjb2xvcjogXCJ2YXIoLS1kc3ctYWxpYXMtc3RhdGUtZXJyb3ItcHJpbWFyeSwgI2RjMjYyNilcIiB9LFxyXG4gIGRlbGV0ZTogeyBmbGV4OiBcIjAgMCBhdXRvXCIsIHBhZGRpbmc6IFwiNHB4IDEycHhcIiwgYm9yZGVyUmFkaXVzOiA2LCBib3JkZXI6IFwiMXB4IHNvbGlkIHZhcigtLWRzdy1hbGlhcy1zdGF0ZS1lcnJvci1wcmltYXJ5LCByZ2JhKDIyMCwzOCwzOCwuNCkpXCIsIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIiwgY29sb3I6IFwidmFyKC0tZHN3LWFsaWFzLXN0YXRlLWVycm9yLXByaW1hcnksICNkYzI2MjYpXCIsIGZvbnRTaXplOiAxMiwgY3Vyc29yOiBcInBvaW50ZXJcIiB9LFxyXG4gIGRlbGV0ZURpc2FibGVkOiB7IG9wYWNpdHk6IDAuNCwgY3Vyc29yOiBcIm5vdC1hbGxvd2VkXCIgfSxcclxuICBlbXB0eTogeyBwYWRkaW5nOiAxMiwgZm9udFNpemU6IDEzLCBjb2xvcjogXCJ2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5Y2EzYWYpXCIgfSxcclxuICBhY3Rpb25zOiB7IGRpc3BsYXk6IFwiZmxleFwiLCBnYXA6IDEwLCBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLCBtYXJnaW5Ub3A6IDQgfSxcclxuICBidXR0b246IHsgcGFkZGluZzogXCI2cHggMTRweFwiLCBib3JkZXJSYWRpdXM6IDYsIGJvcmRlcjogXCJub25lXCIsIGJhY2tncm91bmQ6IFwidmFyKC0tZHN3LWFsaWFzLWJyYW5kLXByaW1hcnksICMzYjgyZjYpXCIsIGNvbG9yOiBcInZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LWludmVydGVkLCAjZmZmKVwiLCBmb250U2l6ZTogMTMsIGN1cnNvcjogXCJwb2ludGVyXCIgfSxcclxuICBzdGF0dXM6IHsgZm9udFNpemU6IDEyLCBjb2xvcjogXCJ2YXIoLS1kc3ctYWxpYXMtbGFiZWwtc2Vjb25kYXJ5LCAjNGI1NTYzKVwiIH0sXHJcbiAgZXJyb3I6IHsgZm9udFNpemU6IDEyLCBjb2xvcjogXCJ2YXIoLS1kc3ctYWxpYXMtc3RhdGUtZXJyb3ItcHJpbWFyeSwgI2RjMjYyNilcIiB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBTZXNzaW9uR2x5cGgoeyBzaXplID0gMjIgfSkge1xyXG4gIHJldHVybiA8c3ZnIHdpZHRoPXtzaXplfSBoZWlnaHQ9e3NpemV9IHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZVdpZHRoPVwiMS44XCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PHJlY3QgeD1cIjRcIiB5PVwiNVwiIHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNFwiIHJ4PVwiMlwiIC8+PHBhdGggZD1cIk04IDloOE04IDEzaDVNOCAxNmgzXCIgLz48L3N2Zz47XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFNlc3Npb25NYW5hZ2VyU2VjdGlvbih7IHQsIHJlbW92ZUZyb21TaWRlYmFyIH0pIHtcclxuICBjb25zdCBbc3RhdHVzLCBzZXRTdGF0dXNdID0gdXNlU3RhdGUoXCJsb2FkaW5nXCIpO1xyXG4gIGNvbnN0IFtlcnJvciwgc2V0RXJyb3JdID0gdXNlU3RhdGUobnVsbCk7XHJcbiAgY29uc3QgW2RhdGEsIHNldERhdGFdID0gdXNlU3RhdGUoeyB3b3Jrc3BhY2VzOiBbXSwgYXJjaGl2ZWQ6IFtdIH0pO1xyXG4gIGNvbnN0IFtkZWxldGluZ0lkLCBzZXREZWxldGluZ0lkXSA9IHVzZVN0YXRlKG51bGwpO1xyXG4gIGNvbnN0IFtub3RpY2UsIHNldE5vdGljZV0gPSB1c2VTdGF0ZShudWxsKTtcclxuICBjb25zdCBbbm90aWNlRXJyb3IsIHNldE5vdGljZUVycm9yXSA9IHVzZVN0YXRlKG51bGwpO1xyXG5cclxuICBjb25zdCBsb2FkID0gdXNlQ2FsbGJhY2soYXN5bmMgKCkgPT4ge1xyXG4gICAgc2V0U3RhdHVzKFwibG9hZGluZ1wiKTtcclxuICAgIHNldEVycm9yKG51bGwpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goXCIvc2Vzc2lvbi1tYW5hZ2VyL2xpc3RcIik7XHJcbiAgICAgIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgJHtyZXMuc3RhdHVzfWApO1xyXG4gICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzLmpzb24oKTtcclxuICAgICAgc2V0RGF0YShib2R5KTtcclxuICAgICAgc2V0U3RhdHVzKFwicmVhZHlcIik7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIHNldEVycm9yKGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSk7XHJcbiAgICAgIHNldFN0YXR1cyhcImVycm9yXCIpO1xyXG4gICAgfVxyXG4gIH0sIFtdKTtcclxuXHJcbiAgdXNlRWZmZWN0KCgpID0+IHtcclxuICAgIGxvYWQoKTtcclxuICB9LCBbbG9hZF0pO1xyXG5cclxuICBjb25zdCByZW1vdmUgPSBhc3luYyAoc2Vzc2lvbklkLCB0aXRsZSkgPT4ge1xyXG4gICAgaWYgKCF3aW5kb3cuY29uZmlybShgJHt0KFwiY29uZmlybVwiKX1cXG5cXG4ke3RpdGxlfSAgKCR7c2Vzc2lvbklkfSlgKSkgcmV0dXJuO1xyXG4gICAgc2V0RGVsZXRpbmdJZChzZXNzaW9uSWQpO1xyXG4gICAgc2V0Tm90aWNlKG51bGwpO1xyXG4gICAgc2V0Tm90aWNlRXJyb3IobnVsbCk7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChcIi9zZXNzaW9uLW1hbmFnZXIvZGVsZXRlXCIsIHtcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgXCJjb250ZW50LXR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHNlc3Npb25JZCB9KVxyXG4gICAgICB9KTtcclxuICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHJlcy5qc29uKCk7XHJcbiAgICAgIGlmICghcmVzLm9rIHx8ICFib2R5Lm9rKSB0aHJvdyBuZXcgRXJyb3IoYm9keS5lcnJvciA/PyBgSFRUUCAke3Jlcy5zdGF0dXN9YCk7XHJcbiAgICAgIHNldE5vdGljZSh0KFwiZGVsZXRlZFwiKSk7XHJcbiAgICAgIHJlbW92ZUZyb21TaWRlYmFyKHNlc3Npb25JZCk7XHJcbiAgICAgIGF3YWl0IGxvYWQoKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgc2V0Tm90aWNlRXJyb3IoZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpKTtcclxuICAgIH0gZmluYWxseSB7XHJcbiAgICAgIHNldERlbGV0aW5nSWQobnVsbCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgZm10VGltZSA9ICh0cykgPT4ge1xyXG4gICAgaWYgKCF0cykgcmV0dXJuIFwiXHUyMDE0XCI7XHJcbiAgICBjb25zdCBkID0gbmV3IERhdGUodHMpO1xyXG4gICAgY29uc3QgcGFkID0gKG4pID0+IFN0cmluZyhuKS5wYWRTdGFydCgyLCBcIjBcIik7XHJcbiAgICByZXR1cm4gYCR7ZC5nZXRGdWxsWWVhcigpfS0ke3BhZChkLmdldE1vbnRoKCkgKyAxKX0tJHtwYWQoZC5nZXREYXRlKCkpfSAke3BhZChkLmdldEhvdXJzKCkpfToke3BhZChkLmdldE1pbnV0ZXMoKSl9YDtcclxuICB9O1xyXG5cclxuICBpZiAoc3RhdHVzID09PSBcImxvYWRpbmdcIikgcmV0dXJuIDxkaXYgc3R5bGU9e2Nzcy5zdGF0dXN9Pnt0KFwibG9hZGluZ1wiKX08L2Rpdj47XHJcbiAgaWYgKHN0YXR1cyA9PT0gXCJlcnJvclwiKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICA8ZGl2PlxyXG4gICAgICAgIDxkaXYgc3R5bGU9e2Nzcy5lcnJvcn0+e3QoXCJsb2FkRmFpbGVkXCIpfToge2Vycm9yfTwvZGl2PlxyXG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIHN0eWxlPXtjc3MuYnV0dG9ufSBvbkNsaWNrPXtsb2FkfT57dChcInJlbG9hZFwiKX08L2J1dHRvbj5cclxuICAgICAgPC9kaXY+XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgdG90YWwgPSBkYXRhLndvcmtzcGFjZXMucmVkdWNlKChuLCB3KSA9PiBuICsgdy5zZXNzaW9ucy5sZW5ndGgsIDApO1xyXG4gIGNvbnN0IGFyY2hpdmVkID0gbmV3IFNldChkYXRhLmFyY2hpdmVkKTtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxkaXYgc3R5bGU9e2Nzcy5zZWN0aW9ufT5cclxuICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiBcImZsZXhcIiwgYWxpZ25JdGVtczogXCJjZW50ZXJcIiwgZ2FwOiAxNCwgcGFkZGluZzogXCI0cHggMCAxOHB4XCIgfX0+PGRpdiBzdHlsZT17eyB3aWR0aDogNDQsIGhlaWdodDogNDQsIGRpc3BsYXk6IFwiZ3JpZFwiLCBwbGFjZUl0ZW1zOiBcImNlbnRlclwiLCBib3JkZXJSYWRpdXM6IDE0LCBiYWNrZ3JvdW5kOiBcImxpbmVhci1ncmFkaWVudCgxMzVkZWcsICMwZjc2NmUsICMwODkxYjIpXCIsIGNvbG9yOiBcIndoaXRlXCIgfX0+PFNlc3Npb25HbHlwaCBzaXplPXsyNX0gLz48L2Rpdj48ZGl2PjxoMSBzdHlsZT17eyBtYXJnaW46IDAsIGZvbnRTaXplOiAyMCwgbGluZUhlaWdodDogMS4yLCBmb250V2VpZ2h0OiA3MDAgfX0+e3QoXCJuYXZcIil9PC9oMT48cCBzdHlsZT17eyBtYXJnaW46IFwiNXB4IDAgMFwiLCBmb250U2l6ZTogMTMsIGNvbG9yOiBcInZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzZiNzI4MClcIiB9fT57dChcImhlcm9NZXRhXCIpfTwvcD48L2Rpdj48L2Rpdj5cclxuICAgICAgPHAgc3R5bGU9e2Nzcy5sZWFkfT57dChcImxlYWRcIil9PC9wPlxyXG4gICAgICB7dG90YWwgPT09IDAgJiYgPGRpdiBzdHlsZT17Y3NzLmVtcHR5fT57dChcIm5vU2Vzc2lvbnNcIil9PC9kaXY+fVxyXG4gICAgICB7ZGF0YS53b3Jrc3BhY2VzLm1hcCgod3MsIHdpKSA9PiAoXHJcbiAgICAgICAgPGRpdiBrZXk9e3dzLndvcmtzcGFjZUlkfSBzdHlsZT17Y3NzLmNhcmR9PlxyXG4gICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmNhcmRIZWFkfT5cclxuICAgICAgICAgICAgPHNwYW4+XHJcbiAgICAgICAgICAgICAge3dzLnRpdGxlfSA8c3BhbiBzdHlsZT17Y3NzLnBhdGh9Pnt3cy5wYXRofTwvc3Bhbj5cclxuICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICA8c3BhbiBzdHlsZT17Y3NzLm1ldGF9Pnt3cy5zZXNzaW9ucy5sZW5ndGh9IHt0KFwic2Vzc2lvbnNcIil9PC9zcGFuPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICB7d3Muc2Vzc2lvbnMubGVuZ3RoID09PSAwICYmIDxkaXYgc3R5bGU9e2Nzcy5lbXB0eX0+e3QoXCJub1Nlc3Npb25zSW5Xc1wiKX08L2Rpdj59XHJcbiAgICAgICAgICB7d3Muc2Vzc2lvbnMubWFwKChzLCBzaSkgPT4gKFxyXG4gICAgICAgICAgICA8ZGl2IGtleT17cy5zZXNzaW9uSWR9IHN0eWxlPXtzaSAlIDIgPT09IDEgPyB7IC4uLmNzcy5yb3csIC4uLmNzcy5yb3dBbHQgfSA6IGNzcy5yb3d9PlxyXG4gICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXtjc3MudGl0bGV9IHRpdGxlPXtzLnNlc3Npb25JZH0+e3MudGl0bGV9PC9zcGFuPlxyXG4gICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXtjc3MubWV0YX0+e3QoXCJ0dXJuc1wiLCB7IG46IHMudHVybnMgfSl9IFx1MDBCNyB7Zm10VGltZShzLmNyZWF0ZWRBdCl9PC9zcGFuPlxyXG4gICAgICAgICAgICAgIHthcmNoaXZlZC5oYXMocy5zZXNzaW9uSWQpID8gPHNwYW4gc3R5bGU9e2Nzcy5iYWRnZX0+e3QoXCJhcmNoaXZlZFwiKX08L3NwYW4+IDogPHNwYW4gc3R5bGU9e2Nzcy5iYWRnZURhbmdlcn0+e3QoXCJhY3RpdmVcIil9PC9zcGFuPn1cclxuICAgICAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcclxuICAgICAgICAgICAgICAgIHN0eWxlPXtkZWxldGluZ0lkID09PSBzLnNlc3Npb25JZCA/IHsgLi4uY3NzLmRlbGV0ZSwgLi4uY3NzLmRlbGV0ZURpc2FibGVkIH0gOiBjc3MuZGVsZXRlfVxyXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2RlbGV0aW5nSWQgIT09IG51bGx9XHJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiByZW1vdmUocy5zZXNzaW9uSWQsIHMudGl0bGUpfVxyXG4gICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgIHtkZWxldGluZ0lkID09PSBzLnNlc3Npb25JZCA/IHQoXCJkZWxldGluZ1wiKSA6IHQoXCJkZWxldGVcIil9XHJcbiAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgKSl9XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICkpfVxyXG4gICAgICB7ZGF0YS53b3Jrc3BhY2VzLmxlbmd0aCA9PT0gMCAmJiB0b3RhbCA9PT0gMCA/IG51bGwgOiAoXHJcbiAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmFjdGlvbnN9PlxyXG4gICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgc3R5bGU9e2Nzcy5idXR0b259IG9uQ2xpY2s9e2xvYWR9Pnt0KFwicmVsb2FkXCIpfTwvYnV0dG9uPlxyXG4gICAgICAgICAge25vdGljZSAmJiA8c3BhbiBzdHlsZT17Y3NzLnN0YXR1c30+e25vdGljZX08L3NwYW4+fVxyXG4gICAgICAgICAge25vdGljZUVycm9yICYmIDxzcGFuIHN0eWxlPXtjc3MuZXJyb3J9Pntub3RpY2VFcnJvcn08L3NwYW4+fVxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICApfVxyXG4gICAgICA8cCBzdHlsZT17Y3NzLmxlYWR9Pnt0KFwiZm9vdG5vdGVcIil9PC9wPlxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufVxyXG5cclxuY29uc3QgaW5qZWN0ID0gW1wic2xvdHNcIiwgXCJsb2NhbGVcIiwgXCJzZXNzaW9uc1wiXTtcclxuXHJcbmZ1bmN0aW9uIGFwcGx5KGN0eCkge1xyXG4gIGNvbnN0IE5TX0RJQ1QgPSB7XHJcbiAgICB6aDoge1xyXG4gICAgICBuYXY6IFwiXHU0RjFBXHU4QkREXHU3QkExXHU3NDA2XCIsXHJcbiAgICAgIGhlcm9NZXRhOiBcIlx1NURFNVx1NEY1Q1x1NTMzQVx1NEYxQVx1OEJERFx1MzAwMVx1NUY1Mlx1Njg2M1x1NEUwRVx1NUY3Qlx1NUU5NVx1NTIyMFx1OTY2NFwiLFxyXG4gICAgICBsZWFkOiBcIlx1NTIxN1x1NTFGQVx1NjI0MFx1NjcwOVx1NURFNVx1NEY1Q1x1NTMzQVx1NEUyRFx1NzY4NFx1NEYxQVx1OEJERFx1RkYwOFx1NTQyQlx1NjgwN1x1OTg5OFx1MzAwMVx1OEY2RVx1NjU3MFx1NEUwRVx1NTIxQlx1NUVGQVx1NjVGNlx1OTVGNFx1RkYwOVx1RkYwQ1x1NTNFRlx1NUY3Qlx1NUU5NVx1NTIyMFx1OTY2NFx1MzAwMlx1NTIyMFx1OTY2NFx1NEUwRFx1NTNFRlx1NjA2Mlx1NTkwRFx1RkYwQ1x1NEUxNFx1NUVGQVx1OEJBRVx1NTcyOFx1NEYxQVx1OEJERFx1NjcyQVx1OEZEMFx1ODg0Q1x1NjVGNlx1NjRDRFx1NEY1Q1x1MzAwMlwiLFxyXG4gICAgICBzZXNzaW9uczogXCJcdTRFMkFcdTRGMUFcdThCRERcIixcclxuICAgICAgdHVybnM6IFwie259IFx1OEY2RVwiLFxyXG4gICAgICBhcmNoaXZlZDogXCJcdTVERjJcdTVGNTJcdTY4NjNcIixcclxuICAgICAgYWN0aXZlOiBcIlx1NkQzQlx1OERDM1wiLFxyXG4gICAgICBkZWxldGU6IFwiXHU1MjIwXHU5NjY0XCIsXHJcbiAgICAgIGRlbGV0aW5nOiBcIlx1NTIyMFx1OTY2NFx1NEUyRFx1MjAyNlwiLFxyXG4gICAgICBkZWxldGVkOiBcIlx1NURGMlx1NTIyMFx1OTY2NCBcdTI3MTNcIixcclxuICAgICAgY29uZmlybTogXCJcdTc4NkVcdTVCOUFcdTg5ODFcdTVGN0JcdTVFOTVcdTUyMjBcdTk2NjRcdThCRTVcdTRGMUFcdThCRERcdTU0MTdcdUZGMUZcdTZCNjRcdTY0Q0RcdTRGNUNcdTRFMERcdTUzRUZcdTYwNjJcdTU5MERcdTMwMDJcIixcclxuICAgICAgbm9TZXNzaW9uczogXCJcdTY2ODJcdTY1RTBcdTRGMUFcdThCRERcdTMwMDJcIixcclxuICAgICAgbm9TZXNzaW9uc0luV3M6IFwiXHU4QkU1XHU1REU1XHU0RjVDXHU1MzNBXHU2Q0ExXHU2NzA5XHU0RjFBXHU4QkREXHUzMDAyXCIsXHJcbiAgICAgIHJlbG9hZDogXCJcdTUyMzdcdTY1QjBcdTUyMTdcdTg4NjhcIixcclxuICAgICAgbG9hZGluZzogXCJcdTUyQTBcdThGN0RcdTRFMkRcdTIwMjZcIixcclxuICAgICAgbG9hZEZhaWxlZDogXCJcdTUyQTBcdThGN0RcdTU5MzFcdThEMjVcIixcclxuICAgICAgZm9vdG5vdGU6IFwiXHU2M0QwXHU3OTNBXHVGRjFBXHU1MjIwXHU5NjY0XHU0RjFBXHU3OUZCXHU5NjY0XHU0RjFBXHU4QkREXHU2NTcwXHU2MzZFXHU2NTg3XHU0RUY2XHU0RTBFXHU1MjE3XHU4ODY4XHU2NzYxXHU3NkVFXHVGRjBDXHU1RTc2XHU3QUNCXHU1MzczXHU0RUNFXHU0RkE3XHU4RkI5XHU2ODBGXHU2RDg4XHU1OTMxXHVGRjFCXHU4MkU1XHU0RjFBXHU4QkREXHU2QjYzXHU1NzI4XHU4RkQwXHU4ODRDXHVGRjBDXHU1RUZBXHU4QkFFXHU1MTQ4XHU3RUQzXHU2NzVGXHU4QkU1XHU0RjFBXHU4QkREXHUzMDAyXCJcclxuICAgIH0sXHJcbiAgICBlbjoge1xyXG4gICAgICBuYXY6IFwiU2Vzc2lvbiBNYW5hZ2VyXCIsXHJcbiAgICAgIGhlcm9NZXRhOiBcIldvcmtzcGFjZSBzZXNzaW9ucywgYXJjaGl2ZXMsIGFuZCBwZXJtYW5lbnQgZGVsZXRpb25cIixcclxuICAgICAgbGVhZDogXCJMaXN0IGV2ZXJ5IHNlc3Npb24gYWNyb3NzIHdvcmtzcGFjZXMgKHRpdGxlLCB0dXJucywgY3JlYXRlZCB0aW1lKSBhbmQgZGVsZXRlIHRoZW0gcGVybWFuZW50bHkuIERlbGV0aW9uIGNhbm5vdCBiZSB1bmRvbmU7IGF2b2lkIGRlbGV0aW5nIGEgcnVubmluZyBzZXNzaW9uLlwiLFxyXG4gICAgICBzZXNzaW9uczogXCJzZXNzaW9uc1wiLFxyXG4gICAgICB0dXJuczogXCJ7bn0gdHVybnNcIixcclxuICAgICAgYXJjaGl2ZWQ6IFwiYXJjaGl2ZWRcIixcclxuICAgICAgYWN0aXZlOiBcImFjdGl2ZVwiLFxyXG4gICAgICBkZWxldGU6IFwiRGVsZXRlXCIsXHJcbiAgICAgIGRlbGV0aW5nOiBcIkRlbGV0aW5nXHUyMDI2XCIsXHJcbiAgICAgIGRlbGV0ZWQ6IFwiRGVsZXRlZCBcdTI3MTNcIixcclxuICAgICAgY29uZmlybTogXCJQZXJtYW5lbnRseSBkZWxldGUgdGhpcyBzZXNzaW9uPyBUaGlzIGNhbm5vdCBiZSB1bmRvbmUuXCIsXHJcbiAgICAgIG5vU2Vzc2lvbnM6IFwiTm8gc2Vzc2lvbnMgeWV0LlwiLFxyXG4gICAgICBub1Nlc3Npb25zSW5XczogXCJUaGlzIHdvcmtzcGFjZSBoYXMgbm8gc2Vzc2lvbnMuXCIsXHJcbiAgICAgIHJlbG9hZDogXCJSZWZyZXNoXCIsXHJcbiAgICAgIGxvYWRpbmc6IFwiTG9hZGluZ1x1MjAyNlwiLFxyXG4gICAgICBsb2FkRmFpbGVkOiBcIkxvYWQgZmFpbGVkXCIsXHJcbiAgICAgIGZvb3Rub3RlOiBcIkRlbGV0aW9uIHJlbW92ZXMgdGhlIHNlc3Npb24gZGF0YSBmaWxlcyBhbmQgbGlzdCBlbnRyeSwgdGhlbiByZW1vdmVzIGl0IGZyb20gdGhlIHNpZGViYXIgaW1tZWRpYXRlbHkuIElmIHRoZSBzZXNzaW9uIGlzIHJ1bm5pbmcsIHN0b3AgaXQgZmlyc3QuXCJcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBjdHguZWZmZWN0KCgpID0+IGN0eC5sb2NhbGUucmVnaXN0ZXIoTlMsIE5TX0RJQ1QpLCBcInNlc3Npb24tbWFuYWdlcjogY29weSBkaWN0aW9uYXJpZXNcIik7XHJcbiAgY29uc3QgdCA9IGN0eC5sb2NhbGUuYmluZChOUyk7XHJcbiAgY29uc3QgcmVtb3ZlRnJvbVNpZGViYXIgPSAoc2Vzc2lvbklkKSA9PiB7XHJcbiAgICBjdHguc2Vzc2lvbnMuaGFuZGxlSG9zdEVudmVsb3BlKHtcclxuICAgICAgcnBjSWQ6IGBzZXNzaW9uLW1hbmFnZXI6JHtzZXNzaW9uSWR9YCxcclxuICAgICAgcGF5bG9hZDogeyB0eXBlOiBcImhvc3Qvc2Vzc2lvbi1yZW1vdmVkXCIsIHNlc3Npb25JZCB9XHJcbiAgICB9KTtcclxuICB9O1xyXG4gIGNvbnN0IG9uRGVsZXRlZCA9IChldmVudCkgPT4gcmVtb3ZlRnJvbVNpZGViYXIoZXZlbnQuZGV0YWlsKTtcclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImRzaC1zZXNzaW9uLWRlbGV0ZWRcIiwgb25EZWxldGVkKTtcclxuICBjdHguZWZmZWN0KCgpID0+ICgpID0+IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHNoLXNlc3Npb24tZGVsZXRlZFwiLCBvbkRlbGV0ZWQpLCBcInNlc3Npb24tbWFuYWdlcjogZGVsZXRpb24gZXZlbnRcIik7XHJcbiAgY29uc3QgaW5qZWN0ZWQgPSAoKSA9PiAoeyB0LCByZW1vdmVGcm9tU2lkZWJhciB9KTtcclxuICBjdHguc2xvdHMuaW5qZWN0KFwic2V0dGluZ3Muc2VjdGlvblwiLCAoKSA9PlxyXG4gICAgY3R4LnNsb3RzLnJlZ2lzdGVyKFxyXG4gICAgICB7XHJcbiAgICAgICAgbmFtZTogXCJzZXR0aW5ncy5zZWN0aW9uXCIsXHJcbiAgICAgICAgaWQ6IFwic2Vzc2lvbi1tYW5hZ2VyXCIsXHJcbiAgICAgICAgb3JkZXI6IDEyLFxyXG4gICAgICAgIGxhYmVsOiAoKSA9PiB0KFwibmF2XCIpLFxyXG4gICAgICAgIGluamVjdDogaW5qZWN0ZWRcclxuICAgICAgfSxcclxuICAgICAgU2Vzc2lvbk1hbmFnZXJTZWN0aW9uXHJcbiAgICApXHJcbiAgKTtcclxufVxyXG5cclxuZXhwb3J0IHsgYXBwbHksIGluamVjdCB9O1xyXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBR0EsbUJBQWlEO0FBMEJ4QztBQXhCVCxJQUFNLEtBQUs7QUFFWCxJQUFNLE1BQU07QUFBQSxFQUNWLFNBQVMsRUFBRSxVQUFVLEtBQUssT0FBTywyQ0FBMkMsWUFBWSxVQUFVO0FBQUEsRUFDbEcsTUFBTSxFQUFFLFVBQVUsSUFBSSxZQUFZLEtBQUssT0FBTyw0Q0FBNEMsUUFBUSxXQUFXO0FBQUEsRUFDN0csTUFBTSxFQUFFLFFBQVEsaURBQWlELGNBQWMsR0FBRyxjQUFjLElBQUksVUFBVSxTQUFTO0FBQUEsRUFDdkgsVUFBVSxFQUFFLFNBQVMsYUFBYSxZQUFZLEtBQUss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

		return module.exports;
	}
});
//# sourceMappingURL=client.js.map
