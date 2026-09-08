window.__ModuleLoader__.load({
	id: "dsh-modlens-guard",
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

// guard/src/client.js
var client_exports = {};
__export(client_exports, {
  ModlensGuardSection: () => ModlensGuardSection,
  NS: () => NS,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(client_exports);
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var NS = "settings.modlens-guard";
var TONE = {
  ready: { fg: "#0f7b3f", bg: "rgba(16,163,74,0.12)", border: "rgba(16,163,74,0.35)" },
  unconfigured: { fg: "#8a5300", bg: "rgba(217,119,6,0.12)", border: "rgba(217,119,6,0.35)" },
  failing: { fg: "#b3261e", bg: "rgba(220,38,38,0.12)", border: "rgba(220,38,38,0.35)" },
  off: { fg: "#5b6270", bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.35)" }
};
var css = {
  section: { maxWidth: 760, color: "var(--dsw-alias-label-primary, #1f2329)", fontFamily: "inherit" },
  hero: { display: "flex", alignItems: "center", gap: 14, marginBottom: 12 },
  heroIcon: { flex: "none", color: "var(--dsw-alias-label-tertiary, #6b7280)" },
  heroTitle: { fontSize: 20, fontWeight: 650, letterSpacing: 0.2 },
  heroMeta: { fontSize: 14, color: "var(--dsw-alias-label-tertiary, #6b7280)" },
  lead: { fontSize: 15, lineHeight: 1.7, color: "var(--dsw-alias-label-tertiary, #6b7280)", margin: "0 0 18px" },
  card: {
    border: "1px solid color-mix(in srgb, var(--dsw-alias-border-l2, #e5e7eb) 88%, transparent)",
    borderRadius: 14,
    padding: "16px 18px 18px",
    marginBottom: 16,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    background: "color-mix(in srgb, var(--dsw-alias-bg-base, #ffffff) 84%, transparent)",
    boxShadow: "0 8px 24px rgb(0 0 0 / 0.08), inset 0 1px 0 rgb(255 255 255 / 0.06)"
  },
  row: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 14px",
    borderRadius: 999,
    fontSize: 15,
    fontWeight: 650,
    border: "1px solid"
  },
  dot: { width: 9, height: 9, borderRadius: 999, background: "currentColor" },
  hint: { fontSize: 15, lineHeight: 1.7 },
  grid: { display: "grid", gridTemplateColumns: "minmax(110px, 180px) 1fr", gap: "12px 18px", fontSize: 15 },
  key: { color: "var(--dsw-alias-label-tertiary, #6b7280)" },
  val: { wordBreak: "break-word" },
  err: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 14 },
  btn: {
    padding: "7px 15px",
    fontSize: 15,
    borderRadius: 8,
    cursor: "pointer",
    border: "1px solid color-mix(in srgb, var(--dsw-alias-border-l2, #e5e7eb) 88%, transparent)",
    background: "color-mix(in srgb, var(--dsw-alias-bg-base, #ffffff) 60%, transparent)",
    color: "inherit",
    fontWeight: 600
  },
  foot: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "var(--dsw-alias-label-tertiary, #6b7280)",
    borderTop: "1px solid color-mix(in srgb, var(--dsw-alias-border-l2, #e5e7eb) 70%, transparent)",
    paddingTop: 14
  }
};
function HeroIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width: "34", height: "34", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m4 7.5 8 4.5 8-4.5M12 12v9", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "2.1", fill: "currentColor", stroke: "none" })
  ] });
}
function stamp(value, never) {
  if (!value) return never;
  try {
    return new Intl.DateTimeFormat(void 0, { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value));
  } catch {
    return String(value);
  }
}
function ModlensGuardSection({ t }) {
  const [status, setStatus] = (0, import_react.useState)(null);
  const [error, setError] = (0, import_react.useState)("");
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [probing, setProbing] = (0, import_react.useState)(false);
  const load = (0, import_react.useCallback)(async () => {
    setLoading(true);
    try {
      const res = await fetch("/modlens-guard/status");
      const body = await res.json();
      if (!res.ok || body.ok !== true) throw new Error(body.error || `HTTP ${res.status}`);
      setStatus(body.status);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);
  const probe = (0, import_react.useCallback)(async () => {
    setProbing(true);
    try {
      const res = await fetch("/modlens-guard/probe", { method: "POST" });
      const body = await res.json();
      setStatus(body.status ?? null);
      if (!res.ok || body.ok !== true) throw new Error(body.result?.error || body.error || `HTTP ${res.status}`);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProbing(false);
    }
  }, []);
  (0, import_react.useEffect)(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15e3);
    return () => window.clearInterval(timer);
  }, [load]);
  const state = status?.state ?? "off";
  const tone = TONE[state] ?? TONE.off;
  const stateLabel = t(
    state === "ready" ? "stateReady" : state === "unconfigured" ? "stateUnconfigured" : state === "failing" ? "stateFailing" : "stateOff"
  );
  const stateHint = t(
    state === "ready" ? "readyHint" : state === "unconfigured" ? "unconfiguredHint" : state === "failing" ? "failingHint" : "offHint"
  );
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.section, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.hero, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.heroIcon, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroIcon, {}) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.heroTitle, children: t("nav") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.heroMeta, children: t("heroMeta") })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: css.lead, children: t("lead") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.card, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.row, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { ...css.badge, color: tone.fg, background: tone.bg, borderColor: tone.border }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.dot }),
          stateLabel
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: css.btn, onClick: () => void probe(), disabled: loading || probing, children: probing ? t("probing") : t("refresh") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.hint, children: stateHint }),
      error !== "" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...css.hint, color: TONE.failing.fg }, children: `${t("loadFailed")}: ${error}` }),
      status !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.grid, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("bridge") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: status.pluginLoaded ? t("bridgeOn") : t("bridgeOff") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("engines") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: status.engines?.length > 0 ? status.engines.join(", ") : t("none") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("pinned") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: status.pinned || t("pinnedAuto") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("visionModels") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: status.visionProviders?.length > 0 ? status.visionProviders.join(", ") : t("none") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("lastProbe") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: status.probeAt ? stamp(status.probeAt, t("never")) : t("never") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("probeResult") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: status.probeOk === null ? t("never") : status.probeOk ? t("probeOk") : t("probeFailed") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("probeEngine") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: status.probeProvider || t("none") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("probeModel") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: status.probeModel || t("none") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("probeDuration") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: typeof status.probeDurationMs === "number" ? t("probeDurationValue").replace("{ms}", String(status.probeDurationMs)) : t("never") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("lastOk") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: stamp(status.lastOkAt, t("never")) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("lastFail") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: stamp(status.lastFailAt, t("never")) }),
        status.lastError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("lastError") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...css.val, ...css.err }, children: status.lastError })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.key, children: t("counters") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.val, children: t("countersValue").replace("{reads}", String(status.reads ?? 0)).replace("{failures}", String(status.failures ?? 0)).replace("{blocks}", String(status.blocks ?? 0)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.foot, children: t("configHint") })
    ] })
  ] });
}
function ModlensTurnStatus({ matched, sessionId }) {
  const [status, setStatus] = (0, import_react.useState)(null);
  const turn = matched;
  (0, import_react.useEffect)(() => {
    if (!turn || !Number.isInteger(turn.turn)) return void 0;
    let cancelled = false;
    let timer;
    const load = async () => {
      try {
        const response = await fetch(`/modlens-guard/turn-status?turn=${encodeURIComponent(String(turn.turn))}&sessionId=${encodeURIComponent(sessionId)}`);
        const body = await response.json();
        const next = body.status ?? null;
        if (cancelled) return;
        setStatus(next);
        if (next?.state === "ready" || next?.state === "failed") {
          if (timer) window.clearInterval(timer);
        }
      } catch {
      }
    };
    void load();
    timer = window.setInterval(() => void load(), 500);
    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [turn, sessionId]);
  if (!status || status.state !== "ready" && status.state !== "failed") return null;
  const failed = status.state === "failed";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "div",
    {
      style: {
        color: failed ? TONE.failing.fg : "var(--dsw-alias-label-tertiary, #6b7280)",
        fontSize: 13,
        lineHeight: 1.5,
        margin: "6px 0 0 2px"
      },
      children: failed ? "ModLens \xB7 \u56FE\u7247\u8BFB\u53D6\u5931\u8D25" : "ModLens \xB7 \u5DF2\u8BFB\u53D6\u56FE\u7247"
    }
  );
}
function ModlensTurnTail({ matched, sessionId }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModlensTurnStatus, { matched, sessionId });
}
var inject = ["slots", "locale"];
var NS_DICT = {
  zh: {
    nav: "\u89C6\u89C9\u72B6\u6001",
    heroMeta: "\u7EAF\u6587\u672C\u6A21\u578B\u7684\u56FE\u7247\u8BC6\u522B\u72B6\u6001",
    lead: "\u7EAF\u6587\u672C\u6A21\u578B\u6536\u5230\u56FE\u7247\u65F6\uFF0C\u7531 ModLens \u5728\u53D1\u9001\u524D\u628A\u56FE\u7247\u8F6C\u6210\u6587\u5B57\u8BC1\u636E\uFF1B\u539F\u751F\u591A\u6A21\u6001\u6A21\u578B\u4E0D\u53D7\u5F71\u54CD\u3002\u6B64\u9875\u663E\u793A\u8BC6\u522B\u94FE\u8DEF\u5F53\u524D\u662F\u5426\u53EF\u7528\u3002",
    stateReady: "\u53EF\u7528",
    stateUnconfigured: "\u672A\u914D\u7F6E",
    stateFailing: "\u8BC6\u522B\u5931\u8D25",
    stateOff: "\u672A\u52A0\u8F7D",
    readyHint: "\u7EAF\u6587\u672C\u6A21\u578B\u53D1\u9001\u56FE\u7247\u65F6\u4F1A\u81EA\u52A8\u8BC6\u522B\uFF1B\u53EF\u968F\u65F6\u6267\u884C\u63A2\u67E5\u786E\u8BA4\u5F53\u524D\u5F15\u64CE\u771F\u5B9E\u53EF\u7528\u3002",
    unconfiguredHint: "\u5C1A\u672A\u914D\u7F6E\u89C6\u89C9\u5F15\u64CE\u3002\u7EAF\u6587\u672C\u6A21\u578B\u53D1\u9001\u56FE\u7247\u65F6\u4E0D\u4F1A\u88AB\u8BC6\u522B\uFF0C\u6A21\u578B\u4F1A\u660E\u786E\u6536\u5230\u201C\u56FE\u7247\u672A\u88AB\u8BFB\u53D6\u201D\u7684\u63D0\u793A\uFF0C\u4E0D\u4F1A\u51ED\u7A7A\u731C\u6D4B\u56FE\u7247\u5185\u5BB9\u3002",
    failingHint: "\u6700\u8FD1\u4E00\u6B21\u8BC6\u522B\u6216\u63A2\u67E5\u5931\u8D25\u3002\u70B9\u51FB\u201C\u63A2\u67E5\u201D\u4F1A\u771F\u5B9E\u8C03\u7528\u5F53\u524D\u89C6\u89C9\u5F15\u64CE\uFF1B\u6210\u529F\u540E\u7ACB\u5373\u6062\u590D\u4E3A\u53EF\u7528\u3002",
    offHint: "ModLens \u672A\u5B89\u88C5\u6216\u672A\u52A0\u8F7D\uFF0C\u56FE\u7247\u65E0\u6CD5\u88AB\u8BC6\u522B\u3002",
    bridge: "\u8BC6\u522B\u6865",
    bridgeOn: "\u5DF2\u52A0\u8F7D",
    bridgeOff: "\u672A\u52A0\u8F7D",
    engines: "\u53EF\u7528\u5F15\u64CE",
    pinned: "\u5DF2\u56FA\u5B9A\u5F15\u64CE",
    visionModels: "\u89C6\u89C9\u6865\u6A21\u578B",
    lastProbe: "\u6700\u8FD1\u63A2\u67E5",
    probeResult: "\u63A2\u67E5\u7ED3\u679C",
    probeOk: "\u53EF\u7528",
    probeFailed: "\u4E0D\u53EF\u7528",
    probeEngine: "\u63A2\u67E5\u5F15\u64CE",
    probeModel: "\u63A2\u67E5\u6A21\u578B",
    probeDuration: "\u63A2\u67E5\u8017\u65F6",
    probeDurationValue: "{ms} ms",
    pinnedAuto: "\u81EA\u52A8\uFF08\u6545\u969C\u8F6C\u79FB\u94FE\uFF09",
    none: "\u65E0",
    lastOk: "\u6700\u8FD1\u6210\u529F",
    lastFail: "\u6700\u8FD1\u5931\u8D25",
    lastError: "\u6700\u540E\u9519\u8BEF",
    counters: "\u7D2F\u8BA1",
    countersValue: "\u6210\u529F {reads} / \u5931\u8D25 {failures} / \u672A\u8BC6\u522B {blocks}",
    never: "\u4ECE\u672A",
    refresh: "\u5237\u65B0\u72B6\u6001\u5E76\u63A2\u67E5",
    probing: "\u63A2\u67E5\u4E2D\u2026",
    loading: "\u52A0\u8F7D\u4E2D\u2026",
    loadFailed: "\u65E0\u6CD5\u8BFB\u53D6\u72B6\u6001",
    configHint: "\u5F15\u64CE\u914D\u7F6E\u5728\u201C\u8BBE\u7F6E \u2192 \u63D2\u4EF6 \u2192 \u89C6\u89C9\u5F15\u64CE\uFF08ModLens\uFF09\u201D\u4E2D\u4FEE\u6539\u3002\u539F\u751F\u591A\u6A21\u6001\u6A21\u578B\u59CB\u7EC8\u4F7F\u7528\u81EA\u8EAB\u80FD\u529B\uFF0C\u4E0D\u7ECF\u8FC7\u6B64\u94FE\u8DEF\u3002"
  },
  en: {
    nav: "Vision Status",
    heroMeta: "Image reading status for text-only models",
    lead: "When a text-only model receives an image, ModLens converts it to text evidence before the request is sent. Native multimodal models are untouched. This page shows whether that bridge works.",
    stateReady: "Ready",
    stateUnconfigured: "Not configured",
    stateFailing: "Failing",
    stateOff: "Not loaded",
    readyHint: "Images sent to a text-only model are read automatically. Run a probe at any time to verify the active engine.",
    unconfiguredHint: "No vision engine is configured. Images sent to a text-only model are not read; the model is told explicitly that the image was not read and will not guess at its contents.",
    failingHint: "The latest image read or probe failed. Run a probe to call the current vision engine; a successful probe immediately restores Ready.",
    offHint: "ModLens is not installed or not loaded, so images cannot be read.",
    bridge: "Bridge",
    bridgeOn: "Loaded",
    bridgeOff: "Not loaded",
    engines: "Usable engines",
    pinned: "Pinned engine",
    visionModels: "Vision bridge models",
    lastProbe: "Last probe",
    probeResult: "Probe result",
    probeOk: "Ready",
    probeFailed: "Unavailable",
    probeEngine: "Probe engine",
    probeModel: "Probe model",
    probeDuration: "Probe duration",
    probeDurationValue: "{ms} ms",
    pinnedAuto: "Automatic (failover chain)",
    none: "None",
    lastOk: "Last success",
    lastFail: "Last failure",
    lastError: "Last error",
    counters: "Totals",
    countersValue: "{reads} read / {failures} failed / {blocks} unread",
    never: "Never",
    refresh: "Refresh and probe",
    probing: "Probing\u2026",
    loading: "Loading\u2026",
    loadFailed: "Cannot read status",
    configHint: "Configure engines under Settings \u2192 Plugins \u2192 Vision engine (ModLens). Native multimodal models always use their own capability and never pass through this bridge."
  }
};
function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, NS_DICT), "modlens-guard: copy dictionaries");
  const t = ctx.locale.bind(NS);
  const injected = () => ({ t });
  ctx.slots.inject(
    "conversation.chat.turnTail",
    () => ctx.slots.register(
      {
        name: "conversation.chat.turnTail",
        select: (owner) => owner?.turn ?? null,
        locale: NS
      },
      ModlensTurnTail
    )
  );
  ctx.slots.inject(
    "settings.section",
    () => ctx.slots.register(
      {
        name: "settings.section",
        id: "modlens-guard",
        order: 12,
        label: () => t("nav"),
        inject: injected
      },
      ModlensGuardSection
    )
  );
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZ3VhcmQvc3JjL2NsaWVudC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gZHNoLW1vZGxlbnMtZ3VhcmQgXHUyMDE0XHUyMDE0IGNsaWVudCBcdTdBRUZcdUZGMDhcdTZENEZcdTg5QzhcdTU2NjhcdUZGMDlcbi8vIFx1NTcyOFx1OEJCRVx1N0Y2RVx1OTg3NVx1NkNFOFx1NTE4Q1x1MzAwQ1x1ODlDNlx1ODlDOVx1NzJCNlx1NjAwMVx1MzAwRHNlY3Rpb25cdUZGMUFcdTY2M0VcdTc5M0FcdTdFQUZcdTY1ODdcdTY3MkNcdTZBMjFcdTU3OEJcdTc2ODRcdTU2RkVcdTcyNDdcdThCQzZcdTUyMkJcdTk0RkVcdThERUZcdTY2MkZcdTU0MjZcdTUzRUZcdTc1MjhcdTMwMDJcbi8vIFx1N0VBRlx1NjU4N1x1NjcyQ1x1NkEyMVx1NTc4Qlx1NjUzNlx1NTIzMFx1NTZGRVx1NzI0N1x1NjVGNlx1NzUzMSBNb2RMZW5zIFx1NTcyOFx1NTNEMVx1OTAwMVx1NTI0RFx1OEY2Q1x1NTE5OVx1RkYxQlx1NTM5Rlx1NzUxRlx1NTkxQVx1NkEyMVx1NjAwMVx1NkEyMVx1NTc4Qlx1NEUwRFx1NTNEN1x1NUY3MVx1NTRDRFx1MzAwMlxuaW1wb3J0IHsgdXNlU3RhdGUsIHVzZUVmZmVjdCwgdXNlQ2FsbGJhY2sgfSBmcm9tIFwicmVhY3RcIjtcblxuY29uc3QgTlMgPSBcInNldHRpbmdzLm1vZGxlbnMtZ3VhcmRcIjtcblxuY29uc3QgVE9ORSA9IHtcbiAgcmVhZHk6IHsgZmc6IFwiIzBmN2IzZlwiLCBiZzogXCJyZ2JhKDE2LDE2Myw3NCwwLjEyKVwiLCBib3JkZXI6IFwicmdiYSgxNiwxNjMsNzQsMC4zNSlcIiB9LFxuICB1bmNvbmZpZ3VyZWQ6IHsgZmc6IFwiIzhhNTMwMFwiLCBiZzogXCJyZ2JhKDIxNywxMTksNiwwLjEyKVwiLCBib3JkZXI6IFwicmdiYSgyMTcsMTE5LDYsMC4zNSlcIiB9LFxuICBmYWlsaW5nOiB7IGZnOiBcIiNiMzI2MWVcIiwgYmc6IFwicmdiYSgyMjAsMzgsMzgsMC4xMilcIiwgYm9yZGVyOiBcInJnYmEoMjIwLDM4LDM4LDAuMzUpXCIgfSxcbiAgb2ZmOiB7IGZnOiBcIiM1YjYyNzBcIiwgYmc6IFwicmdiYSgxMDcsMTE0LDEyOCwwLjEyKVwiLCBib3JkZXI6IFwicmdiYSgxMDcsMTE0LDEyOCwwLjM1KVwiIH1cbn07XG5cbmNvbnN0IGNzcyA9IHtcbiAgc2VjdGlvbjogeyBtYXhXaWR0aDogNzYwLCBjb2xvcjogXCJ2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgIzFmMjMyOSlcIiwgZm9udEZhbWlseTogXCJpbmhlcml0XCIgfSxcbiAgaGVybzogeyBkaXNwbGF5OiBcImZsZXhcIiwgYWxpZ25JdGVtczogXCJjZW50ZXJcIiwgZ2FwOiAxNCwgbWFyZ2luQm90dG9tOiAxMiB9LFxuICBoZXJvSWNvbjogeyBmbGV4OiBcIm5vbmVcIiwgY29sb3I6IFwidmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNmI3MjgwKVwiIH0sXG4gIGhlcm9UaXRsZTogeyBmb250U2l6ZTogMjAsIGZvbnRXZWlnaHQ6IDY1MCwgbGV0dGVyU3BhY2luZzogMC4yIH0sXG4gIGhlcm9NZXRhOiB7IGZvbnRTaXplOiAxNCwgY29sb3I6IFwidmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNmI3MjgwKVwiIH0sXG4gIGxlYWQ6IHsgZm9udFNpemU6IDE1LCBsaW5lSGVpZ2h0OiAxLjcsIGNvbG9yOiBcInZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzZiNzI4MClcIiwgbWFyZ2luOiBcIjAgMCAxOHB4XCIgfSxcbiAgY2FyZDoge1xuICAgIGJvcmRlcjogXCIxcHggc29saWQgY29sb3ItbWl4KGluIHNyZ2IsIHZhcigtLWRzdy1hbGlhcy1ib3JkZXItbDIsICNlNWU3ZWIpIDg4JSwgdHJhbnNwYXJlbnQpXCIsXG4gICAgYm9yZGVyUmFkaXVzOiAxNCxcbiAgICBwYWRkaW5nOiBcIjE2cHggMThweCAxOHB4XCIsXG4gICAgbWFyZ2luQm90dG9tOiAxNixcbiAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICBmbGV4RGlyZWN0aW9uOiBcImNvbHVtblwiLFxuICAgIGdhcDogMTQsXG4gICAgYmFja2dyb3VuZDogXCJjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tZHN3LWFsaWFzLWJnLWJhc2UsICNmZmZmZmYpIDg0JSwgdHJhbnNwYXJlbnQpXCIsXG4gICAgYm94U2hhZG93OiBcIjAgOHB4IDI0cHggcmdiKDAgMCAwIC8gMC4wOCksIGluc2V0IDAgMXB4IDAgcmdiKDI1NSAyNTUgMjU1IC8gMC4wNilcIlxuICB9LFxuICByb3c6IHsgZGlzcGxheTogXCJmbGV4XCIsIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsIGdhcDogMTIsIGZsZXhXcmFwOiBcIndyYXBcIiB9LFxuICBiYWRnZToge1xuICAgIGRpc3BsYXk6IFwiaW5saW5lLWZsZXhcIixcbiAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICAgIGdhcDogOCxcbiAgICBwYWRkaW5nOiBcIjZweCAxNHB4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiA5OTksXG4gICAgZm9udFNpemU6IDE1LFxuICAgIGZvbnRXZWlnaHQ6IDY1MCxcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkXCJcbiAgfSxcbiAgZG90OiB7IHdpZHRoOiA5LCBoZWlnaHQ6IDksIGJvcmRlclJhZGl1czogOTk5LCBiYWNrZ3JvdW5kOiBcImN1cnJlbnRDb2xvclwiIH0sXG4gIGhpbnQ6IHsgZm9udFNpemU6IDE1LCBsaW5lSGVpZ2h0OiAxLjcgfSxcbiAgZ3JpZDogeyBkaXNwbGF5OiBcImdyaWRcIiwgZ3JpZFRlbXBsYXRlQ29sdW1uczogXCJtaW5tYXgoMTEwcHgsIDE4MHB4KSAxZnJcIiwgZ2FwOiBcIjEycHggMThweFwiLCBmb250U2l6ZTogMTUgfSxcbiAga2V5OiB7IGNvbG9yOiBcInZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzZiNzI4MClcIiB9LFxuICB2YWw6IHsgd29yZEJyZWFrOiBcImJyZWFrLXdvcmRcIiB9LFxuICBlcnI6IHsgZm9udEZhbWlseTogXCJ1aS1tb25vc3BhY2UsIFNGTW9uby1SZWd1bGFyLCBNZW5sbywgbW9ub3NwYWNlXCIsIGZvbnRTaXplOiAxNCB9LFxuICBidG46IHtcbiAgICBwYWRkaW5nOiBcIjdweCAxNXB4XCIsXG4gICAgZm9udFNpemU6IDE1LFxuICAgIGJvcmRlclJhZGl1czogOCxcbiAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgIGJvcmRlcjogXCIxcHggc29saWQgY29sb3ItbWl4KGluIHNyZ2IsIHZhcigtLWRzdy1hbGlhcy1ib3JkZXItbDIsICNlNWU3ZWIpIDg4JSwgdHJhbnNwYXJlbnQpXCIsXG4gICAgYmFja2dyb3VuZDogXCJjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tZHN3LWFsaWFzLWJnLWJhc2UsICNmZmZmZmYpIDYwJSwgdHJhbnNwYXJlbnQpXCIsXG4gICAgY29sb3I6IFwiaW5oZXJpdFwiLFxuICAgIGZvbnRXZWlnaHQ6IDYwMFxuICB9LFxuICBmb290OiB7XG4gICAgZm9udFNpemU6IDE0LFxuICAgIGxpbmVIZWlnaHQ6IDEuNyxcbiAgICBjb2xvcjogXCJ2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2YjcyODApXCIsXG4gICAgYm9yZGVyVG9wOiBcIjFweCBzb2xpZCBjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tZHN3LWFsaWFzLWJvcmRlci1sMiwgI2U1ZTdlYikgNzAlLCB0cmFuc3BhcmVudClcIixcbiAgICBwYWRkaW5nVG9wOiAxNFxuICB9XG59O1xuXG5mdW5jdGlvbiBIZXJvSWNvbigpIHtcbiAgcmV0dXJuIChcbiAgICA8c3ZnIHdpZHRoPVwiMzRcIiBoZWlnaHQ9XCIzNFwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZVdpZHRoPVwiMS43XCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+XG4gICAgICA8cGF0aCBkPVwiTTQgNy41IDEyIDNsOCA0LjV2OUwxMiAyMWwtOC00LjV6XCIgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiIC8+XG4gICAgICA8cGF0aCBkPVwibTQgNy41IDggNC41IDgtNC41TTEyIDEydjlcIiBzdHJva2VMaW5lY2FwPVwicm91bmRcIiBzdHJva2VMaW5lam9pbj1cInJvdW5kXCIgLz5cbiAgICAgIDxjaXJjbGUgY3g9XCIxMlwiIGN5PVwiMTJcIiByPVwiMi4xXCIgZmlsbD1cImN1cnJlbnRDb2xvclwiIHN0cm9rZT1cIm5vbmVcIiAvPlxuICAgIDwvc3ZnPlxuICApO1xufVxuXG5mdW5jdGlvbiBzdGFtcCh2YWx1ZSwgbmV2ZXIpIHtcbiAgaWYgKCF2YWx1ZSkgcmV0dXJuIG5ldmVyO1xuICB0cnkge1xuICAgIHJldHVybiBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCh1bmRlZmluZWQsIHsgZGF0ZVN0eWxlOiBcIm1lZGl1bVwiLCB0aW1lU3R5bGU6IFwibWVkaXVtXCIgfSkuZm9ybWF0KG5ldyBEYXRlKHZhbHVlKSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBTdHJpbmcodmFsdWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIE1vZGxlbnNHdWFyZFNlY3Rpb24oeyB0IH0pIHtcbiAgY29uc3QgW3N0YXR1cywgc2V0U3RhdHVzXSA9IHVzZVN0YXRlKG51bGwpO1xuICBjb25zdCBbZXJyb3IsIHNldEVycm9yXSA9IHVzZVN0YXRlKFwiXCIpO1xuICBjb25zdCBbbG9hZGluZywgc2V0TG9hZGluZ10gPSB1c2VTdGF0ZSh0cnVlKTtcbiAgY29uc3QgW3Byb2JpbmcsIHNldFByb2JpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIGNvbnN0IGxvYWQgPSB1c2VDYWxsYmFjayhhc3luYyAoKSA9PiB7XG4gICAgc2V0TG9hZGluZyh0cnVlKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goXCIvbW9kbGVucy1ndWFyZC9zdGF0dXNcIik7XG4gICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmICghcmVzLm9rIHx8IGJvZHkub2sgIT09IHRydWUpIHRocm93IG5ldyBFcnJvcihib2R5LmVycm9yIHx8IGBIVFRQICR7cmVzLnN0YXR1c31gKTtcbiAgICAgIHNldFN0YXR1cyhib2R5LnN0YXR1cyk7XG4gICAgICBzZXRFcnJvcihcIlwiKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBzZXRFcnJvcihlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSkpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRMb2FkaW5nKGZhbHNlKTtcbiAgICB9XG4gIH0sIFtdKTtcblxuICBjb25zdCBwcm9iZSA9IHVzZUNhbGxiYWNrKGFzeW5jICgpID0+IHtcbiAgICBzZXRQcm9iaW5nKHRydWUpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChcIi9tb2RsZW5zLWd1YXJkL3Byb2JlXCIsIHsgbWV0aG9kOiBcIlBPU1RcIiB9KTtcbiAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgc2V0U3RhdHVzKGJvZHkuc3RhdHVzID8/IG51bGwpO1xuICAgICAgaWYgKCFyZXMub2sgfHwgYm9keS5vayAhPT0gdHJ1ZSkgdGhyb3cgbmV3IEVycm9yKGJvZHkucmVzdWx0Py5lcnJvciB8fCBib2R5LmVycm9yIHx8IGBIVFRQICR7cmVzLnN0YXR1c31gKTtcbiAgICAgIHNldEVycm9yKFwiXCIpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHNldEVycm9yKGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldFByb2JpbmcoZmFsc2UpO1xuICAgIH1cbiAgfSwgW10pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgdm9pZCBsb2FkKCk7XG4gICAgY29uc3QgdGltZXIgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4gdm9pZCBsb2FkKCksIDE1MDAwKTtcbiAgICByZXR1cm4gKCkgPT4gd2luZG93LmNsZWFySW50ZXJ2YWwodGltZXIpO1xuICB9LCBbbG9hZF0pO1xuXG4gIGNvbnN0IHN0YXRlID0gc3RhdHVzPy5zdGF0ZSA/PyBcIm9mZlwiO1xuICBjb25zdCB0b25lID0gVE9ORVtzdGF0ZV0gPz8gVE9ORS5vZmY7XG4gIGNvbnN0IHN0YXRlTGFiZWwgPSB0KFxuICAgIHN0YXRlID09PSBcInJlYWR5XCIgPyBcInN0YXRlUmVhZHlcIiA6IHN0YXRlID09PSBcInVuY29uZmlndXJlZFwiID8gXCJzdGF0ZVVuY29uZmlndXJlZFwiIDogc3RhdGUgPT09IFwiZmFpbGluZ1wiID8gXCJzdGF0ZUZhaWxpbmdcIiA6IFwic3RhdGVPZmZcIlxuICApO1xuICBjb25zdCBzdGF0ZUhpbnQgPSB0KFxuICAgIHN0YXRlID09PSBcInJlYWR5XCIgPyBcInJlYWR5SGludFwiIDogc3RhdGUgPT09IFwidW5jb25maWd1cmVkXCIgPyBcInVuY29uZmlndXJlZEhpbnRcIiA6IHN0YXRlID09PSBcImZhaWxpbmdcIiA/IFwiZmFpbGluZ0hpbnRcIiA6IFwib2ZmSGludFwiXG4gICk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHN0eWxlPXtjc3Muc2VjdGlvbn0+XG4gICAgICA8ZGl2IHN0eWxlPXtjc3MuaGVyb30+XG4gICAgICAgIDxzcGFuIHN0eWxlPXtjc3MuaGVyb0ljb259PlxuICAgICAgICAgIDxIZXJvSWNvbiAvPlxuICAgICAgICA8L3NwYW4+XG4gICAgICAgIDxkaXY+XG4gICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmhlcm9UaXRsZX0+e3QoXCJuYXZcIil9PC9kaXY+XG4gICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmhlcm9NZXRhfT57dChcImhlcm9NZXRhXCIpfTwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPHAgc3R5bGU9e2Nzcy5sZWFkfT57dChcImxlYWRcIil9PC9wPlxuXG4gICAgICA8ZGl2IHN0eWxlPXtjc3MuY2FyZH0+XG4gICAgICAgIDxkaXYgc3R5bGU9e2Nzcy5yb3d9PlxuICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IC4uLmNzcy5iYWRnZSwgY29sb3I6IHRvbmUuZmcsIGJhY2tncm91bmQ6IHRvbmUuYmcsIGJvcmRlckNvbG9yOiB0b25lLmJvcmRlciB9fT5cbiAgICAgICAgICAgIDxzcGFuIHN0eWxlPXtjc3MuZG90fSAvPlxuICAgICAgICAgICAge3N0YXRlTGFiZWx9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIHN0eWxlPXtjc3MuYnRufSBvbkNsaWNrPXsoKSA9PiB2b2lkIHByb2JlKCl9IGRpc2FibGVkPXtsb2FkaW5nIHx8IHByb2Jpbmd9PlxuICAgICAgICAgICAge3Byb2JpbmcgPyB0KFwicHJvYmluZ1wiKSA6IHQoXCJyZWZyZXNoXCIpfVxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IHN0eWxlPXtjc3MuaGludH0+e3N0YXRlSGludH08L2Rpdj5cbiAgICAgICAge2Vycm9yICE9PSBcIlwiICYmIDxkaXYgc3R5bGU9e3sgLi4uY3NzLmhpbnQsIGNvbG9yOiBUT05FLmZhaWxpbmcuZmcgfX0+e2Ake3QoXCJsb2FkRmFpbGVkXCIpfTogJHtlcnJvcn1gfTwvZGl2Pn1cblxuICAgICAgICB7c3RhdHVzICE9PSBudWxsICYmIChcbiAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3MuZ3JpZH0+XG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3Mua2V5fT57dChcImJyaWRnZVwiKX08L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy52YWx9PntzdGF0dXMucGx1Z2luTG9hZGVkID8gdChcImJyaWRnZU9uXCIpIDogdChcImJyaWRnZU9mZlwiKX08L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmtleX0+e3QoXCJlbmdpbmVzXCIpfTwvZGl2PlxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLnZhbH0+e3N0YXR1cy5lbmdpbmVzPy5sZW5ndGggPiAwID8gc3RhdHVzLmVuZ2luZXMuam9pbihcIiwgXCIpIDogdChcIm5vbmVcIil9PC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy5rZXl9Pnt0KFwicGlubmVkXCIpfTwvZGl2PlxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLnZhbH0+e3N0YXR1cy5waW5uZWQgfHwgdChcInBpbm5lZEF1dG9cIil9PC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy5rZXl9Pnt0KFwidmlzaW9uTW9kZWxzXCIpfTwvZGl2PlxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLnZhbH0+e3N0YXR1cy52aXNpb25Qcm92aWRlcnM/Lmxlbmd0aCA+IDAgPyBzdGF0dXMudmlzaW9uUHJvdmlkZXJzLmpvaW4oXCIsIFwiKSA6IHQoXCJub25lXCIpfTwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3Mua2V5fT57dChcImxhc3RQcm9iZVwiKX08L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy52YWx9PntzdGF0dXMucHJvYmVBdCA/IHN0YW1wKHN0YXR1cy5wcm9iZUF0LCB0KFwibmV2ZXJcIikpIDogdChcIm5ldmVyXCIpfTwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3Mua2V5fT57dChcInByb2JlUmVzdWx0XCIpfTwvZGl2PlxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLnZhbH0+e3N0YXR1cy5wcm9iZU9rID09PSBudWxsID8gdChcIm5ldmVyXCIpIDogc3RhdHVzLnByb2JlT2sgPyB0KFwicHJvYmVPa1wiKSA6IHQoXCJwcm9iZUZhaWxlZFwiKX08L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmtleX0+e3QoXCJwcm9iZUVuZ2luZVwiKX08L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy52YWx9PntzdGF0dXMucHJvYmVQcm92aWRlciB8fCB0KFwibm9uZVwiKX08L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmtleX0+e3QoXCJwcm9iZU1vZGVsXCIpfTwvZGl2PlxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLnZhbH0+e3N0YXR1cy5wcm9iZU1vZGVsIHx8IHQoXCJub25lXCIpfTwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3Mua2V5fT57dChcInByb2JlRHVyYXRpb25cIil9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3MudmFsfT57dHlwZW9mIHN0YXR1cy5wcm9iZUR1cmF0aW9uTXMgPT09IFwibnVtYmVyXCIgPyB0KFwicHJvYmVEdXJhdGlvblZhbHVlXCIpLnJlcGxhY2UoXCJ7bXN9XCIsIFN0cmluZyhzdGF0dXMucHJvYmVEdXJhdGlvbk1zKSkgOiB0KFwibmV2ZXJcIil9PC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy5rZXl9Pnt0KFwibGFzdE9rXCIpfTwvZGl2PlxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLnZhbH0+e3N0YW1wKHN0YXR1cy5sYXN0T2tBdCwgdChcIm5ldmVyXCIpKX08L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmtleX0+e3QoXCJsYXN0RmFpbFwiKX08L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy52YWx9PntzdGFtcChzdGF0dXMubGFzdEZhaWxBdCwgdChcIm5ldmVyXCIpKX08L2Rpdj5cblxuICAgICAgICAgICAge3N0YXR1cy5sYXN0RXJyb3IgJiYgKFxuICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy5rZXl9Pnt0KFwibGFzdEVycm9yXCIpfTwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgLi4uY3NzLnZhbCwgLi4uY3NzLmVyciB9fT57c3RhdHVzLmxhc3RFcnJvcn08L2Rpdj5cbiAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3Mua2V5fT57dChcImNvdW50ZXJzXCIpfTwvZGl2PlxuICAgICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLnZhbH0+XG4gICAgICAgICAgICAgIHt0KFwiY291bnRlcnNWYWx1ZVwiKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKFwie3JlYWRzfVwiLCBTdHJpbmcoc3RhdHVzLnJlYWRzID8/IDApKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKFwie2ZhaWx1cmVzfVwiLCBTdHJpbmcoc3RhdHVzLmZhaWx1cmVzID8/IDApKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKFwie2Jsb2Nrc31cIiwgU3RyaW5nKHN0YXR1cy5ibG9ja3MgPz8gMCkpfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmZvb3R9Pnt0KFwiY29uZmlnSGludFwiKX08L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApO1xufVxuXG5mdW5jdGlvbiBNb2RsZW5zVHVyblN0YXR1cyh7IG1hdGNoZWQsIHNlc3Npb25JZCB9KSB7XG4gIGNvbnN0IFtzdGF0dXMsIHNldFN0YXR1c10gPSB1c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgdHVybiA9IG1hdGNoZWQ7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIXR1cm4gfHwgIU51bWJlci5pc0ludGVnZXIodHVybi50dXJuKSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBsZXQgY2FuY2VsbGVkID0gZmFsc2U7XG4gICAgbGV0IHRpbWVyO1xuICAgIGNvbnN0IGxvYWQgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAvbW9kbGVucy1ndWFyZC90dXJuLXN0YXR1cz90dXJuPSR7ZW5jb2RlVVJJQ29tcG9uZW50KFN0cmluZyh0dXJuLnR1cm4pKX0mc2Vzc2lvbklkPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHNlc3Npb25JZCl9YCk7XG4gICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICAgIGNvbnN0IG5leHQgPSBib2R5LnN0YXR1cyA/PyBudWxsO1xuICAgICAgICBpZiAoY2FuY2VsbGVkKSByZXR1cm47XG4gICAgICAgIHNldFN0YXR1cyhuZXh0KTtcbiAgICAgICAgaWYgKG5leHQ/LnN0YXRlID09PSBcInJlYWR5XCIgfHwgbmV4dD8uc3RhdGUgPT09IFwiZmFpbGVkXCIpIHtcbiAgICAgICAgICBpZiAodGltZXIpIHdpbmRvdy5jbGVhckludGVydmFsKHRpbWVyKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7fVxuICAgIH07XG4gICAgdm9pZCBsb2FkKCk7XG4gICAgdGltZXIgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4gdm9pZCBsb2FkKCksIDUwMCk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGNhbmNlbGxlZCA9IHRydWU7XG4gICAgICBpZiAodGltZXIpIHdpbmRvdy5jbGVhckludGVydmFsKHRpbWVyKTtcbiAgICB9O1xuICB9LCBbdHVybiwgc2Vzc2lvbklkXSk7XG5cbiAgaWYgKCFzdGF0dXMgfHwgKHN0YXR1cy5zdGF0ZSAhPT0gXCJyZWFkeVwiICYmIHN0YXR1cy5zdGF0ZSAhPT0gXCJmYWlsZWRcIikpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IGZhaWxlZCA9IHN0YXR1cy5zdGF0ZSA9PT0gXCJmYWlsZWRcIjtcbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICBzdHlsZT17e1xuICAgICAgICBjb2xvcjogZmFpbGVkID8gVE9ORS5mYWlsaW5nLmZnIDogXCJ2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2YjcyODApXCIsXG4gICAgICAgIGZvbnRTaXplOiAxMyxcbiAgICAgICAgbGluZUhlaWdodDogMS41LFxuICAgICAgICBtYXJnaW46IFwiNnB4IDAgMCAycHhcIlxuICAgICAgfX1cbiAgICA+XG4gICAgICB7ZmFpbGVkID8gXCJNb2RMZW5zIFx1MDBCNyBcdTU2RkVcdTcyNDdcdThCRkJcdTUzRDZcdTU5MzFcdThEMjVcIiA6IFwiTW9kTGVucyBcdTAwQjcgXHU1REYyXHU4QkZCXHU1M0Q2XHU1NkZFXHU3MjQ3XCJ9XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbmZ1bmN0aW9uIE1vZGxlbnNUdXJuVGFpbCh7IG1hdGNoZWQsIHNlc3Npb25JZCB9KSB7XG4gIHJldHVybiA8TW9kbGVuc1R1cm5TdGF0dXMgbWF0Y2hlZD17bWF0Y2hlZH0gc2Vzc2lvbklkPXtzZXNzaW9uSWR9IC8+O1xufVxuXG4vLyBcdTI1MDBcdTI1MDAgXHU2M0QyXHU0RUY2XHU1MTY1XHU1M0UzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuY29uc3QgaW5qZWN0ID0gW1wic2xvdHNcIiwgXCJsb2NhbGVcIl07XG5cbmNvbnN0IE5TX0RJQ1QgPSB7ICB6aDoge1xuICAgIG5hdjogXCJcdTg5QzZcdTg5QzlcdTcyQjZcdTYwMDFcIixcbiAgICBoZXJvTWV0YTogXCJcdTdFQUZcdTY1ODdcdTY3MkNcdTZBMjFcdTU3OEJcdTc2ODRcdTU2RkVcdTcyNDdcdThCQzZcdTUyMkJcdTcyQjZcdTYwMDFcIixcbiAgICBsZWFkOiBcIlx1N0VBRlx1NjU4N1x1NjcyQ1x1NkEyMVx1NTc4Qlx1NjUzNlx1NTIzMFx1NTZGRVx1NzI0N1x1NjVGNlx1RkYwQ1x1NzUzMSBNb2RMZW5zIFx1NTcyOFx1NTNEMVx1OTAwMVx1NTI0RFx1NjI4QVx1NTZGRVx1NzI0N1x1OEY2Q1x1NjIxMFx1NjU4N1x1NUI1N1x1OEJDMVx1NjM2RVx1RkYxQlx1NTM5Rlx1NzUxRlx1NTkxQVx1NkEyMVx1NjAwMVx1NkEyMVx1NTc4Qlx1NEUwRFx1NTNEN1x1NUY3MVx1NTRDRFx1MzAwMlx1NkI2NFx1OTg3NVx1NjYzRVx1NzkzQVx1OEJDNlx1NTIyQlx1OTRGRVx1OERFRlx1NUY1M1x1NTI0RFx1NjYyRlx1NTQyNlx1NTNFRlx1NzUyOFx1MzAwMlwiLFxuICAgIHN0YXRlUmVhZHk6IFwiXHU1M0VGXHU3NTI4XCIsXG4gICAgc3RhdGVVbmNvbmZpZ3VyZWQ6IFwiXHU2NzJBXHU5MTREXHU3RjZFXCIsXG4gICAgc3RhdGVGYWlsaW5nOiBcIlx1OEJDNlx1NTIyQlx1NTkzMVx1OEQyNVwiLFxuICAgIHN0YXRlT2ZmOiBcIlx1NjcyQVx1NTJBMFx1OEY3RFwiLFxuICAgIHJlYWR5SGludDogXCJcdTdFQUZcdTY1ODdcdTY3MkNcdTZBMjFcdTU3OEJcdTUzRDFcdTkwMDFcdTU2RkVcdTcyNDdcdTY1RjZcdTRGMUFcdTgxRUFcdTUyQThcdThCQzZcdTUyMkJcdUZGMUJcdTUzRUZcdTk2OEZcdTY1RjZcdTYyNjdcdTg4NENcdTYzQTJcdTY3RTVcdTc4NkVcdThCQTRcdTVGNTNcdTUyNERcdTVGMTVcdTY0Q0VcdTc3MUZcdTVCOUVcdTUzRUZcdTc1MjhcdTMwMDJcIixcbiAgICB1bmNvbmZpZ3VyZWRIaW50OiBcIlx1NUMxQVx1NjcyQVx1OTE0RFx1N0Y2RVx1ODlDNlx1ODlDOVx1NUYxNVx1NjRDRVx1MzAwMlx1N0VBRlx1NjU4N1x1NjcyQ1x1NkEyMVx1NTc4Qlx1NTNEMVx1OTAwMVx1NTZGRVx1NzI0N1x1NjVGNlx1NEUwRFx1NEYxQVx1ODhBQlx1OEJDNlx1NTIyQlx1RkYwQ1x1NkEyMVx1NTc4Qlx1NEYxQVx1NjYwRVx1Nzg2RVx1NjUzNlx1NTIzMFx1MjAxQ1x1NTZGRVx1NzI0N1x1NjcyQVx1ODhBQlx1OEJGQlx1NTNENlx1MjAxRFx1NzY4NFx1NjNEMFx1NzkzQVx1RkYwQ1x1NEUwRFx1NEYxQVx1NTFFRFx1N0E3QVx1NzMxQ1x1NkQ0Qlx1NTZGRVx1NzI0N1x1NTE4NVx1NUJCOVx1MzAwMlwiLFxuICAgIGZhaWxpbmdIaW50OiBcIlx1NjcwMFx1OEZEMVx1NEUwMFx1NkIyMVx1OEJDNlx1NTIyQlx1NjIxNlx1NjNBMlx1NjdFNVx1NTkzMVx1OEQyNVx1MzAwMlx1NzBCOVx1NTFGQlx1MjAxQ1x1NjNBMlx1NjdFNVx1MjAxRFx1NEYxQVx1NzcxRlx1NUI5RVx1OEMwM1x1NzUyOFx1NUY1M1x1NTI0RFx1ODlDNlx1ODlDOVx1NUYxNVx1NjRDRVx1RkYxQlx1NjIxMFx1NTI5Rlx1NTQwRVx1N0FDQlx1NTM3M1x1NjA2Mlx1NTkwRFx1NEUzQVx1NTNFRlx1NzUyOFx1MzAwMlwiLFxuICAgIG9mZkhpbnQ6IFwiTW9kTGVucyBcdTY3MkFcdTVCODlcdTg4QzVcdTYyMTZcdTY3MkFcdTUyQTBcdThGN0RcdUZGMENcdTU2RkVcdTcyNDdcdTY1RTBcdTZDRDVcdTg4QUJcdThCQzZcdTUyMkJcdTMwMDJcIixcbiAgICBicmlkZ2U6IFwiXHU4QkM2XHU1MjJCXHU2ODY1XCIsXG4gICAgYnJpZGdlT246IFwiXHU1REYyXHU1MkEwXHU4RjdEXCIsXG4gICAgYnJpZGdlT2ZmOiBcIlx1NjcyQVx1NTJBMFx1OEY3RFwiLFxuICAgIGVuZ2luZXM6IFwiXHU1M0VGXHU3NTI4XHU1RjE1XHU2NENFXCIsXG4gICAgcGlubmVkOiBcIlx1NURGMlx1NTZGQVx1NUI5QVx1NUYxNVx1NjRDRVwiLFxuICAgIHZpc2lvbk1vZGVsczogXCJcdTg5QzZcdTg5QzlcdTY4NjVcdTZBMjFcdTU3OEJcIixcbiAgICBsYXN0UHJvYmU6IFwiXHU2NzAwXHU4RkQxXHU2M0EyXHU2N0U1XCIsXG4gICAgcHJvYmVSZXN1bHQ6IFwiXHU2M0EyXHU2N0U1XHU3RUQzXHU2NzlDXCIsXG4gICAgcHJvYmVPazogXCJcdTUzRUZcdTc1MjhcIixcbiAgICBwcm9iZUZhaWxlZDogXCJcdTRFMERcdTUzRUZcdTc1MjhcIixcbiAgICBwcm9iZUVuZ2luZTogXCJcdTYzQTJcdTY3RTVcdTVGMTVcdTY0Q0VcIixcbiAgICBwcm9iZU1vZGVsOiBcIlx1NjNBMlx1NjdFNVx1NkEyMVx1NTc4QlwiLFxuICAgIHByb2JlRHVyYXRpb246IFwiXHU2M0EyXHU2N0U1XHU4MDE3XHU2NUY2XCIsXG4gICAgcHJvYmVEdXJhdGlvblZhbHVlOiBcInttc30gbXNcIixcbiAgICBwaW5uZWRBdXRvOiBcIlx1ODFFQVx1NTJBOFx1RkYwOFx1NjU0NVx1OTY5Q1x1OEY2Q1x1NzlGQlx1OTRGRVx1RkYwOVwiLFxuICAgIG5vbmU6IFwiXHU2NUUwXCIsXG4gICAgbGFzdE9rOiBcIlx1NjcwMFx1OEZEMVx1NjIxMFx1NTI5RlwiLFxuICAgIGxhc3RGYWlsOiBcIlx1NjcwMFx1OEZEMVx1NTkzMVx1OEQyNVwiLFxuICAgIGxhc3RFcnJvcjogXCJcdTY3MDBcdTU0MEVcdTk1MTlcdThCRUZcIixcbiAgICBjb3VudGVyczogXCJcdTdEMkZcdThCQTFcIixcbiAgICBjb3VudGVyc1ZhbHVlOiBcIlx1NjIxMFx1NTI5RiB7cmVhZHN9IC8gXHU1OTMxXHU4RDI1IHtmYWlsdXJlc30gLyBcdTY3MkFcdThCQzZcdTUyMkIge2Jsb2Nrc31cIixcbiAgICBuZXZlcjogXCJcdTRFQ0VcdTY3MkFcIixcbiAgICByZWZyZXNoOiBcIlx1NTIzN1x1NjVCMFx1NzJCNlx1NjAwMVx1NUU3Nlx1NjNBMlx1NjdFNVwiLFxuICAgIHByb2Jpbmc6IFwiXHU2M0EyXHU2N0U1XHU0RTJEXHUyMDI2XCIsXG4gICAgbG9hZGluZzogXCJcdTUyQTBcdThGN0RcdTRFMkRcdTIwMjZcIixcbiAgICBsb2FkRmFpbGVkOiBcIlx1NjVFMFx1NkNENVx1OEJGQlx1NTNENlx1NzJCNlx1NjAwMVwiLFxuICAgIGNvbmZpZ0hpbnQ6IFwiXHU1RjE1XHU2NENFXHU5MTREXHU3RjZFXHU1NzI4XHUyMDFDXHU4QkJFXHU3RjZFIFx1MjE5MiBcdTYzRDJcdTRFRjYgXHUyMTkyIFx1ODlDNlx1ODlDOVx1NUYxNVx1NjRDRVx1RkYwOE1vZExlbnNcdUZGMDlcdTIwMURcdTRFMkRcdTRGRUVcdTY1MzlcdTMwMDJcdTUzOUZcdTc1MUZcdTU5MUFcdTZBMjFcdTYwMDFcdTZBMjFcdTU3OEJcdTU5Q0JcdTdFQzhcdTRGN0ZcdTc1MjhcdTgxRUFcdThFQUJcdTgwRkRcdTUyOUJcdUZGMENcdTRFMERcdTdFQ0ZcdThGQzdcdTZCNjRcdTk0RkVcdThERUZcdTMwMDJcIlxuICB9LFxuICBlbjoge1xuICAgIG5hdjogXCJWaXNpb24gU3RhdHVzXCIsXG4gICAgaGVyb01ldGE6IFwiSW1hZ2UgcmVhZGluZyBzdGF0dXMgZm9yIHRleHQtb25seSBtb2RlbHNcIixcbiAgICBsZWFkOiBcIldoZW4gYSB0ZXh0LW9ubHkgbW9kZWwgcmVjZWl2ZXMgYW4gaW1hZ2UsIE1vZExlbnMgY29udmVydHMgaXQgdG8gdGV4dCBldmlkZW5jZSBiZWZvcmUgdGhlIHJlcXVlc3QgaXMgc2VudC4gTmF0aXZlIG11bHRpbW9kYWwgbW9kZWxzIGFyZSB1bnRvdWNoZWQuIFRoaXMgcGFnZSBzaG93cyB3aGV0aGVyIHRoYXQgYnJpZGdlIHdvcmtzLlwiLFxuICAgIHN0YXRlUmVhZHk6IFwiUmVhZHlcIixcbiAgICBzdGF0ZVVuY29uZmlndXJlZDogXCJOb3QgY29uZmlndXJlZFwiLFxuICAgIHN0YXRlRmFpbGluZzogXCJGYWlsaW5nXCIsXG4gICAgc3RhdGVPZmY6IFwiTm90IGxvYWRlZFwiLFxuICAgIHJlYWR5SGludDogXCJJbWFnZXMgc2VudCB0byBhIHRleHQtb25seSBtb2RlbCBhcmUgcmVhZCBhdXRvbWF0aWNhbGx5LiBSdW4gYSBwcm9iZSBhdCBhbnkgdGltZSB0byB2ZXJpZnkgdGhlIGFjdGl2ZSBlbmdpbmUuXCIsXG4gICAgdW5jb25maWd1cmVkSGludDpcbiAgICAgIFwiTm8gdmlzaW9uIGVuZ2luZSBpcyBjb25maWd1cmVkLiBJbWFnZXMgc2VudCB0byBhIHRleHQtb25seSBtb2RlbCBhcmUgbm90IHJlYWQ7IHRoZSBtb2RlbCBpcyB0b2xkIGV4cGxpY2l0bHkgdGhhdCB0aGUgaW1hZ2Ugd2FzIG5vdCByZWFkIGFuZCB3aWxsIG5vdCBndWVzcyBhdCBpdHMgY29udGVudHMuXCIsXG4gICAgZmFpbGluZ0hpbnQ6XG4gICAgICBcIlRoZSBsYXRlc3QgaW1hZ2UgcmVhZCBvciBwcm9iZSBmYWlsZWQuIFJ1biBhIHByb2JlIHRvIGNhbGwgdGhlIGN1cnJlbnQgdmlzaW9uIGVuZ2luZTsgYSBzdWNjZXNzZnVsIHByb2JlIGltbWVkaWF0ZWx5IHJlc3RvcmVzIFJlYWR5LlwiLFxuICAgIG9mZkhpbnQ6IFwiTW9kTGVucyBpcyBub3QgaW5zdGFsbGVkIG9yIG5vdCBsb2FkZWQsIHNvIGltYWdlcyBjYW5ub3QgYmUgcmVhZC5cIixcbiAgICBicmlkZ2U6IFwiQnJpZGdlXCIsXG4gICAgYnJpZGdlT246IFwiTG9hZGVkXCIsXG4gICAgYnJpZGdlT2ZmOiBcIk5vdCBsb2FkZWRcIixcbiAgICBlbmdpbmVzOiBcIlVzYWJsZSBlbmdpbmVzXCIsXG4gICAgcGlubmVkOiBcIlBpbm5lZCBlbmdpbmVcIixcbiAgICB2aXNpb25Nb2RlbHM6IFwiVmlzaW9uIGJyaWRnZSBtb2RlbHNcIixcbiAgICBsYXN0UHJvYmU6IFwiTGFzdCBwcm9iZVwiLFxuICAgIHByb2JlUmVzdWx0OiBcIlByb2JlIHJlc3VsdFwiLFxuICAgIHByb2JlT2s6IFwiUmVhZHlcIixcbiAgICBwcm9iZUZhaWxlZDogXCJVbmF2YWlsYWJsZVwiLFxuICAgIHByb2JlRW5naW5lOiBcIlByb2JlIGVuZ2luZVwiLFxuICAgIHByb2JlTW9kZWw6IFwiUHJvYmUgbW9kZWxcIixcbiAgICBwcm9iZUR1cmF0aW9uOiBcIlByb2JlIGR1cmF0aW9uXCIsXG4gICAgcHJvYmVEdXJhdGlvblZhbHVlOiBcInttc30gbXNcIixcbiAgICBwaW5uZWRBdXRvOiBcIkF1dG9tYXRpYyAoZmFpbG92ZXIgY2hhaW4pXCIsXG4gICAgbm9uZTogXCJOb25lXCIsXG4gICAgbGFzdE9rOiBcIkxhc3Qgc3VjY2Vzc1wiLFxuICAgIGxhc3RGYWlsOiBcIkxhc3QgZmFpbHVyZVwiLFxuICAgIGxhc3RFcnJvcjogXCJMYXN0IGVycm9yXCIsXG4gICAgY291bnRlcnM6IFwiVG90YWxzXCIsXG4gICAgY291bnRlcnNWYWx1ZTogXCJ7cmVhZHN9IHJlYWQgLyB7ZmFpbHVyZXN9IGZhaWxlZCAvIHtibG9ja3N9IHVucmVhZFwiLFxuICAgIG5ldmVyOiBcIk5ldmVyXCIsXG4gICAgcmVmcmVzaDogXCJSZWZyZXNoIGFuZCBwcm9iZVwiLFxuICAgIHByb2Jpbmc6IFwiUHJvYmluZ1x1MjAyNlwiLFxuICAgIGxvYWRpbmc6IFwiTG9hZGluZ1x1MjAyNlwiLFxuICAgIGxvYWRGYWlsZWQ6IFwiQ2Fubm90IHJlYWQgc3RhdHVzXCIsXG4gICAgY29uZmlnSGludDpcbiAgICAgIFwiQ29uZmlndXJlIGVuZ2luZXMgdW5kZXIgU2V0dGluZ3MgXHUyMTkyIFBsdWdpbnMgXHUyMTkyIFZpc2lvbiBlbmdpbmUgKE1vZExlbnMpLiBOYXRpdmUgbXVsdGltb2RhbCBtb2RlbHMgYWx3YXlzIHVzZSB0aGVpciBvd24gY2FwYWJpbGl0eSBhbmQgbmV2ZXIgcGFzcyB0aHJvdWdoIHRoaXMgYnJpZGdlLlwiXG4gIH1cbn07XG5cbmZ1bmN0aW9uIGFwcGx5KGN0eCkge1xuICBjdHguZWZmZWN0KCgpID0+IGN0eC5sb2NhbGUucmVnaXN0ZXIoTlMsIE5TX0RJQ1QpLCBcIm1vZGxlbnMtZ3VhcmQ6IGNvcHkgZGljdGlvbmFyaWVzXCIpO1xuICBjb25zdCB0ID0gY3R4LmxvY2FsZS5iaW5kKE5TKTtcbiAgY29uc3QgaW5qZWN0ZWQgPSAoKSA9PiAoeyB0IH0pO1xuICBjdHguc2xvdHMuaW5qZWN0KFwiY29udmVyc2F0aW9uLmNoYXQudHVyblRhaWxcIiwgKCkgPT5cbiAgICBjdHguc2xvdHMucmVnaXN0ZXIoXG4gICAgICB7XG4gICAgICAgIG5hbWU6IFwiY29udmVyc2F0aW9uLmNoYXQudHVyblRhaWxcIixcbiAgICAgICAgc2VsZWN0OiAob3duZXIpID0+IG93bmVyPy50dXJuID8/IG51bGwsXG4gICAgICAgIGxvY2FsZTogTlNcbiAgICAgIH0sXG4gICAgICBNb2RsZW5zVHVyblRhaWxcbiAgICApXG4gICk7XG4gIGN0eC5zbG90cy5pbmplY3QoXCJzZXR0aW5ncy5zZWN0aW9uXCIsICgpID0+XG4gICAgY3R4LnNsb3RzLnJlZ2lzdGVyKFxuICAgICAge1xuICAgICAgICBuYW1lOiBcInNldHRpbmdzLnNlY3Rpb25cIixcbiAgICAgICAgaWQ6IFwibW9kbGVucy1ndWFyZFwiLFxuICAgICAgICBvcmRlcjogMTIsXG4gICAgICAgIGxhYmVsOiAoKSA9PiB0KFwibmF2XCIpLFxuICAgICAgICBpbmplY3Q6IGluamVjdGVkXG4gICAgICB9LFxuICAgICAgTW9kbGVuc0d1YXJkU2VjdGlvblxuICAgIClcbiAgKTtcbn1cblxuZXhwb3J0IHsgYXBwbHksIGluamVjdCwgTlMsIE1vZGxlbnNHdWFyZFNlY3Rpb24gfTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBR0EsbUJBQWlEO0FBbUU3QztBQWpFSixJQUFNLEtBQUs7QUFFWCxJQUFNLE9BQU87QUFBQSxFQUNYLE9BQU8sRUFBRSxJQUFJLFdBQVcsSUFBSSx3QkFBd0IsUUFBUSx1QkFBdUI7QUFBQSxFQUNuRixjQUFjLEVBQUUsSUFBSSxXQUFXLElBQUksd0JBQXdCLFFBQVEsdUJBQXVCO0FBQUEsRUFDMUYsU0FB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

		return module.exports;
	}
});
//# sourceMappingURL=client.js.map
