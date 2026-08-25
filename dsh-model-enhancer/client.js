window.__ModuleLoader__.load({
	id: "dsh-model-enhancer",
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
var NS = "settings.model-enhancer";
var LLM_NS = "llm-pi-ai";
var WINDOW_OPTIONS = [
  { label: "128K", value: 131072 },
  { label: "256K", value: 262144 },
  { label: "512K", value: 524288 },
  { label: "1M", value: 1048576 },
  { label: "2M", value: 2097152 },
  { label: "4M", value: 4194304 },
  { label: "\u81EA\u5B9A\u4E49\u2026", value: "custom" }
];
var MAXTOKENS_OPTIONS = [
  { label: "\u9ED8\u8BA4\uFF08\u4E0D\u586B\uFF09", value: "" },
  { label: "16K", value: 16384 },
  { label: "32K", value: 32768 },
  { label: "64K", value: 65536 },
  { label: "128K", value: 131072 },
  { label: "\u81EA\u5B9A\u4E49\u2026", value: "custom" }
];
function formatCount(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "";
  if (n >= 1048576) return `${(n / 1048576).toFixed(n % 1048576 === 0 ? 0 : 1)}M`;
  if (n >= 1024) return `${(n / 1024).toFixed(n % 1024 === 0 ? 0 : 1)}K`;
  return String(n);
}
function matchOption(options, value) {
  if (value === void 0 || value === null) return { matched: false, custom: false, raw: "" };
  const hit = options.find((o) => typeof o.value === "number" && o.value === value);
  if (hit) return { matched: true, custom: false, raw: "" };
  return { matched: false, custom: true, raw: String(value) };
}
var css = {
  section: { maxWidth: 720, color: "var(--dsw-alias-label-primary, #1f2329)", fontFamily: "inherit" },
  lead: { fontSize: 13, lineHeight: 1.6, color: "var(--dsw-alias-label-tertiary, #6b7280)", margin: "0 0 16px" },
  card: { border: "1px solid var(--dsw-alias-border-l2, #e5e7eb)", borderRadius: 8, marginBottom: 16, overflow: "hidden" },
  cardHead: { padding: "10px 14px", fontWeight: 600, fontSize: 14, background: "var(--dsw-alias-bg-module-platform, #f7f8fa)", display: "flex", alignItems: "center", gap: 8 },
  row: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 14px", padding: "8px 14px", borderTop: "1px solid var(--dsw-alias-border-l1, #f0f1f3)" },
  rowAlt: { background: "var(--dsw-alias-bg-module-platform, #fafbfc)" },
  modelId: { flex: "1 1 140px", minWidth: 120, fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  field: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--dsw-alias-label-secondary, #4b5563)" },
  select: { padding: "4px 6px", borderRadius: 6, border: "1px solid var(--dsw-alias-border-l2, #d1d5db)", background: "var(--dsw-specific-input-major, #fff)", fontSize: 12, color: "inherit", minWidth: 96, maxWidth: 140 },
  input: { padding: "4px 6px", borderRadius: 6, border: "1px solid var(--dsw-alias-border-l2, #d1d5db)", background: "var(--dsw-specific-input-major, #fff)", fontSize: 12, width: 90, color: "inherit" },
  checkbox: { accentColor: "var(--dsw-alias-brand-primary, #3b82f6)", margin: 0 },
  empty: { padding: 12, fontSize: 13, color: "var(--dsw-alias-label-tertiary, #9ca3af)" },
  actions: { display: "flex", gap: 10, alignItems: "center", marginTop: 4, flexWrap: "wrap" },
  button: { padding: "6px 14px", borderRadius: 6, border: "none", background: "var(--dsw-alias-brand-primary, #3b82f6)", color: "var(--dsw-alias-label-primary-inverted, #fff)", fontSize: 13, cursor: "pointer" },
  buttonDisabled: { opacity: 0.5, cursor: "not-allowed" },
  hint: { fontSize: 12, color: "var(--dsw-alias-label-tertiary, #9ca3af)" },
  status: { fontSize: 12, color: "var(--dsw-alias-label-secondary, #4b5563)" },
  error: { fontSize: 12, color: "#dc2626" }
};
function ModelGlyph({ size = 22 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 3 14 8l5 2-5 2-2 5-2-5-5-2 5-2 2-5Z" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" })
  ] });
}
function ModelEnhancerSection(props) {
  const { api, t } = props;
  const [status, setStatus] = (0, import_react.useState)("loading");
  const [error, setError] = (0, import_react.useState)(null);
  const [providers, setProviders] = (0, import_react.useState)([]);
  const [revision, setRevision] = (0, import_react.useState)(void 0);
  const [saving, setSaving] = (0, import_react.useState)(false);
  const [saved, setSaved] = (0, import_react.useState)(false);
  const [saveError, setSaveError] = (0, import_react.useState)(null);
  const [customWindows, setCustomWindows] = (0, import_react.useState)({});
  const [customMax, setCustomMax] = (0, import_react.useState)({});
  const [visionOnly, setVisionOnly] = (0, import_react.useState)(false);
  const [visionOnlyBusy, setVisionOnlyBusy] = (0, import_react.useState)(false);
  const load = (0, import_react.useCallback)(async () => {
    setStatus("loading");
    setError(null);
    try {
      const [response, visionResponse] = await Promise.all([
        api.settings.describe({}),
        fetch("/modlens-guard/status").catch(() => null)
      ]);
      if (!response.result.ok) throw new Error(response.result.error.message);
      const visionBody = visionResponse?.ok ? await visionResponse.json() : null;
      setVisionOnly(visionBody?.status?.visionOnly === true);
      const value = response.result.value;
      const view = value.namespaces.find((v) => v.ns === LLM_NS);
      if (view === void 0) {
        setProviders([]);
        setBaseline([]);
        setRevision(void 0);
        setStatus("ready");
        return;
      }
      const cfg = view.value ?? {};
      const providersMap = cfg.providers ?? {};
      const list = Object.entries(providersMap).map(([id, p]) => ({
        id,
        displayName: p.displayName ?? id,
        models: Array.isArray(p.models) ? p.models.map((m) => ({ ...m })) : []
      }));
      setProviders(list);
      setBaseline(list);
      setRevision(view.revision);
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, [api]);
  (0, import_react.useEffect)(() => {
    load();
  }, [load]);
  const patchModel = (pid, index, patch) => {
    setSaved(false);
    setSaveError(null);
    setProviders(
      (list) => list.map((p) => {
        if (p.id !== pid) return p;
        const models = p.models.map((m, i) => i === index ? { ...m, ...patch } : m);
        return { ...p, models };
      })
    );
  };
  const buildOps = (0, import_react.useCallback)(
    (baseline2, draft) => {
      const ops = [];
      for (const prov of draft) {
        const baseProv = baseline2.find((b) => b.id === prov.id);
        const baseModels = baseProv?.models ?? [];
        const draftModels = prov.models;
        if (JSON.stringify(baseModels) !== JSON.stringify(draftModels)) {
          ops.push({
            op: "set",
            path: ["providers", prov.id, "models"],
            value: draftModels
          });
        }
      }
      return ops;
    },
    []
  );
  const [baseline, setBaseline] = (0, import_react.useState)([]);
  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const ops = buildOps(baseline, providers);
      if (ops.length === 0) {
        setSaved(true);
        return;
      }
      const response = await api.settings.mutate({
        ns: LLM_NS,
        ops,
        expectedRevision: revision
      });
      if (!response.result.ok) {
        setSaveError(response.result.error.code === "settings-conflict" ? "\u914D\u7F6E\u5DF2\u88AB\u5176\u4ED6\u9875\u9762\u4FEE\u6539\uFF0C\u8BF7\u91CD\u65B0\u52A0\u8F7D\u540E\u91CD\u8BD5" : response.result.error.message);
        return;
      }
      setRevision(response.result.value.revision);
      setSaved(true);
      await load();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };
  const setVisionRoute = async (enabled) => {
    setVisionOnlyBusy(true);
    setSaveError(null);
    try {
      const response = await fetch("/modlens-guard/vision-only", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled })
      });
      const body = await response.json();
      if (!response.ok || body.ok !== true) throw new Error(body.error || `HTTP ${response.status}`);
      setVisionOnly(body.status?.visionOnly === true);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setVisionOnlyBusy(false);
    }
  };
  if (status === "loading") {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.status, children: t("loading") });
  }
  if (status === "error") {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.error, children: [
        t("loadFailed"),
        ": ",
        error
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: css.button, onClick: load, children: t("retry") })
    ] });
  }
  const hasPiAi = providers.length > 0;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.section, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 14, padding: "4px 0 18px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: 14, background: "linear-gradient(135deg, #7c3aed, #db2777)", color: "white" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModelGlyph, { size: 25 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { style: { margin: 0, fontSize: 20, lineHeight: 1.2, fontWeight: 700 }, children: t("nav") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: "5px 0 0", fontSize: 13, color: "var(--dsw-alias-label-tertiary, #6b7280)" }, children: t("heroMeta") })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: css.lead, children: t("lead") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.card, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.row, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: css.field, title: t("visionRouteTitle"), children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", style: css.checkbox, checked: visionOnly, disabled: visionOnlyBusy, onChange: (e) => void setVisionRoute(e.target.checked) }),
        t("visionRoute")
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.hint, children: visionOnly ? t("visionRouteOn") : t("visionRouteOff") })
    ] }) }),
    !hasPiAi && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.empty, children: t("noPiAi") }),
    providers.map((prov) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.card, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.cardHead, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: prov.displayName }),
        prov.id !== prov.displayName && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.hint, children: prov.id })
      ] }),
      prov.models.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.empty, children: t("noModels") }),
      prov.models.map((model, i) => {
        const imageOn = Array.isArray(model.input) && model.input.includes("image");
        const key = `${prov.id}:${i}`;
        const win = matchOption(WINDOW_OPTIONS, model.contextWindow);
        const max = matchOption(MAXTOKENS_OPTIONS, model.maxTokens);
        const winSelectValue = win.custom ? "custom" : win.matched ? String(model.contextWindow) : "";
        const maxSelectValue = max.custom ? "custom" : model.maxTokens === void 0 || model.maxTokens === null ? "" : String(model.maxTokens);
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: i % 2 === 1 ? { ...css.row, ...css.rowAlt } : css.row, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.modelId, title: model.id, children: model.id }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: css.field, title: t("imageTitle"), children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "checkbox",
                style: css.checkbox,
                checked: imageOn,
                onChange: (e) => {
                  const input = e.target.checked ? ["text", "image"] : ["text"];
                  patchModel(prov.id, i, { input });
                }
              }
            ),
            t("image")
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: css.field, children: [
            t("contextWindow"),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "select",
              {
                style: css.select,
                value: winSelectValue,
                onChange: (e) => {
                  const v = e.target.value;
                  if (v === "custom") {
                    setCustomWindows((m) => ({ ...m, [key]: win.raw }));
                    patchModel(prov.id, i, { contextWindow: void 0 });
                  } else if (v === "") {
                    setCustomWindows((m) => ({ ...m, [key]: "" }));
                    patchModel(prov.id, i, { contextWindow: void 0 });
                  } else {
                    patchModel(prov.id, i, { contextWindow: Number(v) });
                  }
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", children: t("unset") }),
                  WINDOW_OPTIONS.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: o.value === "custom" ? "custom" : String(o.value), children: o.label }, o.label))
                ]
              }
            ),
            winSelectValue === "custom" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                style: css.input,
                placeholder: t("customPlaceholder"),
                value: customWindows[key] ?? win.raw,
                onChange: (e) => {
                  const text = e.target.value;
                  setCustomWindows((m) => ({ ...m, [key]: text }));
                  const n = parseCapacity(text);
                  patchModel(prov.id, i, { contextWindow: n });
                }
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: css.field, children: [
            t("maxTokens"),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "select",
              {
                style: css.select,
                value: maxSelectValue,
                onChange: (e) => {
                  const v = e.target.value;
                  if (v === "custom") {
                    setCustomMax((m) => ({ ...m, [key]: max.raw }));
                    patchModel(prov.id, i, { maxTokens: void 0 });
                  } else if (v === "") {
                    setCustomMax((m) => ({ ...m, [key]: "" }));
                    patchModel(prov.id, i, { maxTokens: void 0 });
                  } else {
                    patchModel(prov.id, i, { maxTokens: Number(v) });
                  }
                },
                children: MAXTOKENS_OPTIONS.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: o.value === "custom" ? "custom" : String(o.value), children: o.label }, o.label))
              }
            ),
            maxSelectValue === "custom" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                style: css.input,
                placeholder: t("customPlaceholder"),
                value: customMax[key] ?? max.raw,
                onChange: (e) => {
                  const text = e.target.value;
                  setCustomMax((m) => ({ ...m, [key]: text }));
                  const n = parseCapacity(text);
                  patchModel(prov.id, i, { maxTokens: n });
                }
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.hint, children: t("effective", { window: formatCount(model.contextWindow), max: formatCount(model.maxTokens) }) })
        ] }, model.id + i);
      })
    ] }, prov.id)),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.actions, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: saving ? { ...css.button, ...css.buttonDisabled } : css.button, disabled: saving, onClick: save, children: saving ? t("saving") : t("save") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: { ...css.button, background: "transparent", color: "var(--dsw-alias-label-secondary, #4b5563)", border: "1px solid var(--dsw-alias-border-l2, #d1d5db)" }, onClick: load, children: t("reload") }),
      saved && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.status, children: t("saved") }),
      saveError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.error, children: saveError })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: css.hint, children: t("footnote") })
  ] });
}
function parseCapacity(text) {
  const s = String(text ?? "").trim().toLowerCase();
  if (s === "") return void 0;
  const m = s.match(/^(\d+(?:\.\d+)?)([km])?$/);
  if (!m) return void 0;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n) || n <= 0) return void 0;
  const mult = m[2] === "k" ? 1e3 : m[2] === "m" ? 1e6 : 1;
  return Math.round(n * mult);
}
var inject = ["slots", "locale", "connection"];
function apply(ctx) {
  const NS_DICT = {
    zh: {
      nav: "\u6A21\u578B\u589E\u5F3A",
      heroMeta: "\u56FE\u7247\u8F93\u5165\u4E0E\u6A21\u578B\u80FD\u529B\u53C2\u6570",
      lead: "\u5728\u6B64\u4E3A\u81EA\u5B9A\u4E49\u6A21\u578B\u914D\u7F6E\u300C\u56FE\u7247\u8F93\u5165\u300D\u4E0E\u4E0A\u4E0B\u6587\u7A97\u53E3/\u6700\u5927\u8F93\u51FA\u7684\u5FEB\u6377\u9009\u9879\u3002\u6240\u6709\u4FEE\u6539\u5199\u5165 llm-pi-ai \u914D\u7F6E\uFF0C\u4E0E\u5B98\u65B9\u300C\u6A21\u578B\u300D\u9875\u5171\u7528\u540C\u4E00\u4EFD\u914D\u7F6E\u3002",
      image: "\u56FE\u7247\u8F93\u5165",
      imageTitle: "\u5141\u8BB8\u8BE5\u6A21\u578B\u63A5\u6536\u56FE\u7247\u9644\u4EF6\uFF08\u5199\u5165 input: [text, image]\uFF09",
      visionRoute: "\u89C6\u89C9\u6865\u6A21\u578B\u5217\u8868",
      visionRouteTitle: "\u5F00\u542F\u540E\u9690\u85CF\u5BF9\u5E94\u7684\u539F\u59CB\u7EAF\u6587\u672C\u6A21\u578B\uFF0C\u4EC5\u4FDD\u7559\u5E26 (ModLens) \u7684\u89C6\u89C9\u6865\u6A21\u578B",
      visionRouteOn: "\u5DF2\u5F00\u542F\uFF1A\u4EC5\u663E\u793A\u89C6\u89C9\u6865\u6A21\u578B",
      visionRouteOff: "\u5DF2\u5173\u95ED\uFF1A\u540C\u65F6\u663E\u793A\u539F\u59CB\u6A21\u578B\u4E0E\u89C6\u89C9\u6865\u6A21\u578B",
      contextWindow: "\u4E0A\u4E0B\u6587\u7A97\u53E3",
      maxTokens: "\u6700\u5927\u8F93\u51FA",
      unset: "\u4E0D\u586B\uFF08\u9ED8\u8BA4\uFF09",
      customPlaceholder: "\u5982 131072",
      effective: "\u751F\u6548\u503C\uFF1A\u7A97\u53E3 {window} / \u8F93\u51FA {max}",
      save: "\u4FDD\u5B58\u4FEE\u6539",
      saving: "\u4FDD\u5B58\u4E2D\u2026",
      saved: "\u5DF2\u4FDD\u5B58 \u2713",
      reload: "\u91CD\u65B0\u52A0\u8F7D",
      loading: "\u52A0\u8F7D\u4E2D\u2026",
      retry: "\u91CD\u8BD5",
      loadFailed: "\u52A0\u8F7D\u5931\u8D25",
      noPiAi: "\u672A\u627E\u5230 llm-pi-ai \u914D\u7F6E\u3002\u8BF7\u5148\u5728\u5B98\u65B9\u300C\u6A21\u578B\u300D\u9875\u6DFB\u52A0\u81EA\u5B9A\u4E49\u63D0\u4F9B\u5546\u3002",
      noModels: "\u8BE5\u63D0\u4F9B\u5546\u6CA1\u6709\u81EA\u5B9A\u4E49\u6A21\u578B\u3002",
      footnote: "\u63D0\u793A\uFF1A\u672A\u52FE\u9009\u4E3A\u7EAF\u6587\u672C\uFF08text\uFF09\uFF1B\u52FE\u9009\u540E\u4E3A\u6587\u672C+\u56FE\u7247\uFF08text, image\uFF09\u3002\u8BF7\u53EA\u5BF9\u4E0A\u6E38\u5B9E\u9645\u652F\u6301\u56FE\u7247\u7684\u6A21\u578B\u52FE\u9009\u3002\u4E0A\u4E0B\u6587\u7A97\u53E3\u8BF7\u52FF\u8D85\u8FC7\u4E0A\u6E38\u771F\u5B9E\u9650\u5236\u3002"
    },
    en: {
      nav: "Model Enhance",
      heroMeta: "Image input and model capability settings",
      lead: "Configure image input and quick context-window / max-output presets for custom models. Changes are written to the llm-pi-ai settings shared with the official Models page.",
      image: "Image input",
      imageTitle: "Allow this model to receive image attachments (writes input: [text, image])",
      visionRoute: "Vision bridge model list",
      visionRouteTitle: "Hide the original text-only model and keep only its (ModLens) bridge model",
      visionRouteOn: "On: show bridge models only",
      visionRouteOff: "Off: show both original and bridge models",
      contextWindow: "Context window",
      maxTokens: "Max output",
      unset: "Unset (default)",
      customPlaceholder: "e.g. 131072",
      effective: "Effective: window {window} / output {max}",
      save: "Save changes",
      saving: "Saving\u2026",
      saved: "Saved \u2713",
      reload: "Reload",
      loading: "Loading\u2026",
      retry: "Retry",
      loadFailed: "Load failed",
      noPiAi: "No llm-pi-ai configuration found. Add a custom provider on the official Models page first.",
      noModels: "This provider has no custom models.",
      footnote: "Unchecked means text-only; checked means text plus image. Enable it only for models whose upstream actually supports image input. Keep the context window within the upstream limit."
    }
  };
  const connection = ctx.get("connection");
  ctx.effect(() => ctx.locale.register(NS, NS_DICT), "model-enhancer: copy dictionaries");
  const t = ctx.locale.bind(NS);
  const injected = () => ({ api: connection.api, t });
  ctx.slots.inject(
    "settings.section",
    () => ctx.slots.register(
      {
        name: "settings.section",
        id: "model-enhancer",
        order: 11,
        label: () => t("nav"),
        inject: injected
      },
      ModelEnhancerSection
    )
  );
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL2NsaWVudC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gZHNoLW1vZGVsLWVuaGFuY2VyIFx1MjAxNFx1MjAxNCBjbGllbnQgXHU3QUVGXHVGRjA4XHU2RDRGXHU4OUM4XHU1NjY4XHVGRjA5XHJcbi8vIFx1NTcyOFx1OEJCRVx1N0Y2RVx1OTg3NVx1NkNFOFx1NTE4Q1x1MzAwQ1x1NkEyMVx1NTc4Qlx1NTg5RVx1NUYzQVx1MzAwRHNlY3Rpb25cdUZGMUFcclxuLy8gICAtIFx1NkJDRlx1NEUyQVx1ODFFQVx1NUI5QVx1NEU0OVx1NkEyMVx1NTc4Qlx1NjNEMFx1NEY5Qlx1MzAwQ1x1NTZGRVx1NzI0N1x1OEY5M1x1NTE2NVx1MzAwRFx1NTJGRVx1OTAwOVx1RkYwOFx1NTE5OSBsbG0tcGktYWkgXHU3Njg0IGlucHV0IFx1NUI1N1x1NkJCNVx1RkYwOVxyXG4vLyAgIC0gXHU0RTBBXHU0RTBCXHU2NTg3XHU3QTk3XHU1M0UzIC8gXHU2NzAwXHU1OTI3XHU4RjkzXHU1MUZBXHU3Njg0XHU1RkVCXHU2Mzc3XHU0RTBCXHU2MkM5XHU5MDA5XHU2MkU5XHVGRjA4MTI4Sy8yNTZLLzFNXHUyMDI2XHVGRjA5XHJcbi8vIFx1NEUwRVx1NUI5OFx1NjVCOVx1MzAwQ1x1NkEyMVx1NTc4Qlx1MzAwRFx1OTg3NVx1NTE3MVx1NzUyOFx1NTQwQ1x1NEUwMFx1NEVGRCBsbG0tcGktYWkgXHU5MTREXHU3RjZFXHVGRjBDXHU5MDFBXHU4RkM3IHNldHRpbmdzIEFQSSBcdThCRkJcdTUxOTlcdTMwMDJcclxuaW1wb3J0IHsgdXNlU3RhdGUsIHVzZUVmZmVjdCwgdXNlQ2FsbGJhY2sgfSBmcm9tIFwicmVhY3RcIjtcclxuXHJcbmNvbnN0IE5TID0gXCJzZXR0aW5ncy5tb2RlbC1lbmhhbmNlclwiO1xyXG5jb25zdCBMTE1fTlMgPSBcImxsbS1waS1haVwiO1xyXG5cclxuLy8gXHUyNTAwXHUyNTAwIFx1NUZFQlx1NjM3N1x1OTAwOVx1OTg3OSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuY29uc3QgV0lORE9XX09QVElPTlMgPSBbXHJcbiAgeyBsYWJlbDogXCIxMjhLXCIsIHZhbHVlOiAxMzEwNzIgfSxcclxuICB7IGxhYmVsOiBcIjI1NktcIiwgdmFsdWU6IDI2MjE0NCB9LFxyXG4gIHsgbGFiZWw6IFwiNTEyS1wiLCB2YWx1ZTogNTI0Mjg4IH0sXHJcbiAgeyBsYWJlbDogXCIxTVwiLCB2YWx1ZTogMTA0ODU3NiB9LFxyXG4gIHsgbGFiZWw6IFwiMk1cIiwgdmFsdWU6IDIwOTcxNTIgfSxcclxuICB7IGxhYmVsOiBcIjRNXCIsIHZhbHVlOiA0MTk0MzA0IH0sXHJcbiAgeyBsYWJlbDogXCJcdTgxRUFcdTVCOUFcdTRFNDlcdTIwMjZcIiwgdmFsdWU6IFwiY3VzdG9tXCIgfVxyXG5dO1xyXG5cclxuY29uc3QgTUFYVE9LRU5TX09QVElPTlMgPSBbXHJcbiAgeyBsYWJlbDogXCJcdTlFRDhcdThCQTRcdUZGMDhcdTRFMERcdTU4NkJcdUZGMDlcIiwgdmFsdWU6IFwiXCIgfSxcclxuICB7IGxhYmVsOiBcIjE2S1wiLCB2YWx1ZTogMTYzODQgfSxcclxuICB7IGxhYmVsOiBcIjMyS1wiLCB2YWx1ZTogMzI3NjggfSxcclxuICB7IGxhYmVsOiBcIjY0S1wiLCB2YWx1ZTogNjU1MzYgfSxcclxuICB7IGxhYmVsOiBcIjEyOEtcIiwgdmFsdWU6IDEzMTA3MiB9LFxyXG4gIHsgbGFiZWw6IFwiXHU4MUVBXHU1QjlBXHU0RTQ5XHUyMDI2XCIsIHZhbHVlOiBcImN1c3RvbVwiIH1cclxuXTtcclxuXHJcbmZ1bmN0aW9uIGZvcm1hdENvdW50KG4pIHtcclxuICBpZiAodHlwZW9mIG4gIT09IFwibnVtYmVyXCIgfHwgIU51bWJlci5pc0Zpbml0ZShuKSkgcmV0dXJuIFwiXCI7XHJcbiAgaWYgKG4gPj0gMTA0ODU3NikgcmV0dXJuIGAkeyhuIC8gMTA0ODU3NikudG9GaXhlZChuICUgMTA0ODU3NiA9PT0gMCA/IDAgOiAxKX1NYDtcclxuICBpZiAobiA+PSAxMDI0KSByZXR1cm4gYCR7KG4gLyAxMDI0KS50b0ZpeGVkKG4gJSAxMDI0ID09PSAwID8gMCA6IDEpfUtgO1xyXG4gIHJldHVybiBTdHJpbmcobik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1hdGNoT3B0aW9uKG9wdGlvbnMsIHZhbHVlKSB7XHJcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwpIHJldHVybiB7IG1hdGNoZWQ6IGZhbHNlLCBjdXN0b206IGZhbHNlLCByYXc6IFwiXCIgfTtcclxuICBjb25zdCBoaXQgPSBvcHRpb25zLmZpbmQoKG8pID0+IHR5cGVvZiBvLnZhbHVlID09PSBcIm51bWJlclwiICYmIG8udmFsdWUgPT09IHZhbHVlKTtcclxuICBpZiAoaGl0KSByZXR1cm4geyBtYXRjaGVkOiB0cnVlLCBjdXN0b206IGZhbHNlLCByYXc6IFwiXCIgfTtcclxuICByZXR1cm4geyBtYXRjaGVkOiBmYWxzZSwgY3VzdG9tOiB0cnVlLCByYXc6IFN0cmluZyh2YWx1ZSkgfTtcclxufVxyXG5cclxuLy8gXHUyNTAwXHUyNTAwIFx1NjgzN1x1NUYwRlx1RkYwOFx1NTE4NVx1ODA1NFx1RkYwQ1x1OTA3Rlx1NTE0RCBDU1MgXHU2QTIxXHU1NzU3XHU2Nzg0XHU1RUZBXHVGRjA5XHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcbmNvbnN0IGNzcyA9IHtcclxuICBzZWN0aW9uOiB7IG1heFdpZHRoOiA3MjAsIGNvbG9yOiBcInZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LCAjMWYyMzI5KVwiLCBmb250RmFtaWx5OiBcImluaGVyaXRcIiB9LFxyXG4gIGxlYWQ6IHsgZm9udFNpemU6IDEzLCBsaW5lSGVpZ2h0OiAxLjYsIGNvbG9yOiBcInZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzZiNzI4MClcIiwgbWFyZ2luOiBcIjAgMCAxNnB4XCIgfSxcclxuICBjYXJkOiB7IGJvcmRlcjogXCIxcHggc29saWQgdmFyKC0tZHN3LWFsaWFzLWJvcmRlci1sMiwgI2U1ZTdlYilcIiwgYm9yZGVyUmFkaXVzOiA4LCBtYXJnaW5Cb3R0b206IDE2LCBvdmVyZmxvdzogXCJoaWRkZW5cIiB9LFxyXG4gIGNhcmRIZWFkOiB7IHBhZGRpbmc6IFwiMTBweCAxNHB4XCIsIGZvbnRXZWlnaHQ6IDYwMCwgZm9udFNpemU6IDE0LCBiYWNrZ3JvdW5kOiBcInZhcigtLWRzdy1hbGlhcy1iZy1tb2R1bGUtcGxhdGZvcm0sICNmN2Y4ZmEpXCIsIGRpc3BsYXk6IFwiZmxleFwiLCBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLCBnYXA6IDggfSxcclxuICByb3c6IHsgZGlzcGxheTogXCJmbGV4XCIsIGZsZXhXcmFwOiBcIndyYXBcIiwgYWxpZ25JdGVtczogXCJjZW50ZXJcIiwgZ2FwOiBcIjhweCAxNHB4XCIsIHBhZGRpbmc6IFwiOHB4IDE0cHhcIiwgYm9yZGVyVG9wOiBcIjFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwxLCAjZjBmMWYzKVwiIH0sXHJcbiAgcm93QWx0OiB7IGJhY2tncm91bmQ6IFwidmFyKC0tZHN3LWFsaWFzLWJnLW1vZHVsZS1wbGF0Zm9ybSwgI2ZhZmJmYylcIiB9LFxyXG4gIG1vZGVsSWQ6IHsgZmxleDogXCIxIDEgMTQwcHhcIiwgbWluV2lkdGg6IDEyMCwgZm9udFNpemU6IDEzLCBmb250V2VpZ2h0OiA1MDAsIG92ZXJmbG93OiBcImhpZGRlblwiLCB0ZXh0T3ZlcmZsb3c6IFwiZWxsaXBzaXNcIiwgd2hpdGVTcGFjZTogXCJub3dyYXBcIiB9LFxyXG4gIGZpZWxkOiB7IGRpc3BsYXk6IFwiaW5saW5lLWZsZXhcIiwgYWxpZ25JdGVtczogXCJjZW50ZXJcIiwgZ2FwOiA2LCBmb250U2l6ZTogMTIsIGNvbG9yOiBcInZhcigtLWRzdy1hbGlhcy1sYWJlbC1zZWNvbmRhcnksICM0YjU1NjMpXCIgfSxcclxuICBzZWxlY3Q6IHsgcGFkZGluZzogXCI0cHggNnB4XCIsIGJvcmRlclJhZGl1czogNiwgYm9yZGVyOiBcIjFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwyLCAjZDFkNWRiKVwiLCBiYWNrZ3JvdW5kOiBcInZhcigtLWRzdy1zcGVjaWZpYy1pbnB1dC1tYWpvciwgI2ZmZilcIiwgZm9udFNpemU6IDEyLCBjb2xvcjogXCJpbmhlcml0XCIsIG1pbldpZHRoOiA5NiwgbWF4V2lkdGg6IDE0MCB9LFxyXG4gIGlucHV0OiB7IHBhZGRpbmc6IFwiNHB4IDZweFwiLCBib3JkZXJSYWRpdXM6IDYsIGJvcmRlcjogXCIxcHggc29saWQgdmFyKC0tZHN3LWFsaWFzLWJvcmRlci1sMiwgI2QxZDVkYilcIiwgYmFja2dyb3VuZDogXCJ2YXIoLS1kc3ctc3BlY2lmaWMtaW5wdXQtbWFqb3IsICNmZmYpXCIsIGZvbnRTaXplOiAxMiwgd2lkdGg6IDkwLCBjb2xvcjogXCJpbmhlcml0XCIgfSxcclxuICBjaGVja2JveDogeyBhY2NlbnRDb2xvcjogXCJ2YXIoLS1kc3ctYWxpYXMtYnJhbmQtcHJpbWFyeSwgIzNiODJmNilcIiwgbWFyZ2luOiAwIH0sXHJcbiAgZW1wdHk6IHsgcGFkZGluZzogMTIsIGZvbnRTaXplOiAxMywgY29sb3I6IFwidmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjOWNhM2FmKVwiIH0sXHJcbiAgYWN0aW9uczogeyBkaXNwbGF5OiBcImZsZXhcIiwgZ2FwOiAxMCwgYWxpZ25JdGVtczogXCJjZW50ZXJcIiwgbWFyZ2luVG9wOiA0LCBmbGV4V3JhcDogXCJ3cmFwXCIgfSxcclxuICBidXR0b246IHsgcGFkZGluZzogXCI2cHggMTRweFwiLCBib3JkZXJSYWRpdXM6IDYsIGJvcmRlcjogXCJub25lXCIsIGJhY2tncm91bmQ6IFwidmFyKC0tZHN3LWFsaWFzLWJyYW5kLXByaW1hcnksICMzYjgyZjYpXCIsIGNvbG9yOiBcInZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LWludmVydGVkLCAjZmZmKVwiLCBmb250U2l6ZTogMTMsIGN1cnNvcjogXCJwb2ludGVyXCIgfSxcclxuICBidXR0b25EaXNhYmxlZDogeyBvcGFjaXR5OiAwLjUsIGN1cnNvcjogXCJub3QtYWxsb3dlZFwiIH0sXHJcbiAgaGludDogeyBmb250U2l6ZTogMTIsIGNvbG9yOiBcInZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzljYTNhZilcIiB9LFxyXG4gIHN0YXR1czogeyBmb250U2l6ZTogMTIsIGNvbG9yOiBcInZhcigtLWRzdy1hbGlhcy1sYWJlbC1zZWNvbmRhcnksICM0YjU1NjMpXCIgfSxcclxuICBlcnJvcjogeyBmb250U2l6ZTogMTIsIGNvbG9yOiBcIiNkYzI2MjZcIiB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBNb2RlbEdseXBoKHsgc2l6ZSA9IDIyIH0pIHtcclxuICByZXR1cm4gPHN2ZyB3aWR0aD17c2l6ZX0gaGVpZ2h0PXtzaXplfSB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2VXaWR0aD1cIjEuOFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjxwYXRoIGQ9XCJNMTIgMyAxNCA4bDUgMi01IDItMiA1LTItNS01LTIgNS0yIDItNVpcIiAvPjxwYXRoIGQ9XCJtMTguNSAxNSAuOCAyLjIgMi4yLjgtMi4yLjgtLjggMi4yLS44LTIuMi0yLjItLjggMi4yLS44LjgtMi4yWlwiIC8+PC9zdmc+O1xyXG59XHJcblxyXG4vLyBcdTI1MDBcdTI1MDAgXHU0RTNCXHU3RUM0XHU0RUY2IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxyXG5mdW5jdGlvbiBNb2RlbEVuaGFuY2VyU2VjdGlvbihwcm9wcykge1xyXG4gIGNvbnN0IHsgYXBpLCB0IH0gPSBwcm9wcztcclxuICBjb25zdCBbc3RhdHVzLCBzZXRTdGF0dXNdID0gdXNlU3RhdGUoXCJsb2FkaW5nXCIpOyAvLyBsb2FkaW5nIHwgcmVhZHkgfCBlcnJvclxyXG4gIGNvbnN0IFtlcnJvciwgc2V0RXJyb3JdID0gdXNlU3RhdGUobnVsbCk7XHJcbiAgY29uc3QgW3Byb3ZpZGVycywgc2V0UHJvdmlkZXJzXSA9IHVzZVN0YXRlKFtdKTsgLy8gW3tpZCwgZGlzcGxheU5hbWUsIG1vZGVsc31dXHJcbiAgY29uc3QgW3JldmlzaW9uLCBzZXRSZXZpc2lvbl0gPSB1c2VTdGF0ZSh1bmRlZmluZWQpO1xyXG4gIGNvbnN0IFtzYXZpbmcsIHNldFNhdmluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XHJcbiAgY29uc3QgW3NhdmVkLCBzZXRTYXZlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XHJcbiAgY29uc3QgW3NhdmVFcnJvciwgc2V0U2F2ZUVycm9yXSA9IHVzZVN0YXRlKG51bGwpO1xyXG4gIGNvbnN0IFtjdXN0b21XaW5kb3dzLCBzZXRDdXN0b21XaW5kb3dzXSA9IHVzZVN0YXRlKHt9KTsgLy8gYCR7cGlkfToke2lkeH1gIC0+IHN0cmluZ1xyXG4gIGNvbnN0IFtjdXN0b21NYXgsIHNldEN1c3RvbU1heF0gPSB1c2VTdGF0ZSh7fSk7IC8vIGAke3BpZH06JHtpZHh9YCAtPiBzdHJpbmdcclxuICBjb25zdCBbdmlzaW9uT25seSwgc2V0VmlzaW9uT25seV0gPSB1c2VTdGF0ZShmYWxzZSk7XHJcbiAgY29uc3QgW3Zpc2lvbk9ubHlCdXN5LCBzZXRWaXNpb25Pbmx5QnVzeV0gPSB1c2VTdGF0ZShmYWxzZSk7XHJcblxyXG4gIGNvbnN0IGxvYWQgPSB1c2VDYWxsYmFjayhhc3luYyAoKSA9PiB7XHJcbiAgICBzZXRTdGF0dXMoXCJsb2FkaW5nXCIpO1xyXG4gICAgc2V0RXJyb3IobnVsbCk7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBbcmVzcG9uc2UsIHZpc2lvblJlc3BvbnNlXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcclxuICAgICAgICBhcGkuc2V0dGluZ3MuZGVzY3JpYmUoe30pLFxyXG4gICAgICAgIGZldGNoKFwiL21vZGxlbnMtZ3VhcmQvc3RhdHVzXCIpLmNhdGNoKCgpID0+IG51bGwpXHJcbiAgICAgIF0pO1xyXG4gICAgICBpZiAoIXJlc3BvbnNlLnJlc3VsdC5vaykgdGhyb3cgbmV3IEVycm9yKHJlc3BvbnNlLnJlc3VsdC5lcnJvci5tZXNzYWdlKTtcclxuICAgICAgY29uc3QgdmlzaW9uQm9keSA9IHZpc2lvblJlc3BvbnNlPy5vayA/IGF3YWl0IHZpc2lvblJlc3BvbnNlLmpzb24oKSA6IG51bGw7XHJcbiAgICAgIHNldFZpc2lvbk9ubHkodmlzaW9uQm9keT8uc3RhdHVzPy52aXNpb25Pbmx5ID09PSB0cnVlKTtcclxuICAgICAgY29uc3QgdmFsdWUgPSByZXNwb25zZS5yZXN1bHQudmFsdWU7XHJcbiAgICAgIGNvbnN0IHZpZXcgPSB2YWx1ZS5uYW1lc3BhY2VzLmZpbmQoKHYpID0+IHYubnMgPT09IExMTV9OUyk7XHJcbiAgICAgIGlmICh2aWV3ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBzZXRQcm92aWRlcnMoW10pO1xyXG4gICAgICAgIHNldEJhc2VsaW5lKFtdKTtcclxuICAgICAgICBzZXRSZXZpc2lvbih1bmRlZmluZWQpO1xyXG4gICAgICAgIHNldFN0YXR1cyhcInJlYWR5XCIpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBjZmcgPSB2aWV3LnZhbHVlID8/IHt9O1xyXG4gICAgICBjb25zdCBwcm92aWRlcnNNYXAgPSBjZmcucHJvdmlkZXJzID8/IHt9O1xyXG4gICAgICBjb25zdCBsaXN0ID0gT2JqZWN0LmVudHJpZXMocHJvdmlkZXJzTWFwKS5tYXAoKFtpZCwgcF0pID0+ICh7XHJcbiAgICAgICAgaWQsXHJcbiAgICAgICAgZGlzcGxheU5hbWU6IHAuZGlzcGxheU5hbWUgPz8gaWQsXHJcbiAgICAgICAgbW9kZWxzOiBBcnJheS5pc0FycmF5KHAubW9kZWxzKSA/IHAubW9kZWxzLm1hcCgobSkgPT4gKHsgLi4ubSB9KSkgOiBbXVxyXG4gICAgICB9KSk7XHJcbiAgICAgIHNldFByb3ZpZGVycyhsaXN0KTtcclxuICAgICAgc2V0QmFzZWxpbmUobGlzdCk7XHJcbiAgICAgIHNldFJldmlzaW9uKHZpZXcucmV2aXNpb24pO1xyXG4gICAgICBzZXRTdGF0dXMoXCJyZWFkeVwiKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgc2V0RXJyb3IoZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpKTtcclxuICAgICAgc2V0U3RhdHVzKFwiZXJyb3JcIik7XHJcbiAgICB9XHJcbiAgfSwgW2FwaV0pO1xyXG5cclxuICB1c2VFZmZlY3QoKCkgPT4ge1xyXG4gICAgbG9hZCgpO1xyXG4gIH0sIFtsb2FkXSk7XHJcblxyXG4gIC8vIFx1NEZFRVx1NjUzOVx1NkEyMVx1NTc4Qlx1NUI1N1x1NkJCNVxyXG4gIGNvbnN0IHBhdGNoTW9kZWwgPSAocGlkLCBpbmRleCwgcGF0Y2gpID0+IHtcclxuICAgIHNldFNhdmVkKGZhbHNlKTtcclxuICAgIHNldFNhdmVFcnJvcihudWxsKTtcclxuICAgIHNldFByb3ZpZGVycygobGlzdCkgPT5cclxuICAgICAgbGlzdC5tYXAoKHApID0+IHtcclxuICAgICAgICBpZiAocC5pZCAhPT0gcGlkKSByZXR1cm4gcDtcclxuICAgICAgICBjb25zdCBtb2RlbHMgPSBwLm1vZGVscy5tYXAoKG0sIGkpID0+IChpID09PSBpbmRleCA/IHsgLi4ubSwgLi4ucGF0Y2ggfSA6IG0pKTtcclxuICAgICAgICByZXR1cm4geyAuLi5wLCBtb2RlbHMgfTtcclxuICAgICAgfSlcclxuICAgICk7XHJcbiAgfTtcclxuXHJcbiAgLy8gXHU3NTFGXHU2MjEwIG9wc1x1RkYxQVx1NTNFQVx1NTNEMVx1OTAwMVx1NTNEOFx1NTMxNlx1OEZDN1x1NzY4NFx1NUI1N1x1NkJCNVxyXG4gIC8vIFx1NkNFOFx1NjEwRlx1RkYxQXNldHRpbmdzLm11dGF0ZSBcdTc2ODQgYXBwbHlQYXRoT3AgXHU0RTBEXHU2NTJGXHU2MzAxXHU2NTcwXHU3RUM0XHU0RTBCXHU2ODA3XHU4REVGXHU1Rjg0XHVGRjA4XHU0RjFBXHU2MjhBXHU2NTcwXHU3RUM0XHU5MUNEXHU1RUZBXHU0RTNBXHU1QkY5XHU4QzYxXHVGRjA5XHVGRjBDXHJcbiAgLy8gXHU1NkUwXHU2QjY0IG1vZGVscyBcdTY1NzBcdTdFQzRcdTVGQzVcdTk4N0JcdTY1NzRcdTRGNTMgc2V0IFx1NTIzMCBbXCJwcm92aWRlcnNcIiwgaWQsIFwibW9kZWxzXCJdXHVGRjA4XHU1Qjk4XHU2NUI5XHU2QTIxXHU1NzhCXHU5ODc1XHU1NDBDXHU2QjNFXHU1MDVBXHU2Q0Q1XHVGRjA5XHUzMDAyXHJcbiAgY29uc3QgYnVpbGRPcHMgPSB1c2VDYWxsYmFjayhcclxuICAgIChiYXNlbGluZSwgZHJhZnQpID0+IHtcclxuICAgICAgY29uc3Qgb3BzID0gW107XHJcbiAgICAgIGZvciAoY29uc3QgcHJvdiBvZiBkcmFmdCkge1xyXG4gICAgICAgIGNvbnN0IGJhc2VQcm92ID0gYmFzZWxpbmUuZmluZCgoYikgPT4gYi5pZCA9PT0gcHJvdi5pZCk7XHJcbiAgICAgICAgY29uc3QgYmFzZU1vZGVscyA9IGJhc2VQcm92Py5tb2RlbHMgPz8gW107XHJcbiAgICAgICAgY29uc3QgZHJhZnRNb2RlbHMgPSBwcm92Lm1vZGVscztcclxuICAgICAgICBpZiAoSlNPTi5zdHJpbmdpZnkoYmFzZU1vZGVscykgIT09IEpTT04uc3RyaW5naWZ5KGRyYWZ0TW9kZWxzKSkge1xyXG4gICAgICAgICAgb3BzLnB1c2goe1xyXG4gICAgICAgICAgICBvcDogXCJzZXRcIixcclxuICAgICAgICAgICAgcGF0aDogW1wicHJvdmlkZXJzXCIsIHByb3YuaWQsIFwibW9kZWxzXCJdLFxyXG4gICAgICAgICAgICB2YWx1ZTogZHJhZnRNb2RlbHNcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gb3BzO1xyXG4gICAgfSxcclxuICAgIFtdXHJcbiAgKTtcclxuXHJcbiAgLy8gXHU0RkREXHU1QjU4XHU1MjREXHU3Njg0IGJhc2VsaW5lXHVGRjA4XHU2NzAwXHU1NDBFXHU0RTAwXHU2QjIxXHU1MkEwXHU4RjdEXHU3Njg0XHU1MzlGXHU1OUNCXHU1MDNDXHVGRjA5XHJcbiAgY29uc3QgW2Jhc2VsaW5lLCBzZXRCYXNlbGluZV0gPSB1c2VTdGF0ZShbXSk7XHJcblxyXG4gIGNvbnN0IHNhdmUgPSBhc3luYyAoKSA9PiB7XHJcbiAgICBzZXRTYXZpbmcodHJ1ZSk7XHJcbiAgICBzZXRTYXZlRXJyb3IobnVsbCk7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBvcHMgPSBidWlsZE9wcyhiYXNlbGluZSwgcHJvdmlkZXJzKTtcclxuICAgICAgaWYgKG9wcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBzZXRTYXZlZCh0cnVlKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBhcGkuc2V0dGluZ3MubXV0YXRlKHtcclxuICAgICAgICBuczogTExNX05TLFxyXG4gICAgICAgIG9wcyxcclxuICAgICAgICBleHBlY3RlZFJldmlzaW9uOiByZXZpc2lvblxyXG4gICAgICB9KTtcclxuICAgICAgaWYgKCFyZXNwb25zZS5yZXN1bHQub2spIHtcclxuICAgICAgICBzZXRTYXZlRXJyb3IocmVzcG9uc2UucmVzdWx0LmVycm9yLmNvZGUgPT09IFwic2V0dGluZ3MtY29uZmxpY3RcIiA/IFwiXHU5MTREXHU3RjZFXHU1REYyXHU4OEFCXHU1MTc2XHU0RUQ2XHU5ODc1XHU5NzYyXHU0RkVFXHU2NTM5XHVGRjBDXHU4QkY3XHU5MUNEXHU2NUIwXHU1MkEwXHU4RjdEXHU1NDBFXHU5MUNEXHU4QkQ1XCIgOiByZXNwb25zZS5yZXN1bHQuZXJyb3IubWVzc2FnZSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIHNldFJldmlzaW9uKHJlc3BvbnNlLnJlc3VsdC52YWx1ZS5yZXZpc2lvbik7XHJcbiAgICAgIHNldFNhdmVkKHRydWUpO1xyXG4gICAgICBhd2FpdCBsb2FkKCk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIHNldFNhdmVFcnJvcihlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSkpO1xyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgc2V0U2F2aW5nKGZhbHNlKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBjb25zdCBzZXRWaXNpb25Sb3V0ZSA9IGFzeW5jIChlbmFibGVkKSA9PiB7XHJcbiAgICBzZXRWaXNpb25Pbmx5QnVzeSh0cnVlKTtcclxuICAgIHNldFNhdmVFcnJvcihudWxsKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goXCIvbW9kbGVucy1ndWFyZC92aXNpb24tb25seVwiLCB7XHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBoZWFkZXJzOiB7IFwiY29udGVudC10eXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlbmFibGVkIH0pXHJcbiAgICAgIH0pO1xyXG4gICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xyXG4gICAgICBpZiAoIXJlc3BvbnNlLm9rIHx8IGJvZHkub2sgIT09IHRydWUpIHRocm93IG5ldyBFcnJvcihib2R5LmVycm9yIHx8IGBIVFRQICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xyXG4gICAgICBzZXRWaXNpb25Pbmx5KGJvZHkuc3RhdHVzPy52aXNpb25Pbmx5ID09PSB0cnVlKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgc2V0U2F2ZUVycm9yKGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSk7XHJcbiAgICB9IGZpbmFsbHkge1xyXG4gICAgICBzZXRWaXNpb25Pbmx5QnVzeShmYWxzZSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgaWYgKHN0YXR1cyA9PT0gXCJsb2FkaW5nXCIpIHtcclxuICAgIHJldHVybiA8ZGl2IHN0eWxlPXtjc3Muc3RhdHVzfT57dChcImxvYWRpbmdcIil9PC9kaXY+O1xyXG4gIH1cclxuICBpZiAoc3RhdHVzID09PSBcImVycm9yXCIpIHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgIDxkaXY+XHJcbiAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmVycm9yfT57dChcImxvYWRGYWlsZWRcIil9OiB7ZXJyb3J9PC9kaXY+XHJcbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgc3R5bGU9e2Nzcy5idXR0b259IG9uQ2xpY2s9e2xvYWR9Pnt0KFwicmV0cnlcIil9PC9idXR0b24+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGhhc1BpQWkgPSBwcm92aWRlcnMubGVuZ3RoID4gMDtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxkaXYgc3R5bGU9e2Nzcy5zZWN0aW9ufT5cclxuICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiBcImZsZXhcIiwgYWxpZ25JdGVtczogXCJjZW50ZXJcIiwgZ2FwOiAxNCwgcGFkZGluZzogXCI0cHggMCAxOHB4XCIgfX0+PGRpdiBzdHlsZT17eyB3aWR0aDogNDQsIGhlaWdodDogNDQsIGRpc3BsYXk6IFwiZ3JpZFwiLCBwbGFjZUl0ZW1zOiBcImNlbnRlclwiLCBib3JkZXJSYWRpdXM6IDE0LCBiYWNrZ3JvdW5kOiBcImxpbmVhci1ncmFkaWVudCgxMzVkZWcsICM3YzNhZWQsICNkYjI3NzcpXCIsIGNvbG9yOiBcIndoaXRlXCIgfX0+PE1vZGVsR2x5cGggc2l6ZT17MjV9IC8+PC9kaXY+PGRpdj48aDEgc3R5bGU9e3sgbWFyZ2luOiAwLCBmb250U2l6ZTogMjAsIGxpbmVIZWlnaHQ6IDEuMiwgZm9udFdlaWdodDogNzAwIH19Pnt0KFwibmF2XCIpfTwvaDE+PHAgc3R5bGU9e3sgbWFyZ2luOiBcIjVweCAwIDBcIiwgZm9udFNpemU6IDEzLCBjb2xvcjogXCJ2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2YjcyODApXCIgfX0+e3QoXCJoZXJvTWV0YVwiKX08L3A+PC9kaXY+PC9kaXY+XHJcbiAgICAgIDxwIHN0eWxlPXtjc3MubGVhZH0+e3QoXCJsZWFkXCIpfTwvcD5cclxuICAgICAgPGRpdiBzdHlsZT17Y3NzLmNhcmR9PlxyXG4gICAgICAgIDxkaXYgc3R5bGU9e2Nzcy5yb3d9PlxyXG4gICAgICAgICAgPGxhYmVsIHN0eWxlPXtjc3MuZmllbGR9IHRpdGxlPXt0KFwidmlzaW9uUm91dGVUaXRsZVwiKX0+XHJcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBzdHlsZT17Y3NzLmNoZWNrYm94fSBjaGVja2VkPXt2aXNpb25Pbmx5fSBkaXNhYmxlZD17dmlzaW9uT25seUJ1c3l9IG9uQ2hhbmdlPXsoZSkgPT4gdm9pZCBzZXRWaXNpb25Sb3V0ZShlLnRhcmdldC5jaGVja2VkKX0gLz5cclxuICAgICAgICAgICAge3QoXCJ2aXNpb25Sb3V0ZVwiKX1cclxuICAgICAgICAgIDwvbGFiZWw+XHJcbiAgICAgICAgICA8c3BhbiBzdHlsZT17Y3NzLmhpbnR9Pnt2aXNpb25Pbmx5ID8gdChcInZpc2lvblJvdXRlT25cIikgOiB0KFwidmlzaW9uUm91dGVPZmZcIil9PC9zcGFuPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgeyFoYXNQaUFpICYmIDxkaXYgc3R5bGU9e2Nzcy5lbXB0eX0+e3QoXCJub1BpQWlcIil9PC9kaXY+fVxyXG4gICAgICB7cHJvdmlkZXJzLm1hcCgocHJvdikgPT4gKFxyXG4gICAgICAgIDxkaXYga2V5PXtwcm92LmlkfSBzdHlsZT17Y3NzLmNhcmR9PlxyXG4gICAgICAgICAgPGRpdiBzdHlsZT17Y3NzLmNhcmRIZWFkfT5cclxuICAgICAgICAgICAgPHNwYW4+e3Byb3YuZGlzcGxheU5hbWV9PC9zcGFuPlxyXG4gICAgICAgICAgICB7cHJvdi5pZCAhPT0gcHJvdi5kaXNwbGF5TmFtZSAmJiA8c3BhbiBzdHlsZT17Y3NzLmhpbnR9Pntwcm92LmlkfTwvc3Bhbj59XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIHtwcm92Lm1vZGVscy5sZW5ndGggPT09IDAgJiYgPGRpdiBzdHlsZT17Y3NzLmVtcHR5fT57dChcIm5vTW9kZWxzXCIpfTwvZGl2Pn1cclxuICAgICAgICAgIHtwcm92Lm1vZGVscy5tYXAoKG1vZGVsLCBpKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGltYWdlT24gPSBBcnJheS5pc0FycmF5KG1vZGVsLmlucHV0KSAmJiBtb2RlbC5pbnB1dC5pbmNsdWRlcyhcImltYWdlXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBrZXkgPSBgJHtwcm92LmlkfToke2l9YDtcclxuICAgICAgICAgICAgY29uc3Qgd2luID0gbWF0Y2hPcHRpb24oV0lORE9XX09QVElPTlMsIG1vZGVsLmNvbnRleHRXaW5kb3cpO1xyXG4gICAgICAgICAgICBjb25zdCBtYXggPSBtYXRjaE9wdGlvbihNQVhUT0tFTlNfT1BUSU9OUywgbW9kZWwubWF4VG9rZW5zKTtcclxuICAgICAgICAgICAgY29uc3Qgd2luU2VsZWN0VmFsdWUgPSB3aW4uY3VzdG9tID8gXCJjdXN0b21cIiA6IHdpbi5tYXRjaGVkID8gU3RyaW5nKG1vZGVsLmNvbnRleHRXaW5kb3cpIDogXCJcIjtcclxuICAgICAgICAgICAgY29uc3QgbWF4U2VsZWN0VmFsdWUgPSBtYXguY3VzdG9tID8gXCJjdXN0b21cIiA6IG1vZGVsLm1heFRva2VucyA9PT0gdW5kZWZpbmVkIHx8IG1vZGVsLm1heFRva2VucyA9PT0gbnVsbCA/IFwiXCIgOiBTdHJpbmcobW9kZWwubWF4VG9rZW5zKTtcclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICA8ZGl2IGtleT17bW9kZWwuaWQgKyBpfSBzdHlsZT17aSAlIDIgPT09IDEgPyB7IC4uLmNzcy5yb3csIC4uLmNzcy5yb3dBbHQgfSA6IGNzcy5yb3d9PlxyXG4gICAgICAgICAgICAgICAgPHNwYW4gc3R5bGU9e2Nzcy5tb2RlbElkfSB0aXRsZT17bW9kZWwuaWR9Pnttb2RlbC5pZH08L3NwYW4+XHJcbiAgICAgICAgICAgICAgICA8bGFiZWwgc3R5bGU9e2Nzcy5maWVsZH0gdGl0bGU9e3QoXCJpbWFnZVRpdGxlXCIpfT5cclxuICAgICAgICAgICAgICAgICAgPGlucHV0XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cImNoZWNrYm94XCJcclxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17Y3NzLmNoZWNrYm94fVxyXG4gICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ9e2ltYWdlT259XHJcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbnB1dCA9IGUudGFyZ2V0LmNoZWNrZWQgPyBbXCJ0ZXh0XCIsIFwiaW1hZ2VcIl0gOiBbXCJ0ZXh0XCJdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgcGF0Y2hNb2RlbChwcm92LmlkLCBpLCB7IGlucHV0IH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgICAgICAgIHt0KFwiaW1hZ2VcIil9XHJcbiAgICAgICAgICAgICAgICA8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgPGxhYmVsIHN0eWxlPXtjc3MuZmllbGR9PlxyXG4gICAgICAgICAgICAgICAgICB7dChcImNvbnRleHRXaW5kb3dcIil9XHJcbiAgICAgICAgICAgICAgICAgIDxzZWxlY3RcclxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17Y3NzLnNlbGVjdH1cclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17d2luU2VsZWN0VmFsdWV9XHJcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2ID0gZS50YXJnZXQudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICBpZiAodiA9PT0gXCJjdXN0b21cIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRDdXN0b21XaW5kb3dzKChtKSA9PiAoeyAuLi5tLCBba2V5XTogd2luLnJhdyB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoTW9kZWwocHJvdi5pZCwgaSwgeyBjb250ZXh0V2luZG93OiB1bmRlZmluZWQgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHYgPT09IFwiXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0Q3VzdG9tV2luZG93cygobSkgPT4gKHsgLi4ubSwgW2tleV06IFwiXCIgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRjaE1vZGVsKHByb3YuaWQsIGksIHsgY29udGV4dFdpbmRvdzogdW5kZWZpbmVkIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0Y2hNb2RlbChwcm92LmlkLCBpLCB7IGNvbnRleHRXaW5kb3c6IE51bWJlcih2KSB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIlwiPnt0KFwidW5zZXRcIil9PC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAge1dJTkRPV19PUFRJT05TLm1hcCgobykgPT4gKFxyXG4gICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiBrZXk9e28ubGFiZWx9IHZhbHVlPXtvLnZhbHVlID09PSBcImN1c3RvbVwiID8gXCJjdXN0b21cIiA6IFN0cmluZyhvLnZhbHVlKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtvLmxhYmVsfVxyXG4gICAgICAgICAgICAgICAgICAgICAgPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgKSl9XHJcbiAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxyXG4gICAgICAgICAgICAgICAgICB7d2luU2VsZWN0VmFsdWUgPT09IFwiY3VzdG9tXCIgJiYgKFxyXG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dFxyXG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e2Nzcy5pbnB1dH1cclxuICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXt0KFwiY3VzdG9tUGxhY2Vob2xkZXJcIil9XHJcbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17Y3VzdG9tV2luZG93c1trZXldID8/IHdpbi5yYXd9XHJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGV4dCA9IGUudGFyZ2V0LnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRDdXN0b21XaW5kb3dzKChtKSA9PiAoeyAuLi5tLCBba2V5XTogdGV4dCB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG4gPSBwYXJzZUNhcGFjaXR5KHRleHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRjaE1vZGVsKHByb3YuaWQsIGksIHsgY29udGV4dFdpbmRvdzogbiB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICAgICAgKX1cclxuICAgICAgICAgICAgICAgIDwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICA8bGFiZWwgc3R5bGU9e2Nzcy5maWVsZH0+XHJcbiAgICAgICAgICAgICAgICAgIHt0KFwibWF4VG9rZW5zXCIpfVxyXG4gICAgICAgICAgICAgICAgICA8c2VsZWN0XHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e2Nzcy5zZWxlY3R9XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e21heFNlbGVjdFZhbHVlfVxyXG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgdiA9IGUudGFyZ2V0LnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHYgPT09IFwiY3VzdG9tXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0Q3VzdG9tTWF4KChtKSA9PiAoeyAuLi5tLCBba2V5XTogbWF4LnJhdyB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoTW9kZWwocHJvdi5pZCwgaSwgeyBtYXhUb2tlbnM6IHVuZGVmaW5lZCB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodiA9PT0gXCJcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRDdXN0b21NYXgoKG0pID0+ICh7IC4uLm0sIFtrZXldOiBcIlwiIH0pKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0Y2hNb2RlbChwcm92LmlkLCBpLCB7IG1heFRva2VuczogdW5kZWZpbmVkIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0Y2hNb2RlbChwcm92LmlkLCBpLCB7IG1heFRva2VuczogTnVtYmVyKHYpIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICB7TUFYVE9LRU5TX09QVElPTlMubWFwKChvKSA9PiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIGtleT17by5sYWJlbH0gdmFsdWU9e28udmFsdWUgPT09IFwiY3VzdG9tXCIgPyBcImN1c3RvbVwiIDogU3RyaW5nKG8udmFsdWUpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAge28ubGFiZWx9XHJcbiAgICAgICAgICAgICAgICAgICAgICA8L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICApKX1cclxuICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XHJcbiAgICAgICAgICAgICAgICAgIHttYXhTZWxlY3RWYWx1ZSA9PT0gXCJjdXN0b21cIiAmJiAoXHJcbiAgICAgICAgICAgICAgICAgICAgPGlucHV0XHJcbiAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17Y3NzLmlucHV0fVxyXG4gICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e3QoXCJjdXN0b21QbGFjZWhvbGRlclwiKX1cclxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtjdXN0b21NYXhba2V5XSA/PyBtYXgucmF3fVxyXG4gICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBlLnRhcmdldC52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0Q3VzdG9tTWF4KChtKSA9PiAoeyAuLi5tLCBba2V5XTogdGV4dCB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG4gPSBwYXJzZUNhcGFjaXR5KHRleHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRjaE1vZGVsKHByb3YuaWQsIGksIHsgbWF4VG9rZW5zOiBuIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICAgICAgICApfVxyXG4gICAgICAgICAgICAgICAgPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXtjc3MuaGludH0+e3QoXCJlZmZlY3RpdmVcIiwgeyB3aW5kb3c6IGZvcm1hdENvdW50KG1vZGVsLmNvbnRleHRXaW5kb3cpLCBtYXg6IGZvcm1hdENvdW50KG1vZGVsLm1heFRva2VucykgfSl9PC9zcGFuPlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgfSl9XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICkpfVxyXG4gICAgICA8ZGl2IHN0eWxlPXtjc3MuYWN0aW9uc30+XHJcbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgc3R5bGU9e3NhdmluZyA/IHsgLi4uY3NzLmJ1dHRvbiwgLi4uY3NzLmJ1dHRvbkRpc2FibGVkIH0gOiBjc3MuYnV0dG9ufSBkaXNhYmxlZD17c2F2aW5nfSBvbkNsaWNrPXtzYXZlfT5cclxuICAgICAgICAgIHtzYXZpbmcgPyB0KFwic2F2aW5nXCIpIDogdChcInNhdmVcIil9XHJcbiAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgc3R5bGU9e3sgLi4uY3NzLmJ1dHRvbiwgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLCBjb2xvcjogXCJ2YXIoLS1kc3ctYWxpYXMtbGFiZWwtc2Vjb25kYXJ5LCAjNGI1NTYzKVwiLCBib3JkZXI6IFwiMXB4IHNvbGlkIHZhcigtLWRzdy1hbGlhcy1ib3JkZXItbDIsICNkMWQ1ZGIpXCIgfX0gb25DbGljaz17bG9hZH0+XHJcbiAgICAgICAgICB7dChcInJlbG9hZFwiKX1cclxuICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICB7c2F2ZWQgJiYgPHNwYW4gc3R5bGU9e2Nzcy5zdGF0dXN9Pnt0KFwic2F2ZWRcIil9PC9zcGFuPn1cclxuICAgICAgICB7c2F2ZUVycm9yICYmIDxzcGFuIHN0eWxlPXtjc3MuZXJyb3J9PntzYXZlRXJyb3J9PC9zcGFuPn1cclxuICAgICAgPC9kaXY+XHJcbiAgICAgIDxwIHN0eWxlPXtjc3MuaGludH0+e3QoXCJmb290bm90ZVwiKX08L3A+XHJcbiAgICA8L2Rpdj5cclxuICApO1xyXG59XHJcblxyXG4vLyBcdTg5RTNcdTY3OTAgMTI4SyAvIDFNIC8gMTMxMDcyIFx1NEU0Qlx1N0M3Qlx1NzY4NFx1ODBGRFx1NTI5Qlx1NTE5OVx1NkNENVx1RkYwOFx1NEUwRVx1NUI5OFx1NjVCOVx1OTg3NVx1OTc2Mlx1NTQwQ1x1OEJDRFx1ODg2OFx1RkYwOVxyXG5mdW5jdGlvbiBwYXJzZUNhcGFjaXR5KHRleHQpIHtcclxuICBjb25zdCBzID0gU3RyaW5nKHRleHQgPz8gXCJcIikudHJpbSgpLnRvTG93ZXJDYXNlKCk7XHJcbiAgaWYgKHMgPT09IFwiXCIpIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgY29uc3QgbSA9IHMubWF0Y2goL14oXFxkKyg/OlxcLlxcZCspPykoW2ttXSk/JC8pO1xyXG4gIGlmICghbSkgcmV0dXJuIHVuZGVmaW5lZDtcclxuICBjb25zdCBuID0gcGFyc2VGbG9hdChtWzFdKTtcclxuICBpZiAoIU51bWJlci5pc0Zpbml0ZShuKSB8fCBuIDw9IDApIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgY29uc3QgbXVsdCA9IG1bMl0gPT09IFwia1wiID8gMTAwMCA6IG1bMl0gPT09IFwibVwiID8gMTAwMDAwMCA6IDE7XHJcbiAgcmV0dXJuIE1hdGgucm91bmQobiAqIG11bHQpO1xyXG59XHJcblxyXG4vLyBcdTI1MDBcdTI1MDAgXHU2M0QyXHU0RUY2XHU1MTY1XHU1M0UzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxyXG5jb25zdCBpbmplY3QgPSBbXCJzbG90c1wiLCBcImxvY2FsZVwiLCBcImNvbm5lY3Rpb25cIl07XHJcblxyXG5mdW5jdGlvbiBhcHBseShjdHgpIHtcclxuICBjb25zdCBOU19ESUNUID0ge1xyXG4gICAgemg6IHtcclxuICAgICAgbmF2OiBcIlx1NkEyMVx1NTc4Qlx1NTg5RVx1NUYzQVwiLFxyXG4gICAgICBoZXJvTWV0YTogXCJcdTU2RkVcdTcyNDdcdThGOTNcdTUxNjVcdTRFMEVcdTZBMjFcdTU3OEJcdTgwRkRcdTUyOUJcdTUzQzJcdTY1NzBcIixcclxuICAgICAgbGVhZDogXCJcdTU3MjhcdTZCNjRcdTRFM0FcdTgxRUFcdTVCOUFcdTRFNDlcdTZBMjFcdTU3OEJcdTkxNERcdTdGNkVcdTMwMENcdTU2RkVcdTcyNDdcdThGOTNcdTUxNjVcdTMwMERcdTRFMEVcdTRFMEFcdTRFMEJcdTY1ODdcdTdBOTdcdTUzRTMvXHU2NzAwXHU1OTI3XHU4RjkzXHU1MUZBXHU3Njg0XHU1RkVCXHU2Mzc3XHU5MDA5XHU5ODc5XHUzMDAyXHU2MjQwXHU2NzA5XHU0RkVFXHU2NTM5XHU1MTk5XHU1MTY1IGxsbS1waS1haSBcdTkxNERcdTdGNkVcdUZGMENcdTRFMEVcdTVCOThcdTY1QjlcdTMwMENcdTZBMjFcdTU3OEJcdTMwMERcdTk4NzVcdTUxNzFcdTc1MjhcdTU0MENcdTRFMDBcdTRFRkRcdTkxNERcdTdGNkVcdTMwMDJcIixcclxuICAgICAgaW1hZ2U6IFwiXHU1NkZFXHU3MjQ3XHU4RjkzXHU1MTY1XCIsXHJcbiAgICAgIGltYWdlVGl0bGU6IFwiXHU1MTQxXHU4QkI4XHU4QkU1XHU2QTIxXHU1NzhCXHU2M0E1XHU2NTM2XHU1NkZFXHU3MjQ3XHU5NjQ0XHU0RUY2XHVGRjA4XHU1MTk5XHU1MTY1IGlucHV0OiBbdGV4dCwgaW1hZ2VdXHVGRjA5XCIsXHJcbiAgICAgIHZpc2lvblJvdXRlOiBcIlx1ODlDNlx1ODlDOVx1Njg2NVx1NkEyMVx1NTc4Qlx1NTIxN1x1ODg2OFwiLFxyXG4gICAgICB2aXNpb25Sb3V0ZVRpdGxlOiBcIlx1NUYwMFx1NTQyRlx1NTQwRVx1OTY5MFx1ODVDRlx1NUJGOVx1NUU5NFx1NzY4NFx1NTM5Rlx1NTlDQlx1N0VBRlx1NjU4N1x1NjcyQ1x1NkEyMVx1NTc4Qlx1RkYwQ1x1NEVDNVx1NEZERFx1NzU1OVx1NUUyNiAoTW9kTGVucykgXHU3Njg0XHU4OUM2XHU4OUM5XHU2ODY1XHU2QTIxXHU1NzhCXCIsXHJcbiAgICAgIHZpc2lvblJvdXRlT246IFwiXHU1REYyXHU1RjAwXHU1NDJGXHVGRjFBXHU0RUM1XHU2NjNFXHU3OTNBXHU4OUM2XHU4OUM5XHU2ODY1XHU2QTIxXHU1NzhCXCIsXHJcbiAgICAgIHZpc2lvblJvdXRlT2ZmOiBcIlx1NURGMlx1NTE3M1x1OTVFRFx1RkYxQVx1NTQwQ1x1NjVGNlx1NjYzRVx1NzkzQVx1NTM5Rlx1NTlDQlx1NkEyMVx1NTc4Qlx1NEUwRVx1ODlDNlx1ODlDOVx1Njg2NVx1NkEyMVx1NTc4QlwiLFxyXG4gICAgICBjb250ZXh0V2luZG93OiBcIlx1NEUwQVx1NEUwQlx1NjU4N1x1N0E5N1x1NTNFM1wiLFxyXG4gICAgICBtYXhUb2tlbnM6IFwiXHU2NzAwXHU1OTI3XHU4RjkzXHU1MUZBXCIsXHJcbiAgICAgIHVuc2V0OiBcIlx1NEUwRFx1NTg2Qlx1RkYwOFx1OUVEOFx1OEJBNFx1RkYwOVwiLFxyXG4gICAgICBjdXN0b21QbGFjZWhvbGRlcjogXCJcdTU5ODIgMTMxMDcyXCIsXHJcbiAgICAgIGVmZmVjdGl2ZTogXCJcdTc1MUZcdTY1NDhcdTUwM0NcdUZGMUFcdTdBOTdcdTUzRTMge3dpbmRvd30gLyBcdThGOTNcdTUxRkEge21heH1cIixcclxuICAgICAgc2F2ZTogXCJcdTRGRERcdTVCNThcdTRGRUVcdTY1MzlcIixcclxuICAgICAgc2F2aW5nOiBcIlx1NEZERFx1NUI1OFx1NEUyRFx1MjAyNlwiLFxyXG4gICAgICBzYXZlZDogXCJcdTVERjJcdTRGRERcdTVCNTggXHUyNzEzXCIsXHJcbiAgICAgIHJlbG9hZDogXCJcdTkxQ0RcdTY1QjBcdTUyQTBcdThGN0RcIixcclxuICAgICAgbG9hZGluZzogXCJcdTUyQTBcdThGN0RcdTRFMkRcdTIwMjZcIixcclxuICAgICAgcmV0cnk6IFwiXHU5MUNEXHU4QkQ1XCIsXHJcbiAgICAgIGxvYWRGYWlsZWQ6IFwiXHU1MkEwXHU4RjdEXHU1OTMxXHU4RDI1XCIsXHJcbiAgICAgIG5vUGlBaTogXCJcdTY3MkFcdTYyN0VcdTUyMzAgbGxtLXBpLWFpIFx1OTE0RFx1N0Y2RVx1MzAwMlx1OEJGN1x1NTE0OFx1NTcyOFx1NUI5OFx1NjVCOVx1MzAwQ1x1NkEyMVx1NTc4Qlx1MzAwRFx1OTg3NVx1NkRGQlx1NTJBMFx1ODFFQVx1NUI5QVx1NEU0OVx1NjNEMFx1NEY5Qlx1NTU0Nlx1MzAwMlwiLFxyXG4gICAgICBub01vZGVsczogXCJcdThCRTVcdTYzRDBcdTRGOUJcdTU1NDZcdTZDQTFcdTY3MDlcdTgxRUFcdTVCOUFcdTRFNDlcdTZBMjFcdTU3OEJcdTMwMDJcIixcclxuICAgICAgZm9vdG5vdGU6IFwiXHU2M0QwXHU3OTNBXHVGRjFBXHU2NzJBXHU1MkZFXHU5MDA5XHU0RTNBXHU3RUFGXHU2NTg3XHU2NzJDXHVGRjA4dGV4dFx1RkYwOVx1RkYxQlx1NTJGRVx1OTAwOVx1NTQwRVx1NEUzQVx1NjU4N1x1NjcyQytcdTU2RkVcdTcyNDdcdUZGMDh0ZXh0LCBpbWFnZVx1RkYwOVx1MzAwMlx1OEJGN1x1NTNFQVx1NUJGOVx1NEUwQVx1NkUzOFx1NUI5RVx1OTY0NVx1NjUyRlx1NjMwMVx1NTZGRVx1NzI0N1x1NzY4NFx1NkEyMVx1NTc4Qlx1NTJGRVx1OTAwOVx1MzAwMlx1NEUwQVx1NEUwQlx1NjU4N1x1N0E5N1x1NTNFM1x1OEJGN1x1NTJGRlx1OEQ4NVx1OEZDN1x1NEUwQVx1NkUzOFx1NzcxRlx1NUI5RVx1OTY1MFx1NTIzNlx1MzAwMlwiXHJcbiAgICB9LFxyXG4gICAgZW46IHtcclxuICAgICAgbmF2OiBcIk1vZGVsIEVuaGFuY2VcIixcclxuICAgICAgaGVyb01ldGE6IFwiSW1hZ2UgaW5wdXQgYW5kIG1vZGVsIGNhcGFiaWxpdHkgc2V0dGluZ3NcIixcclxuICAgICAgbGVhZDogXCJDb25maWd1cmUgaW1hZ2UgaW5wdXQgYW5kIHF1aWNrIGNvbnRleHQtd2luZG93IC8gbWF4LW91dHB1dCBwcmVzZXRzIGZvciBjdXN0b20gbW9kZWxzLiBDaGFuZ2VzIGFyZSB3cml0dGVuIHRvIHRoZSBsbG0tcGktYWkgc2V0dGluZ3Mgc2hhcmVkIHdpdGggdGhlIG9mZmljaWFsIE1vZGVscyBwYWdlLlwiLFxyXG4gICAgICBpbWFnZTogXCJJbWFnZSBpbnB1dFwiLFxyXG4gICAgICBpbWFnZVRpdGxlOiBcIkFsbG93IHRoaXMgbW9kZWwgdG8gcmVjZWl2ZSBpbWFnZSBhdHRhY2htZW50cyAod3JpdGVzIGlucHV0OiBbdGV4dCwgaW1hZ2VdKVwiLFxyXG4gICAgICB2aXNpb25Sb3V0ZTogXCJWaXNpb24gYnJpZGdlIG1vZGVsIGxpc3RcIixcclxuICAgICAgdmlzaW9uUm91dGVUaXRsZTogXCJIaWRlIHRoZSBvcmlnaW5hbCB0ZXh0LW9ubHkgbW9kZWwgYW5kIGtlZXAgb25seSBpdHMgKE1vZExlbnMpIGJyaWRnZSBtb2RlbFwiLFxyXG4gICAgICB2aXNpb25Sb3V0ZU9uOiBcIk9uOiBzaG93IGJyaWRnZSBtb2RlbHMgb25seVwiLFxyXG4gICAgICB2aXNpb25Sb3V0ZU9mZjogXCJPZmY6IHNob3cgYm90aCBvcmlnaW5hbCBhbmQgYnJpZGdlIG1vZGVsc1wiLFxyXG4gICAgICBjb250ZXh0V2luZG93OiBcIkNvbnRleHQgd2luZG93XCIsXHJcbiAgICAgIG1heFRva2VuczogXCJNYXggb3V0cHV0XCIsXHJcbiAgICAgIHVuc2V0OiBcIlVuc2V0IChkZWZhdWx0KVwiLFxyXG4gICAgICBjdXN0b21QbGFjZWhvbGRlcjogXCJlLmcuIDEzMTA3MlwiLFxyXG4gICAgICBlZmZlY3RpdmU6IFwiRWZmZWN0aXZlOiB3aW5kb3cge3dpbmRvd30gLyBvdXRwdXQge21heH1cIixcclxuICAgICAgc2F2ZTogXCJTYXZlIGNoYW5nZXNcIixcclxuICAgICAgc2F2aW5nOiBcIlNhdmluZ1x1MjAyNlwiLFxyXG4gICAgICBzYXZlZDogXCJTYXZlZCBcdTI3MTNcIixcclxuICAgICAgcmVsb2FkOiBcIlJlbG9hZFwiLFxyXG4gICAgICBsb2FkaW5nOiBcIkxvYWRpbmdcdTIwMjZcIixcclxuICAgICAgcmV0cnk6IFwiUmV0cnlcIixcclxuICAgICAgbG9hZEZhaWxlZDogXCJMb2FkIGZhaWxlZFwiLFxyXG4gICAgICBub1BpQWk6IFwiTm8gbGxtLXBpLWFpIGNvbmZpZ3VyYXRpb24gZm91bmQuIEFkZCBhIGN1c3RvbSBwcm92aWRlciBvbiB0aGUgb2ZmaWNpYWwgTW9kZWxzIHBhZ2UgZmlyc3QuXCIsXHJcbiAgICAgIG5vTW9kZWxzOiBcIlRoaXMgcHJvdmlkZXIgaGFzIG5vIGN1c3RvbSBtb2RlbHMuXCIsXHJcbiAgICAgIGZvb3Rub3RlOiBcIlVuY2hlY2tlZCBtZWFucyB0ZXh0LW9ubHk7IGNoZWNrZWQgbWVhbnMgdGV4dCBwbHVzIGltYWdlLiBFbmFibGUgaXQgb25seSBmb3IgbW9kZWxzIHdob3NlIHVwc3RyZWFtIGFjdHVhbGx5IHN1cHBvcnRzIGltYWdlIGlucHV0LiBLZWVwIHRoZSBjb250ZXh0IHdpbmRvdyB3aXRoaW4gdGhlIHVwc3RyZWFtIGxpbWl0LlwiXHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLy8gXHU0RTBEXHU1MThEXHU1MzA1XHU4OEM1IHNlc3Npb25zLnNlbGVjdE1vZGVsXHVGRjFBXHU1MjA3XHU2MzYyXHU2QTIxXHU1NzhCXHU0RTBEXHU1RTk0XHU2NTM5XHU1MTk5XHU0RjFBXHU4QkREXHU0RTJEXHU3Njg0XHU1NkZFXHU3MjQ3XHU1Mzg2XHU1M0YyXHUzMDAyXHJcbiAgLy8gXHU3RUFGXHU2NTg3XHU2NzJDXHU2QTIxXHU1NzhCXHU3Njg0XHU1NkZFXHU3MjQ3XHU2MzA5XHU4MEZEXHU1MjlCXHU1MjA2XHU2RDQxXHU3NTMxIGRzaC1tb2RsZW5zLWd1YXJkIFx1NTcyOFx1NTNEMVx1OTAwMVx1NjVGNlx1NTkwNFx1NzQwNlx1MzAwMlxyXG4gIGNvbnN0IGNvbm5lY3Rpb24gPSBjdHguZ2V0KFwiY29ubmVjdGlvblwiKTtcclxuICBjdHguZWZmZWN0KCgpID0+IGN0eC5sb2NhbGUucmVnaXN0ZXIoTlMsIE5TX0RJQ1QpLCBcIm1vZGVsLWVuaGFuY2VyOiBjb3B5IGRpY3Rpb25hcmllc1wiKTtcclxuICBjb25zdCB0ID0gY3R4LmxvY2FsZS5iaW5kKE5TKTtcclxuICBjb25zdCBpbmplY3RlZCA9ICgpID0+ICh7IGFwaTogY29ubmVjdGlvbi5hcGksIHQgfSk7XHJcbiAgY3R4LnNsb3RzLmluamVjdChcInNldHRpbmdzLnNlY3Rpb25cIiwgKCkgPT5cclxuICAgIGN0eC5zbG90cy5yZWdpc3RlcihcclxuICAgICAge1xyXG4gICAgICAgIG5hbWU6IFwic2V0dGluZ3Muc2VjdGlvblwiLFxyXG4gICAgICAgIGlkOiBcIm1vZGVsLWVuaGFuY2VyXCIsXHJcbiAgICAgICAgb3JkZXI6IDExLFxyXG4gICAgICAgIGxhYmVsOiAoKSA9PiB0KFwibmF2XCIpLFxyXG4gICAgICAgIGluamVjdDogaW5qZWN0ZWRcclxuICAgICAgfSxcclxuICAgICAgTW9kZWxFbmhhbmNlclNlY3Rpb25cclxuICAgIClcclxuICApO1xyXG59XHJcblxyXG5leHBvcnQgeyBhcHBseSwgaW5qZWN0IH07XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFLQSxtQkFBaUQ7QUE4RHhDO0FBNURULElBQU0sS0FBSztBQUNYLElBQU0sU0FBUztBQUdmLElBQU0saUJBQWlCO0FBQUEsRUFDckIsRUFBRSxPQUFPLFFBQVEsT0FBTyxPQUFPO0FBQUEsRUFDL0IsRUFBRSxPQUFPLFFBQVEsT0FBTyxPQUFPO0FBQUEsRUFDL0IsRUFBRSxPQUFPLFFBQVEsT0FBTyxPQUFPO0FBQUEsRUFDL0IsRUFBRSxPQUFPLE1BQU0sT0FBTyxRQUFRO0FBQUEsRUFDOUIsRUFBRSxPQUFP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

		return module.exports;
	}
});
//# sourceMappingURL=client.js.map
