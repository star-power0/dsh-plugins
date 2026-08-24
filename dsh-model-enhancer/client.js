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
  card: { border: "1px solid var(--dsw-alias-border-strong, #e5e7eb)", borderRadius: 8, marginBottom: 16, overflow: "hidden" },
  cardHead: { padding: "10px 14px", fontWeight: 600, fontSize: 14, background: "var(--dsw-alias-fill-subtle, #f7f8fa)", display: "flex", alignItems: "center", gap: 8 },
  row: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 14px", padding: "8px 14px", borderTop: "1px solid var(--dsw-alias-border-subtle, #f0f1f3)" },
  rowAlt: { background: "var(--dsw-alias-fill-subtle, #fafbfc)" },
  modelId: { flex: "1 1 140px", minWidth: 120, fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  field: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--dsw-alias-label-secondary, #4b5563)" },
  select: { padding: "4px 6px", borderRadius: 6, border: "1px solid var(--dsw-alias-border-strong, #d1d5db)", background: "var(--dsw-alias-fill, #fff)", fontSize: 12, color: "inherit", minWidth: 96, maxWidth: 140 },
  input: { padding: "4px 6px", borderRadius: 6, border: "1px solid var(--dsw-alias-border-strong, #d1d5db)", background: "var(--dsw-alias-fill, #fff)", fontSize: 12, width: 90, color: "inherit" },
  checkbox: { accentColor: "var(--dsw-alias-accent, #3b82f6)", margin: 0 },
  empty: { padding: 12, fontSize: 13, color: "var(--dsw-alias-label-tertiary, #9ca3af)" },
  actions: { display: "flex", gap: 10, alignItems: "center", marginTop: 4, flexWrap: "wrap" },
  button: { padding: "6px 14px", borderRadius: 6, border: "none", background: "var(--dsw-alias-accent, #3b82f6)", color: "#fff", fontSize: 13, cursor: "pointer" },
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
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.hint, children: prov.id })
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
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: { ...css.button, background: "transparent", color: "var(--dsw-alias-label-secondary, #4b5563)", border: "1px solid var(--dsw-alias-border-strong, #d1d5db)" }, onClick: load, children: t("reload") }),
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL2NsaWVudC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gZHNoLW1vZGVsLWVuaGFuY2VyIFx1MjAxNFx1MjAxNCBjbGllbnQgXHU3QUVGXHVGRjA4XHU2RDRGXHU4OUM4XHU1NjY4XHVGRjA5XHJcbi8vIFx1NTcyOFx1OEJCRVx1N0Y2RVx1OTg3NVx1NkNFOFx1NTE4Q1x1MzAwQ1x1NkEyMVx1NTc4Qlx1NTg5RVx1NUYzQVx1MzAwRHNlY3Rpb25cdUZGMUFcclxuLy8gICAtIFx1NkJDRlx1NEUyQVx1ODFFQVx1NUI5QVx1NEU0OVx1NkEyMVx1NTc4Qlx1NjNEMFx1NEY5Qlx1MzAwQ1x1NTZGRVx1NzI0N1x1OEY5M1x1NTE2NVx1MzAwRFx1NTJGRVx1OTAwOVx1RkYwOFx1NTE5OSBsbG0tcGktYWkgXHU3Njg0IGlucHV0IFx1NUI1N1x1NkJCNVx1RkYwOVxyXG4vLyAgIC0gXHU0RTBBXHU0RTBCXHU2NTg3XHU3QTk3XHU1M0UzIC8gXHU2NzAwXHU1OTI3XHU4RjkzXHU1MUZBXHU3Njg0XHU1RkVCXHU2Mzc3XHU0RTBCXHU2MkM5XHU5MDA5XHU2MkU5XHVGRjA4MTI4Sy8yNTZLLzFNXHUyMDI2XHVGRjA5XHJcbi8vIFx1NEUwRVx1NUI5OFx1NjVCOVx1MzAwQ1x1NkEyMVx1NTc4Qlx1MzAwRFx1OTg3NVx1NTE3MVx1NzUyOFx1NTQwQ1x1NEUwMFx1NEVGRCBsbG0tcGktYWkgXHU5MTREXHU3RjZFXHVGRjBDXHU5MDFBXHU4RkM3IHNldHRpbmdzIEFQSSBcdThCRkJcdTUxOTlcdTMwMDJcclxuaW1wb3J0IHsgdXNlU3RhdGUsIHVzZUVmZmVjdCwgdXNlQ2FsbGJhY2sgfSBmcm9tIFwicmVhY3RcIjtcclxuXHJcbmNvbnN0IE5TID0gXCJzZXR0aW5ncy5tb2RlbC1lbmhhbmNlclwiO1xyXG5jb25zdCBMTE1fTlMgPSBcImxsbS1waS1haVwiO1xyXG5cclxuLy8gXHUyNTAwXHUyNTAwIFx1NUZFQlx1NjM3N1x1OTAwOVx1OTg3OSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuY29uc3QgV0lORE9XX09QVElPTlMgPSBbXHJcbiAgeyBsYWJlbDogXCIxMjhLXCIsIHZhbHVlOiAxMzEwNzIgfSxcclxuICB7IGxhYmVsOiBcIjI1NktcIiwgdmFsdWU6IDI2MjE0NCB9LFxyXG4gIHsgbGFiZWw6IFwiNTEyS1wiLCB2YWx1ZTogNTI0Mjg4IH0sXHJcbiAgeyBsYWJlbDogXCIxTVwiLCB2YWx1ZTogMTA0ODU3NiB9LFxyXG4gIHsgbGFiZWw6IFwiMk1cIiwgdmFsdWU6IDIwOTcxNTIgfSxcclxuICB7IGxhYmVsOiBcIjRNXCIsIHZhbHVlOiA0MTk0MzA0IH0sXHJcbiAgeyBsYWJlbDogXCJcdTgxRUFcdTVCOUFcdTRFNDlcdTIwMjZcIiwgdmFsdWU6IFwiY3VzdG9tXCIgfVxyXG5dO1xyXG5cclxuY29uc3QgTUFYVE9LRU5TX09QVElPTlMgPSBbXHJcbiAgeyBsYWJlbDogXCJcdTlFRDhcdThCQTRcdUZGMDhcdTRFMERcdTU4NkJcdUZGMDlcIiwgdmFsdWU6IFwiXCIgfSxcclxuICB7IGxhYmVsOiBcIjE2S1wiLCB2YWx1ZTogMTYzODQgfSxcclxuICB7IGxhYmVsOiBcIjMyS1wiLCB2YWx1ZTogMzI3NjggfSxcclxuICB7IGxhYmVsOiBcIjY0S1wiLCB2YWx1ZTogNjU1MzYgfSxcclxuICB7IGxhYmVsOiBcIjEyOEtcIiwgdmFsdWU6IDEzMTA3MiB9LFxyXG4gIHsgbGFiZWw6IFwiXHU4MUVBXHU1QjlBXHU0RTQ5XHUyMDI2XCIsIHZhbHVlOiBcImN1c3RvbVwiIH1cclxuXTtcclxuXHJcbmZ1bmN0aW9uIGZvcm1hdENvdW50KG4pIHtcclxuICBpZiAodHlwZW9mIG4gIT09IFwibnVtYmVyXCIgfHwgIU51bWJlci5pc0Zpbml0ZShuKSkgcmV0dXJuIFwiXCI7XHJcbiAgaWYgKG4gPj0gMTA0ODU3NikgcmV0dXJuIGAkeyhuIC8gMTA0ODU3NikudG9GaXhlZChuICUgMTA0ODU3NiA9PT0gMCA/IDAgOiAxKX1NYDtcclxuICBpZiAobiA+PSAxMDI0KSByZXR1cm4gYCR7KG4gLyAxMDI0KS50b0ZpeGVkKG4gJSAxMDI0ID09PSAwID8gMCA6IDEpfUtgO1xyXG4gIHJldHVybiBTdHJpbmcobik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1hdGNoT3B0aW9uKG9wdGlvbnMsIHZhbHVlKSB7XHJcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwpIHJldHVybiB7IG1hdGNoZWQ6IGZhbHNlLCBjdXN0b206IGZhbHNlLCByYXc6IFwiXCIgfTtcclxuICBjb25zdCBoaXQgPSBvcHRpb25zLmZpbmQoKG8pID0+IHR5cGVvZiBvLnZhbHVlID09PSBcIm51bWJlclwiICYmIG8udmFsdWUgPT09IHZhbHVlKTtcclxuICBpZiAoaGl0KSByZXR1cm4geyBtYXRjaGVkOiB0cnVlLCBjdXN0b206IGZhbHNlLCByYXc6IFwiXCIgfTtcclxuICByZXR1cm4geyBtYXRjaGVkOiBmYWxzZSwgY3VzdG9tOiB0cnVlLCByYXc6IFN0cmluZyh2YWx1ZSkgfTtcclxufVxyXG5cclxuLy8gXHUyNTAwXHUyNTAwIFx1NjgzN1x1NUYwRlx1RkYwOFx1NTE4NVx1ODA1NFx1RkYwQ1x1OTA3Rlx1NTE0RCBDU1MgXHU2QTIxXHU1NzU3XHU2Nzg0XHU1RUZBXHVGRjA5XHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcbmNvbnN0IGNzcyA9IHtcclxuICBzZWN0aW9uOiB7IG1heFdpZHRoOiA3MjAsIGNvbG9yOiBcInZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LCAjMWYyMzI5KVwiLCBmb250RmFtaWx5OiBcImluaGVyaXRcIiB9LFxyXG4gIGxlYWQ6IHsgZm9udFNpemU6IDEzLCBsaW5lSGVpZ2h0OiAxLjYsIGNvbG9yOiBcInZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzZiNzI4MClcIiwgbWFyZ2luOiBcIjAgMCAxNnB4XCIgfSxcclxuICBjYXJkOiB7IGJvcmRlcjogXCIxcHggc29saWQgdmFyKC0tZHN3LWFsaWFzLWJvcmRlci1zdHJvbmcsICNlNWU3ZWIpXCIsIGJvcmRlclJhZGl1czogOCwgbWFyZ2luQm90dG9tOiAxNiwgb3ZlcmZsb3c6IFwiaGlkZGVuXCIgfSxcclxuICBjYXJkSGVhZDogeyBwYWRkaW5nOiBcIjEwcHggMTRweFwiLCBmb250V2VpZ2h0OiA2MDAsIGZvbnRTaXplOiAxNCwgYmFja2dyb3VuZDogXCJ2YXIoLS1kc3ctYWxpYXMtZmlsbC1zdWJ0bGUsICNmN2Y4ZmEpXCIsIGRpc3BsYXk6IFwiZmxleFwiLCBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLCBnYXA6IDggfSxcclxuICByb3c6IHsgZGlzcGxheTogXCJmbGV4XCIsIGZsZXhXcmFwOiBcIndyYXBcIiwgYWxpZ25JdGVtczogXCJjZW50ZXJcIiwgZ2FwOiBcIjhweCAxNHB4XCIsIHBhZGRpbmc6IFwiOHB4IDE0cHhcIiwgYm9yZGVyVG9wOiBcIjFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLXN1YnRsZSwgI2YwZjFmMylcIiB9LFxyXG4gIHJvd0FsdDogeyBiYWNrZ3JvdW5kOiBcInZhcigtLWRzdy1hbGlhcy1maWxsLXN1YnRsZSwgI2ZhZmJmYylcIiB9LFxyXG4gIG1vZGVsSWQ6IHsgZmxleDogXCIxIDEgMTQwcHhcIiwgbWluV2lkdGg6IDEyMCwgZm9udFNpemU6IDEzLCBmb250V2VpZ2h0OiA1MDAsIG92ZXJmbG93OiBcImhpZGRlblwiLCB0ZXh0T3ZlcmZsb3c6IFwiZWxsaXBzaXNcIiwgd2hpdGVTcGFjZTogXCJub3dyYXBcIiB9LFxyXG4gIGZpZWxkOiB7IGRpc3BsYXk6IFwiaW5saW5lLWZsZXhcIiwgYWxpZ25JdGVtczogXCJjZW50ZXJcIiwgZ2FwOiA2LCBmb250U2l6ZTogMTIsIGNvbG9yOiBcInZhcigtLWRzdy1hbGlhcy1sYWJlbC1zZWNvbmRhcnksICM0YjU1NjMpXCIgfSxcclxuICBzZWxlY3Q6IHsgcGFkZGluZzogXCI0cHggNnB4XCIsIGJvcmRlclJhZGl1czogNiwgYm9yZGVyOiBcIjFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLXN0cm9uZywgI2QxZDVkYilcIiwgYmFja2dyb3VuZDogXCJ2YXIoLS1kc3ctYWxpYXMtZmlsbCwgI2ZmZilcIiwgZm9udFNpemU6IDEyLCBjb2xvcjogXCJpbmhlcml0XCIsIG1pbldpZHRoOiA5NiwgbWF4V2lkdGg6IDE0MCB9LFxyXG4gIGlucHV0OiB7IHBhZGRpbmc6IFwiNHB4IDZweFwiLCBib3JkZXJSYWRpdXM6IDYsIGJvcmRlcjogXCIxcHggc29saWQgdmFyKC0tZHN3LWFsaWFzLWJvcmRlci1zdHJvbmcsICNkMWQ1ZGIpXCIsIGJhY2tncm91bmQ6IFwidmFyKC0tZHN3LWFsaWFzLWZpbGwsICNmZmYpXCIsIGZvbnRTaXplOiAxMiwgd2lkdGg6IDkwLCBjb2xvcjogXCJpbmhlcml0XCIgfSxcclxuICBjaGVja2JveDogeyBhY2NlbnRDb2xvcjogXCJ2YXIoLS1kc3ctYWxpYXMtYWNjZW50LCAjM2I4MmY2KVwiLCBtYXJnaW46IDAgfSxcclxuICBlbXB0eTogeyBwYWRkaW5nOiAxMiwgZm9udFNpemU6IDEzLCBjb2xvcjogXCJ2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM5Y2EzYWYpXCIgfSxcclxuICBhY3Rpb25zOiB7IGRpc3BsYXk6IFwiZmxleFwiLCBnYXA6IDEwLCBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLCBtYXJnaW5Ub3A6IDQsIGZsZXhXcmFwOiBcIndyYXBcIiB9LFxyXG4gIGJ1dHRvbjogeyBwYWRkaW5nOiBcIjZweCAxNHB4XCIsIGJvcmRlclJhZGl1czogNiwgYm9yZGVyOiBcIm5vbmVcIiwgYmFja2dyb3VuZDogXCJ2YXIoLS1kc3ctYWxpYXMtYWNjZW50LCAjM2I4MmY2KVwiLCBjb2xvcjogXCIjZmZmXCIsIGZvbnRTaXplOiAxMywgY3Vyc29yOiBcInBvaW50ZXJcIiB9LFxyXG4gIGJ1dHRvbkRpc2FibGVkOiB7IG9wYWNpdHk6IDAuNSwgY3Vyc29yOiBcIm5vdC1hbGxvd2VkXCIgfSxcclxuICBoaW50OiB7IGZvbnRTaXplOiAxMiwgY29sb3I6IFwidmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjOWNhM2FmKVwiIH0sXHJcbiAgc3RhdHVzOiB7IGZvbnRTaXplOiAxMiwgY29sb3I6IFwidmFyKC0tZHN3LWFsaWFzLWxhYmVsLXNlY29uZGFyeSwgIzRiNTU2MylcIiB9LFxyXG4gIGVycm9yOiB7IGZvbnRTaXplOiAxMiwgY29sb3I6IFwiI2RjMjYyNlwiIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIE1vZGVsR2x5cGgoeyBzaXplID0gMjIgfSkge1xyXG4gIHJldHVybiA8c3ZnIHdpZHRoPXtzaXplfSBoZWlnaHQ9e3NpemV9IHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZVdpZHRoPVwiMS44XCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PHBhdGggZD1cIk0xMiAzIDE0IDhsNSAyLTUgMi0yIDUtMi01LTUtMiA1LTIgMi01WlwiIC8+PHBhdGggZD1cIm0xOC41IDE1IC44IDIuMiAyLjIuOC0yLjIuOC0uOCAyLjItLjgtMi4yLTIuMi0uOCAyLjItLjguOC0yLjJaXCIgLz48L3N2Zz47XHJcbn1cclxuXHJcbi8vIFx1MjUwMFx1MjUwMCBcdTRFM0JcdTdFQzRcdTRFRjYgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcbmZ1bmN0aW9uIE1vZGVsRW5oYW5jZXJTZWN0aW9uKHByb3BzKSB7XHJcbiAgY29uc3QgeyBhcGksIHQgfSA9IHByb3BzO1xyXG4gIGNvbnN0IFtzdGF0dXMsIHNldFN0YXR1c10gPSB1c2VTdGF0ZShcImxvYWRpbmdcIik7IC8vIGxvYWRpbmcgfCByZWFkeSB8IGVycm9yXHJcbiAgY29uc3QgW2Vycm9yLCBzZXRFcnJvcl0gPSB1c2VTdGF0ZShudWxsKTtcclxuICBjb25zdCBbcHJvdmlkZXJzLCBzZXRQcm92aWRlcnNdID0gdXNlU3RhdGUoW10pOyAvLyBbe2lkLCBkaXNwbGF5TmFtZSwgbW9kZWxzfV1cclxuICBjb25zdCBbcmV2aXNpb24sIHNldFJldmlzaW9uXSA9IHVzZVN0YXRlKHVuZGVmaW5lZCk7XHJcbiAgY29uc3QgW3NhdmluZywgc2V0U2F2aW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcclxuICBjb25zdCBbc2F2ZWQsIHNldFNhdmVkXSA9IHVzZVN0YXRlKGZhbHNlKTtcclxuICBjb25zdCBbc2F2ZUVycm9yLCBzZXRTYXZlRXJyb3JdID0gdXNlU3RhdGUobnVsbCk7XHJcbiAgY29uc3QgW2N1c3RvbVdpbmRvd3MsIHNldEN1c3RvbVdpbmRvd3NdID0gdXNlU3RhdGUoe30pOyAvLyBgJHtwaWR9OiR7aWR4fWAgLT4gc3RyaW5nXHJcbiAgY29uc3QgW2N1c3RvbU1heCwgc2V0Q3VzdG9tTWF4XSA9IHVzZVN0YXRlKHt9KTsgLy8gYCR7cGlkfToke2lkeH1gIC0+IHN0cmluZ1xyXG4gIGNvbnN0IFt2aXNpb25Pbmx5LCBzZXRWaXNpb25Pbmx5XSA9IHVzZVN0YXRlKGZhbHNlKTtcclxuICBjb25zdCBbdmlzaW9uT25seUJ1c3ksIHNldFZpc2lvbk9ubHlCdXN5XSA9IHVzZVN0YXRlKGZhbHNlKTtcclxuXHJcbiAgY29uc3QgbG9hZCA9IHVzZUNhbGxiYWNrKGFzeW5jICgpID0+IHtcclxuICAgIHNldFN0YXR1cyhcImxvYWRpbmdcIik7XHJcbiAgICBzZXRFcnJvcihudWxsKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IFtyZXNwb25zZSwgdmlzaW9uUmVzcG9uc2VdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xyXG4gICAgICAgIGFwaS5zZXR0aW5ncy5kZXNjcmliZSh7fSksXHJcbiAgICAgICAgZmV0Y2goXCIvbW9kbGVucy1ndWFyZC9zdGF0dXNcIikuY2F0Y2goKCkgPT4gbnVsbClcclxuICAgICAgXSk7XHJcbiAgICAgIGlmICghcmVzcG9uc2UucmVzdWx0Lm9rKSB0aHJvdyBuZXcgRXJyb3IocmVzcG9uc2UucmVzdWx0LmVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICBjb25zdCB2aXNpb25Cb2R5ID0gdmlzaW9uUmVzcG9uc2U/Lm9rID8gYXdhaXQgdmlzaW9uUmVzcG9uc2UuanNvbigpIDogbnVsbDtcclxuICAgICAgc2V0VmlzaW9uT25seSh2aXNpb25Cb2R5Py5zdGF0dXM/LnZpc2lvbk9ubHkgPT09IHRydWUpO1xyXG4gICAgICBjb25zdCB2YWx1ZSA9IHJlc3BvbnNlLnJlc3VsdC52YWx1ZTtcclxuICAgICAgY29uc3QgdmlldyA9IHZhbHVlLm5hbWVzcGFjZXMuZmluZCgodikgPT4gdi5ucyA9PT0gTExNX05TKTtcclxuICAgICAgaWYgKHZpZXcgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHNldFByb3ZpZGVycyhbXSk7XHJcbiAgICAgICAgc2V0QmFzZWxpbmUoW10pO1xyXG4gICAgICAgIHNldFJldmlzaW9uKHVuZGVmaW5lZCk7XHJcbiAgICAgICAgc2V0U3RhdHVzKFwicmVhZHlcIik7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGNmZyA9IHZpZXcudmFsdWUgPz8ge307XHJcbiAgICAgIGNvbnN0IHByb3ZpZGVyc01hcCA9IGNmZy5wcm92aWRlcnMgPz8ge307XHJcbiAgICAgIGNvbnN0IGxpc3QgPSBPYmplY3QuZW50cmllcyhwcm92aWRlcnNNYXApLm1hcCgoW2lkLCBwXSkgPT4gKHtcclxuICAgICAgICBpZCxcclxuICAgICAgICBkaXNwbGF5TmFtZTogcC5kaXNwbGF5TmFtZSA/PyBpZCxcclxuICAgICAgICBtb2RlbHM6IEFycmF5LmlzQXJyYXkocC5tb2RlbHMpID8gcC5tb2RlbHMubWFwKChtKSA9PiAoeyAuLi5tIH0pKSA6IFtdXHJcbiAgICAgIH0pKTtcclxuICAgICAgc2V0UHJvdmlkZXJzKGxpc3QpO1xyXG4gICAgICBzZXRCYXNlbGluZShsaXN0KTtcclxuICAgICAgc2V0UmV2aXNpb24odmlldy5yZXZpc2lvbik7XHJcbiAgICAgIHNldFN0YXR1cyhcInJlYWR5XCIpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICBzZXRFcnJvcihlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSkpO1xyXG4gICAgICBzZXRTdGF0dXMoXCJlcnJvclwiKTtcclxuICAgIH1cclxuICB9LCBbYXBpXSk7XHJcblxyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XHJcbiAgICBsb2FkKCk7XHJcbiAgfSwgW2xvYWRdKTtcclxuXHJcbiAgLy8gXHU0RkVFXHU2NTM5XHU2QTIxXHU1NzhCXHU1QjU3XHU2QkI1XHJcbiAgY29uc3QgcGF0Y2hNb2RlbCA9IChwaWQsIGluZGV4LCBwYXRjaCkgPT4ge1xyXG4gICAgc2V0U2F2ZWQoZmFsc2UpO1xyXG4gICAgc2V0U2F2ZUVycm9yKG51bGwpO1xyXG4gICAgc2V0UHJvdmlkZXJzKChsaXN0KSA9PlxyXG4gICAgICBsaXN0Lm1hcCgocCkgPT4ge1xyXG4gICAgICAgIGlmIChwLmlkICE9PSBwaWQpIHJldHVybiBwO1xyXG4gICAgICAgIGNvbnN0IG1vZGVscyA9IHAubW9kZWxzLm1hcCgobSwgaSkgPT4gKGkgPT09IGluZGV4ID8geyAuLi5tLCAuLi5wYXRjaCB9IDogbSkpO1xyXG4gICAgICAgIHJldHVybiB7IC4uLnAsIG1vZGVscyB9O1xyXG4gICAgICB9KVxyXG4gICAgKTtcclxuICB9O1xyXG5cclxuICAvLyBcdTc1MUZcdTYyMTAgb3BzXHVGRjFBXHU1M0VBXHU1M0QxXHU5MDAxXHU1M0Q4XHU1MzE2XHU4RkM3XHU3Njg0XHU1QjU3XHU2QkI1XHJcbiAgLy8gXHU2Q0U4XHU2MTBGXHVGRjFBc2V0dGluZ3MubXV0YXRlIFx1NzY4NCBhcHBseVBhdGhPcCBcdTRFMERcdTY1MkZcdTYzMDFcdTY1NzBcdTdFQzRcdTRFMEJcdTY4MDdcdThERUZcdTVGODRcdUZGMDhcdTRGMUFcdTYyOEFcdTY1NzBcdTdFQzRcdTkxQ0RcdTVFRkFcdTRFM0FcdTVCRjlcdThDNjFcdUZGMDlcdUZGMENcclxuICAvLyBcdTU2RTBcdTZCNjQgbW9kZWxzIFx1NjU3MFx1N0VDNFx1NUZDNVx1OTg3Qlx1NjU3NFx1NEY1MyBzZXQgXHU1MjMwIFtcInByb3ZpZGVyc1wiLCBpZCwgXCJtb2RlbHNcIl1cdUZGMDhcdTVCOThcdTY1QjlcdTZBMjFcdTU3OEJcdTk4NzVcdTU0MENcdTZCM0VcdTUwNUFcdTZDRDVcdUZGMDlcdTMwMDJcclxuICBjb25zdCBidWlsZE9wcyA9IHVzZUNhbGxiYWNrKFxyXG4gICAgKGJhc2VsaW5lLCBkcmFmdCkgPT4ge1xyXG4gICAgICBjb25zdCBvcHMgPSBbXTtcclxuICAgICAgZm9yIChjb25zdCBwcm92IG9mIGRyYWZ0KSB7XHJcbiAgICAgICAgY29uc3QgYmFzZVByb3YgPSBiYXNlbGluZS5maW5kKChiKSA9PiBiLmlkID09PSBwcm92LmlkKTtcclxuICAgICAgICBjb25zdCBiYXNlTW9kZWxzID0gYmFzZVByb3Y/Lm1vZGVscyA/PyBbXTtcclxuICAgICAgICBjb25zdCBkcmFmdE1vZGVscyA9IHByb3YubW9kZWxzO1xyXG4gICAgICAgIGlmIChKU09OLnN0cmluZ2lmeShiYXNlTW9kZWxzKSAhPT0gSlNPTi5zdHJpbmdpZnkoZHJhZnRNb2RlbHMpKSB7XHJcbiAgICAgICAgICBvcHMucHVzaCh7XHJcbiAgICAgICAgICAgIG9wOiBcInNldFwiLFxyXG4gICAgICAgICAgICBwYXRoOiBbXCJwcm92aWRlcnNcIiwgcHJvdi5pZCwgXCJtb2RlbHNcIl0sXHJcbiAgICAgICAgICAgIHZhbHVlOiBkcmFmdE1vZGVsc1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBvcHM7XHJcbiAgICB9LFxyXG4gICAgW11cclxuICApO1xyXG5cclxuICAvLyBcdTRGRERcdTVCNThcdTUyNERcdTc2ODQgYmFzZWxpbmVcdUZGMDhcdTY3MDBcdTU0MEVcdTRFMDBcdTZCMjFcdTUyQTBcdThGN0RcdTc2ODRcdTUzOUZcdTU5Q0JcdTUwM0NcdUZGMDlcclxuICBjb25zdCBbYmFzZWxpbmUsIHNldEJhc2VsaW5lXSA9IHVzZVN0YXRlKFtdKTtcclxuXHJcbiAgY29uc3Qgc2F2ZSA9IGFzeW5jICgpID0+IHtcclxuICAgIHNldFNhdmluZyh0cnVlKTtcclxuICAgIHNldFNhdmVFcnJvcihudWxsKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IG9wcyA9IGJ1aWxkT3BzKGJhc2VsaW5lLCBwcm92aWRlcnMpO1xyXG4gICAgICBpZiAob3BzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHNldFNhdmVkKHRydWUpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGFwaS5zZXR0aW5ncy5tdXRhdGUoe1xyXG4gICAgICAgIG5zOiBMTE1fTlMsXHJcbiAgICAgICAgb3BzLFxyXG4gICAgICAgIGV4cGVjdGVkUmV2aXNpb246IHJldmlzaW9uXHJcbiAgICAgIH0pO1xyXG4gICAgICBpZiAoIXJlc3BvbnNlLnJlc3VsdC5vaykge1xyXG4gICAgICAgIHNldFNhdmVFcnJvcihyZXNwb25zZS5yZXN1bHQuZXJyb3IuY29kZSA9PT0gXCJzZXR0aW5ncy1jb25mbGljdFwiID8gXCJcdTkxNERcdTdGNkVcdTVERjJcdTg4QUJcdTUxNzZcdTRFRDZcdTk4NzVcdTk3NjJcdTRGRUVcdTY1MzlcdUZGMENcdThCRjdcdTkxQ0RcdTY1QjBcdTUyQTBcdThGN0RcdTU0MEVcdTkxQ0RcdThCRDVcIiA6IHJlc3BvbnNlLnJlc3VsdC5lcnJvci5tZXNzYWdlKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgc2V0UmV2aXNpb24ocmVzcG9uc2UucmVzdWx0LnZhbHVlLnJldmlzaW9uKTtcclxuICAgICAgc2V0U2F2ZWQodHJ1ZSk7XHJcbiAgICAgIGF3YWl0IGxvYWQoKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgc2V0U2F2ZUVycm9yKGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSk7XHJcbiAgICB9IGZpbmFsbHkge1xyXG4gICAgICBzZXRTYXZpbmcoZmFsc2UpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IHNldFZpc2lvblJvdXRlID0gYXN5bmMgKGVuYWJsZWQpID0+IHtcclxuICAgIHNldFZpc2lvbk9ubHlCdXN5KHRydWUpO1xyXG4gICAgc2V0U2F2ZUVycm9yKG51bGwpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChcIi9tb2RsZW5zLWd1YXJkL3Zpc2lvbi1vbmx5XCIsIHtcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgXCJjb250ZW50LXR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVuYWJsZWQgfSlcclxuICAgICAgfSk7XHJcbiAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XHJcbiAgICAgIGlmICghcmVzcG9uc2Uub2sgfHwgYm9keS5vayAhPT0gdHJ1ZSkgdGhyb3cgbmV3IEVycm9yKGJvZHkuZXJyb3IgfHwgYEhUVFAgJHtyZXNwb25zZS5zdGF0dXN9YCk7XHJcbiAgICAgIHNldFZpc2lvbk9ubHkoYm9keS5zdGF0dXM/LnZpc2lvbk9ubHkgPT09IHRydWUpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICBzZXRTYXZlRXJyb3IoZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpKTtcclxuICAgIH0gZmluYWxseSB7XHJcbiAgICAgIHNldFZpc2lvbk9ubHlCdXN5KGZhbHNlKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBpZiAoc3RhdHVzID09PSBcImxvYWRpbmdcIikge1xyXG4gICAgcmV0dXJuIDxkaXYgc3R5bGU9e2Nzcy5zdGF0dXN9Pnt0KFwibG9hZGluZ1wiKX08L2Rpdj47XHJcbiAgfVxyXG4gIGlmIChzdGF0dXMgPT09IFwiZXJyb3JcIikge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgPGRpdj5cclxuICAgICAgICA8ZGl2IHN0eWxlPXtjc3MuZXJyb3J9Pnt0KFwibG9hZEZhaWxlZFwiKX06IHtlcnJvcn08L2Rpdj5cclxuICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBzdHlsZT17Y3NzLmJ1dHRvbn0gb25DbGljaz17bG9hZH0+e3QoXCJyZXRyeVwiKX08L2J1dHRvbj5cclxuICAgICAgPC9kaXY+XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgaGFzUGlBaSA9IHByb3ZpZGVycy5sZW5ndGggPiAwO1xyXG5cclxuICByZXR1cm4gKFxyXG4gICAgPGRpdiBzdHlsZT17Y3NzLnNlY3Rpb259PlxyXG4gICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6IFwiZmxleFwiLCBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLCBnYXA6IDE0LCBwYWRkaW5nOiBcIjRweCAwIDE4cHhcIiB9fT48ZGl2IHN0eWxlPXt7IHdpZHRoOiA0NCwgaGVpZ2h0OiA0NCwgZGlzcGxheTogXCJncmlkXCIsIHBsYWNlSXRlbXM6IFwiY2VudGVyXCIsIGJvcmRlclJhZGl1czogMTQsIGJhY2tncm91bmQ6IFwibGluZWFyLWdyYWRpZW50KDEzNWRlZywgIzdjM2FlZCwgI2RiMjc3NylcIiwgY29sb3I6IFwid2hpdGVcIiB9fT48TW9kZWxHbHlwaCBzaXplPXsyNX0gLz48L2Rpdj48ZGl2PjxoMSBzdHlsZT17eyBtYXJnaW46IDAsIGZvbnRTaXplOiAyMCwgbGluZUhlaWdodDogMS4yLCBmb250V2VpZ2h0OiA3MDAgfX0+e3QoXCJuYXZcIil9PC9oMT48cCBzdHlsZT17eyBtYXJnaW46IFwiNXB4IDAgMFwiLCBmb250U2l6ZTogMTMsIGNvbG9yOiBcInZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSwgIzZiNzI4MClcIiB9fT57dChcImhlcm9NZXRhXCIpfTwvcD48L2Rpdj48L2Rpdj5cclxuICAgICAgPHAgc3R5bGU9e2Nzcy5sZWFkfT57dChcImxlYWRcIil9PC9wPlxyXG4gICAgICA8ZGl2IHN0eWxlPXtjc3MuY2FyZH0+XHJcbiAgICAgICAgPGRpdiBzdHlsZT17Y3NzLnJvd30+XHJcbiAgICAgICAgICA8bGFiZWwgc3R5bGU9e2Nzcy5maWVsZH0gdGl0bGU9e3QoXCJ2aXNpb25Sb3V0ZVRpdGxlXCIpfT5cclxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIHN0eWxlPXtjc3MuY2hlY2tib3h9IGNoZWNrZWQ9e3Zpc2lvbk9ubHl9IGRpc2FibGVkPXt2aXNpb25Pbmx5QnVzeX0gb25DaGFuZ2U9eyhlKSA9PiB2b2lkIHNldFZpc2lvblJvdXRlKGUudGFyZ2V0LmNoZWNrZWQpfSAvPlxyXG4gICAgICAgICAgICB7dChcInZpc2lvblJvdXRlXCIpfVxyXG4gICAgICAgICAgPC9sYWJlbD5cclxuICAgICAgICAgIDxzcGFuIHN0eWxlPXtjc3MuaGludH0+e3Zpc2lvbk9ubHkgPyB0KFwidmlzaW9uUm91dGVPblwiKSA6IHQoXCJ2aXNpb25Sb3V0ZU9mZlwiKX08L3NwYW4+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICB7IWhhc1BpQWkgJiYgPGRpdiBzdHlsZT17Y3NzLmVtcHR5fT57dChcIm5vUGlBaVwiKX08L2Rpdj59XHJcbiAgICAgIHtwcm92aWRlcnMubWFwKChwcm92KSA9PiAoXHJcbiAgICAgICAgPGRpdiBrZXk9e3Byb3YuaWR9IHN0eWxlPXtjc3MuY2FyZH0+XHJcbiAgICAgICAgICA8ZGl2IHN0eWxlPXtjc3MuY2FyZEhlYWR9PlxyXG4gICAgICAgICAgICA8c3Bhbj57cHJvdi5kaXNwbGF5TmFtZX08L3NwYW4+XHJcbiAgICAgICAgICAgIDxzcGFuIHN0eWxlPXtjc3MuaGludH0+e3Byb3YuaWR9PC9zcGFuPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICB7cHJvdi5tb2RlbHMubGVuZ3RoID09PSAwICYmIDxkaXYgc3R5bGU9e2Nzcy5lbXB0eX0+e3QoXCJub01vZGVsc1wiKX08L2Rpdj59XHJcbiAgICAgICAgICB7cHJvdi5tb2RlbHMubWFwKChtb2RlbCwgaSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBpbWFnZU9uID0gQXJyYXkuaXNBcnJheShtb2RlbC5pbnB1dCkgJiYgbW9kZWwuaW5wdXQuaW5jbHVkZXMoXCJpbWFnZVwiKTtcclxuICAgICAgICAgICAgY29uc3Qga2V5ID0gYCR7cHJvdi5pZH06JHtpfWA7XHJcbiAgICAgICAgICAgIGNvbnN0IHdpbiA9IG1hdGNoT3B0aW9uKFdJTkRPV19PUFRJT05TLCBtb2RlbC5jb250ZXh0V2luZG93KTtcclxuICAgICAgICAgICAgY29uc3QgbWF4ID0gbWF0Y2hPcHRpb24oTUFYVE9LRU5TX09QVElPTlMsIG1vZGVsLm1heFRva2Vucyk7XHJcbiAgICAgICAgICAgIGNvbnN0IHdpblNlbGVjdFZhbHVlID0gd2luLmN1c3RvbSA/IFwiY3VzdG9tXCIgOiB3aW4ubWF0Y2hlZCA/IFN0cmluZyhtb2RlbC5jb250ZXh0V2luZG93KSA6IFwiXCI7XHJcbiAgICAgICAgICAgIGNvbnN0IG1heFNlbGVjdFZhbHVlID0gbWF4LmN1c3RvbSA/IFwiY3VzdG9tXCIgOiBtb2RlbC5tYXhUb2tlbnMgPT09IHVuZGVmaW5lZCB8fCBtb2RlbC5tYXhUb2tlbnMgPT09IG51bGwgPyBcIlwiIDogU3RyaW5nKG1vZGVsLm1heFRva2Vucyk7XHJcbiAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgPGRpdiBrZXk9e21vZGVsLmlkICsgaX0gc3R5bGU9e2kgJSAyID09PSAxID8geyAuLi5jc3Mucm93LCAuLi5jc3Mucm93QWx0IH0gOiBjc3Mucm93fT5cclxuICAgICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXtjc3MubW9kZWxJZH0gdGl0bGU9e21vZGVsLmlkfT57bW9kZWwuaWR9PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgPGxhYmVsIHN0eWxlPXtjc3MuZmllbGR9IHRpdGxlPXt0KFwiaW1hZ2VUaXRsZVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgIDxpbnB1dFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJjaGVja2JveFwiXHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e2Nzcy5jaGVja2JveH1cclxuICAgICAgICAgICAgICAgICAgICBjaGVja2VkPXtpbWFnZU9ufVxyXG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5wdXQgPSBlLnRhcmdldC5jaGVja2VkID8gW1widGV4dFwiLCBcImltYWdlXCJdIDogW1widGV4dFwiXTtcclxuICAgICAgICAgICAgICAgICAgICAgIHBhdGNoTW9kZWwocHJvdi5pZCwgaSwgeyBpbnB1dCB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICAgICAgICB7dChcImltYWdlXCIpfVxyXG4gICAgICAgICAgICAgICAgPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgIDxsYWJlbCBzdHlsZT17Y3NzLmZpZWxkfT5cclxuICAgICAgICAgICAgICAgICAge3QoXCJjb250ZXh0V2luZG93XCIpfVxyXG4gICAgICAgICAgICAgICAgICA8c2VsZWN0XHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e2Nzcy5zZWxlY3R9XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3dpblNlbGVjdFZhbHVlfVxyXG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgdiA9IGUudGFyZ2V0LnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHYgPT09IFwiY3VzdG9tXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0Q3VzdG9tV2luZG93cygobSkgPT4gKHsgLi4ubSwgW2tleV06IHdpbi5yYXcgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRjaE1vZGVsKHByb3YuaWQsIGksIHsgY29udGV4dFdpbmRvdzogdW5kZWZpbmVkIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2ID09PSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldEN1c3RvbVdpbmRvd3MoKG0pID0+ICh7IC4uLm0sIFtrZXldOiBcIlwiIH0pKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0Y2hNb2RlbChwcm92LmlkLCBpLCB7IGNvbnRleHRXaW5kb3c6IHVuZGVmaW5lZCB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoTW9kZWwocHJvdi5pZCwgaSwgeyBjb250ZXh0V2luZG93OiBOdW1iZXIodikgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJcIj57dChcInVuc2V0XCIpfTwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgIHtXSU5ET1dfT1BUSU9OUy5tYXAoKG8pID0+IChcclxuICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24ga2V5PXtvLmxhYmVsfSB2YWx1ZT17by52YWx1ZSA9PT0gXCJjdXN0b21cIiA/IFwiY3VzdG9tXCIgOiBTdHJpbmcoby52YWx1ZSl9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7by5sYWJlbH1cclxuICAgICAgICAgICAgICAgICAgICAgIDwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICkpfVxyXG4gICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cclxuICAgICAgICAgICAgICAgICAge3dpblNlbGVjdFZhbHVlID09PSBcImN1c3RvbVwiICYmIChcclxuICAgICAgICAgICAgICAgICAgICA8aW5wdXRcclxuICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXtjc3MuaW5wdXR9XHJcbiAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17dChcImN1c3RvbVBsYWNlaG9sZGVyXCIpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2N1c3RvbVdpbmRvd3Nba2V5XSA/PyB3aW4ucmF3fVxyXG4gICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBlLnRhcmdldC52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0Q3VzdG9tV2luZG93cygobSkgPT4gKHsgLi4ubSwgW2tleV06IHRleHQgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuID0gcGFyc2VDYXBhY2l0eSh0ZXh0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0Y2hNb2RlbChwcm92LmlkLCBpLCB7IGNvbnRleHRXaW5kb3c6IG4gfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgICAgICAgICl9XHJcbiAgICAgICAgICAgICAgICA8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgPGxhYmVsIHN0eWxlPXtjc3MuZmllbGR9PlxyXG4gICAgICAgICAgICAgICAgICB7dChcIm1heFRva2Vuc1wiKX1cclxuICAgICAgICAgICAgICAgICAgPHNlbGVjdFxyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXtjc3Muc2VsZWN0fVxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXttYXhTZWxlY3RWYWx1ZX1cclxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHYgPSBlLnRhcmdldC52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgIGlmICh2ID09PSBcImN1c3RvbVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldEN1c3RvbU1heCgobSkgPT4gKHsgLi4ubSwgW2tleV06IG1heC5yYXcgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRjaE1vZGVsKHByb3YuaWQsIGksIHsgbWF4VG9rZW5zOiB1bmRlZmluZWQgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHYgPT09IFwiXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0Q3VzdG9tTWF4KChtKSA9PiAoeyAuLi5tLCBba2V5XTogXCJcIiB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoTW9kZWwocHJvdi5pZCwgaSwgeyBtYXhUb2tlbnM6IHVuZGVmaW5lZCB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoTW9kZWwocHJvdi5pZCwgaSwgeyBtYXhUb2tlbnM6IE51bWJlcih2KSB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgICAge01BWFRPS0VOU19PUFRJT05TLm1hcCgobykgPT4gKFxyXG4gICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiBrZXk9e28ubGFiZWx9IHZhbHVlPXtvLnZhbHVlID09PSBcImN1c3RvbVwiID8gXCJjdXN0b21cIiA6IFN0cmluZyhvLnZhbHVlKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtvLmxhYmVsfVxyXG4gICAgICAgICAgICAgICAgICAgICAgPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgKSl9XHJcbiAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxyXG4gICAgICAgICAgICAgICAgICB7bWF4U2VsZWN0VmFsdWUgPT09IFwiY3VzdG9tXCIgJiYgKFxyXG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dFxyXG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e2Nzcy5pbnB1dH1cclxuICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXt0KFwiY3VzdG9tUGxhY2Vob2xkZXJcIil9XHJcbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17Y3VzdG9tTWF4W2tleV0gPz8gbWF4LnJhd31cclxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gZS50YXJnZXQudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldEN1c3RvbU1heCgobSkgPT4gKHsgLi4ubSwgW2tleV06IHRleHQgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuID0gcGFyc2VDYXBhY2l0eSh0ZXh0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0Y2hNb2RlbChwcm92LmlkLCBpLCB7IG1heFRva2VuczogbiB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICAgICAgKX1cclxuICAgICAgICAgICAgICAgIDwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17Y3NzLmhpbnR9Pnt0KFwiZWZmZWN0aXZlXCIsIHsgd2luZG93OiBmb3JtYXRDb3VudChtb2RlbC5jb250ZXh0V2luZG93KSwgbWF4OiBmb3JtYXRDb3VudChtb2RlbC5tYXhUb2tlbnMpIH0pfTwvc3Bhbj5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgIH0pfVxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICApKX1cclxuICAgICAgPGRpdiBzdHlsZT17Y3NzLmFjdGlvbnN9PlxyXG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIHN0eWxlPXtzYXZpbmcgPyB7IC4uLmNzcy5idXR0b24sIC4uLmNzcy5idXR0b25EaXNhYmxlZCB9IDogY3NzLmJ1dHRvbn0gZGlzYWJsZWQ9e3NhdmluZ30gb25DbGljaz17c2F2ZX0+XHJcbiAgICAgICAgICB7c2F2aW5nID8gdChcInNhdmluZ1wiKSA6IHQoXCJzYXZlXCIpfVxyXG4gICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIHN0eWxlPXt7IC4uLmNzcy5idXR0b24sIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIiwgY29sb3I6IFwidmFyKC0tZHN3LWFsaWFzLWxhYmVsLXNlY29uZGFyeSwgIzRiNTU2MylcIiwgYm9yZGVyOiBcIjFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLXN0cm9uZywgI2QxZDVkYilcIiB9fSBvbkNsaWNrPXtsb2FkfT5cclxuICAgICAgICAgIHt0KFwicmVsb2FkXCIpfVxyXG4gICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgIHtzYXZlZCAmJiA8c3BhbiBzdHlsZT17Y3NzLnN0YXR1c30+e3QoXCJzYXZlZFwiKX08L3NwYW4+fVxyXG4gICAgICAgIHtzYXZlRXJyb3IgJiYgPHNwYW4gc3R5bGU9e2Nzcy5lcnJvcn0+e3NhdmVFcnJvcn08L3NwYW4+fVxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPHAgc3R5bGU9e2Nzcy5oaW50fT57dChcImZvb3Rub3RlXCIpfTwvcD5cclxuICAgIDwvZGl2PlxyXG4gICk7XHJcbn1cclxuXHJcbi8vIFx1ODlFM1x1Njc5MCAxMjhLIC8gMU0gLyAxMzEwNzIgXHU0RTRCXHU3QzdCXHU3Njg0XHU4MEZEXHU1MjlCXHU1MTk5XHU2Q0Q1XHVGRjA4XHU0RTBFXHU1Qjk4XHU2NUI5XHU5ODc1XHU5NzYyXHU1NDBDXHU4QkNEXHU4ODY4XHVGRjA5XHJcbmZ1bmN0aW9uIHBhcnNlQ2FwYWNpdHkodGV4dCkge1xyXG4gIGNvbnN0IHMgPSBTdHJpbmcodGV4dCA/PyBcIlwiKS50cmltKCkudG9Mb3dlckNhc2UoKTtcclxuICBpZiAocyA9PT0gXCJcIikgcmV0dXJuIHVuZGVmaW5lZDtcclxuICBjb25zdCBtID0gcy5tYXRjaCgvXihcXGQrKD86XFwuXFxkKyk/KShba21dKT8kLyk7XHJcbiAgaWYgKCFtKSByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIGNvbnN0IG4gPSBwYXJzZUZsb2F0KG1bMV0pO1xyXG4gIGlmICghTnVtYmVyLmlzRmluaXRlKG4pIHx8IG4gPD0gMCkgcmV0dXJuIHVuZGVmaW5lZDtcclxuICBjb25zdCBtdWx0ID0gbVsyXSA9PT0gXCJrXCIgPyAxMDAwIDogbVsyXSA9PT0gXCJtXCIgPyAxMDAwMDAwIDogMTtcclxuICByZXR1cm4gTWF0aC5yb3VuZChuICogbXVsdCk7XHJcbn1cclxuXHJcbi8vIFx1MjUwMFx1MjUwMCBcdTYzRDJcdTRFRjZcdTUxNjVcdTUzRTMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcbmNvbnN0IGluamVjdCA9IFtcInNsb3RzXCIsIFwibG9jYWxlXCIsIFwiY29ubmVjdGlvblwiXTtcclxuXHJcbmZ1bmN0aW9uIGFwcGx5KGN0eCkge1xyXG4gIGNvbnN0IE5TX0RJQ1QgPSB7XHJcbiAgICB6aDoge1xyXG4gICAgICBuYXY6IFwiXHU2QTIxXHU1NzhCXHU1ODlFXHU1RjNBXCIsXHJcbiAgICAgIGhlcm9NZXRhOiBcIlx1NTZGRVx1NzI0N1x1OEY5M1x1NTE2NVx1NEUwRVx1NkEyMVx1NTc4Qlx1ODBGRFx1NTI5Qlx1NTNDMlx1NjU3MFwiLFxyXG4gICAgICBsZWFkOiBcIlx1NTcyOFx1NkI2NFx1NEUzQVx1ODFFQVx1NUI5QVx1NEU0OVx1NkEyMVx1NTc4Qlx1OTE0RFx1N0Y2RVx1MzAwQ1x1NTZGRVx1NzI0N1x1OEY5M1x1NTE2NVx1MzAwRFx1NEUwRVx1NEUwQVx1NEUwQlx1NjU4N1x1N0E5N1x1NTNFMy9cdTY3MDBcdTU5MjdcdThGOTNcdTUxRkFcdTc2ODRcdTVGRUJcdTYzNzdcdTkwMDlcdTk4NzlcdTMwMDJcdTYyNDBcdTY3MDlcdTRGRUVcdTY1MzlcdTUxOTlcdTUxNjUgbGxtLXBpLWFpIFx1OTE0RFx1N0Y2RVx1RkYwQ1x1NEUwRVx1NUI5OFx1NjVCOVx1MzAwQ1x1NkEyMVx1NTc4Qlx1MzAwRFx1OTg3NVx1NTE3MVx1NzUyOFx1NTQwQ1x1NEUwMFx1NEVGRFx1OTE0RFx1N0Y2RVx1MzAwMlwiLFxyXG4gICAgICBpbWFnZTogXCJcdTU2RkVcdTcyNDdcdThGOTNcdTUxNjVcIixcclxuICAgICAgaW1hZ2VUaXRsZTogXCJcdTUxNDFcdThCQjhcdThCRTVcdTZBMjFcdTU3OEJcdTYzQTVcdTY1MzZcdTU2RkVcdTcyNDdcdTk2NDRcdTRFRjZcdUZGMDhcdTUxOTlcdTUxNjUgaW5wdXQ6IFt0ZXh0LCBpbWFnZV1cdUZGMDlcIixcclxuICAgICAgdmlzaW9uUm91dGU6IFwiXHU4OUM2XHU4OUM5XHU2ODY1XHU2QTIxXHU1NzhCXHU1MjE3XHU4ODY4XCIsXHJcbiAgICAgIHZpc2lvblJvdXRlVGl0bGU6IFwiXHU1RjAwXHU1NDJGXHU1NDBFXHU5NjkwXHU4NUNGXHU1QkY5XHU1RTk0XHU3Njg0XHU1MzlGXHU1OUNCXHU3RUFGXHU2NTg3XHU2NzJDXHU2QTIxXHU1NzhCXHVGRjBDXHU0RUM1XHU0RkREXHU3NTU5XHU1RTI2IChNb2RMZW5zKSBcdTc2ODRcdTg5QzZcdTg5QzlcdTY4NjVcdTZBMjFcdTU3OEJcIixcclxuICAgICAgdmlzaW9uUm91dGVPbjogXCJcdTVERjJcdTVGMDBcdTU0MkZcdUZGMUFcdTRFQzVcdTY2M0VcdTc5M0FcdTg5QzZcdTg5QzlcdTY4NjVcdTZBMjFcdTU3OEJcIixcclxuICAgICAgdmlzaW9uUm91dGVPZmY6IFwiXHU1REYyXHU1MTczXHU5NUVEXHVGRjFBXHU1NDBDXHU2NUY2XHU2NjNFXHU3OTNBXHU1MzlGXHU1OUNCXHU2QTIxXHU1NzhCXHU0RTBFXHU4OUM2XHU4OUM5XHU2ODY1XHU2QTIxXHU1NzhCXCIsXHJcbiAgICAgIGNvbnRleHRXaW5kb3c6IFwiXHU0RTBBXHU0RTBCXHU2NTg3XHU3QTk3XHU1M0UzXCIsXHJcbiAgICAgIG1heFRva2VuczogXCJcdTY3MDBcdTU5MjdcdThGOTNcdTUxRkFcIixcclxuICAgICAgdW5zZXQ6IFwiXHU0RTBEXHU1ODZCXHVGRjA4XHU5RUQ4XHU4QkE0XHVGRjA5XCIsXHJcbiAgICAgIGN1c3RvbVBsYWNlaG9sZGVyOiBcIlx1NTk4MiAxMzEwNzJcIixcclxuICAgICAgZWZmZWN0aXZlOiBcIlx1NzUxRlx1NjU0OFx1NTAzQ1x1RkYxQVx1N0E5N1x1NTNFMyB7d2luZG93fSAvIFx1OEY5M1x1NTFGQSB7bWF4fVwiLFxyXG4gICAgICBzYXZlOiBcIlx1NEZERFx1NUI1OFx1NEZFRVx1NjUzOVwiLFxyXG4gICAgICBzYXZpbmc6IFwiXHU0RkREXHU1QjU4XHU0RTJEXHUyMDI2XCIsXHJcbiAgICAgIHNhdmVkOiBcIlx1NURGMlx1NEZERFx1NUI1OCBcdTI3MTNcIixcclxuICAgICAgcmVsb2FkOiBcIlx1OTFDRFx1NjVCMFx1NTJBMFx1OEY3RFwiLFxyXG4gICAgICBsb2FkaW5nOiBcIlx1NTJBMFx1OEY3RFx1NEUyRFx1MjAyNlwiLFxyXG4gICAgICByZXRyeTogXCJcdTkxQ0RcdThCRDVcIixcclxuICAgICAgbG9hZEZhaWxlZDogXCJcdTUyQTBcdThGN0RcdTU5MzFcdThEMjVcIixcclxuICAgICAgbm9QaUFpOiBcIlx1NjcyQVx1NjI3RVx1NTIzMCBsbG0tcGktYWkgXHU5MTREXHU3RjZFXHUzMDAyXHU4QkY3XHU1MTQ4XHU1NzI4XHU1Qjk4XHU2NUI5XHUzMDBDXHU2QTIxXHU1NzhCXHUzMDBEXHU5ODc1XHU2REZCXHU1MkEwXHU4MUVBXHU1QjlBXHU0RTQ5XHU2M0QwXHU0RjlCXHU1NTQ2XHUzMDAyXCIsXHJcbiAgICAgIG5vTW9kZWxzOiBcIlx1OEJFNVx1NjNEMFx1NEY5Qlx1NTU0Nlx1NkNBMVx1NjcwOVx1ODFFQVx1NUI5QVx1NEU0OVx1NkEyMVx1NTc4Qlx1MzAwMlwiLFxyXG4gICAgICBmb290bm90ZTogXCJcdTYzRDBcdTc5M0FcdUZGMUFcdTY3MkFcdTUyRkVcdTkwMDlcdTRFM0FcdTdFQUZcdTY1ODdcdTY3MkNcdUZGMDh0ZXh0XHVGRjA5XHVGRjFCXHU1MkZFXHU5MDA5XHU1NDBFXHU0RTNBXHU2NTg3XHU2NzJDK1x1NTZGRVx1NzI0N1x1RkYwOHRleHQsIGltYWdlXHVGRjA5XHUzMDAyXHU4QkY3XHU1M0VBXHU1QkY5XHU0RTBBXHU2RTM4XHU1QjlFXHU5NjQ1XHU2NTJGXHU2MzAxXHU1NkZFXHU3MjQ3XHU3Njg0XHU2QTIxXHU1NzhCXHU1MkZFXHU5MDA5XHUzMDAyXHU0RTBBXHU0RTBCXHU2NTg3XHU3QTk3XHU1M0UzXHU4QkY3XHU1MkZGXHU4RDg1XHU4RkM3XHU0RTBBXHU2RTM4XHU3NzFGXHU1QjlFXHU5NjUwXHU1MjM2XHUzMDAyXCJcclxuICAgIH0sXHJcbiAgICBlbjoge1xyXG4gICAgICBuYXY6IFwiTW9kZWwgRW5oYW5jZVwiLFxyXG4gICAgICBoZXJvTWV0YTogXCJJbWFnZSBpbnB1dCBhbmQgbW9kZWwgY2FwYWJpbGl0eSBzZXR0aW5nc1wiLFxyXG4gICAgICBsZWFkOiBcIkNvbmZpZ3VyZSBpbWFnZSBpbnB1dCBhbmQgcXVpY2sgY29udGV4dC13aW5kb3cgLyBtYXgtb3V0cHV0IHByZXNldHMgZm9yIGN1c3RvbSBtb2RlbHMuIENoYW5nZXMgYXJlIHdyaXR0ZW4gdG8gdGhlIGxsbS1waS1haSBzZXR0aW5ncyBzaGFyZWQgd2l0aCB0aGUgb2ZmaWNpYWwgTW9kZWxzIHBhZ2UuXCIsXHJcbiAgICAgIGltYWdlOiBcIkltYWdlIGlucHV0XCIsXHJcbiAgICAgIGltYWdlVGl0bGU6IFwiQWxsb3cgdGhpcyBtb2RlbCB0byByZWNlaXZlIGltYWdlIGF0dGFjaG1lbnRzICh3cml0ZXMgaW5wdXQ6IFt0ZXh0LCBpbWFnZV0pXCIsXHJcbiAgICAgIHZpc2lvblJvdXRlOiBcIlZpc2lvbiBicmlkZ2UgbW9kZWwgbGlzdFwiLFxyXG4gICAgICB2aXNpb25Sb3V0ZVRpdGxlOiBcIkhpZGUgdGhlIG9yaWdpbmFsIHRleHQtb25seSBtb2RlbCBhbmQga2VlcCBvbmx5IGl0cyAoTW9kTGVucykgYnJpZGdlIG1vZGVsXCIsXHJcbiAgICAgIHZpc2lvblJvdXRlT246IFwiT246IHNob3cgYnJpZGdlIG1vZGVscyBvbmx5XCIsXHJcbiAgICAgIHZpc2lvblJvdXRlT2ZmOiBcIk9mZjogc2hvdyBib3RoIG9yaWdpbmFsIGFuZCBicmlkZ2UgbW9kZWxzXCIsXHJcbiAgICAgIGNvbnRleHRXaW5kb3c6IFwiQ29udGV4dCB3aW5kb3dcIixcclxuICAgICAgbWF4VG9rZW5zOiBcIk1heCBvdXRwdXRcIixcclxuICAgICAgdW5zZXQ6IFwiVW5zZXQgKGRlZmF1bHQpXCIsXHJcbiAgICAgIGN1c3RvbVBsYWNlaG9sZGVyOiBcImUuZy4gMTMxMDcyXCIsXHJcbiAgICAgIGVmZmVjdGl2ZTogXCJFZmZlY3RpdmU6IHdpbmRvdyB7d2luZG93fSAvIG91dHB1dCB7bWF4fVwiLFxyXG4gICAgICBzYXZlOiBcIlNhdmUgY2hhbmdlc1wiLFxyXG4gICAgICBzYXZpbmc6IFwiU2F2aW5nXHUyMDI2XCIsXHJcbiAgICAgIHNhdmVkOiBcIlNhdmVkIFx1MjcxM1wiLFxyXG4gICAgICByZWxvYWQ6IFwiUmVsb2FkXCIsXHJcbiAgICAgIGxvYWRpbmc6IFwiTG9hZGluZ1x1MjAyNlwiLFxyXG4gICAgICByZXRyeTogXCJSZXRyeVwiLFxyXG4gICAgICBsb2FkRmFpbGVkOiBcIkxvYWQgZmFpbGVkXCIsXHJcbiAgICAgIG5vUGlBaTogXCJObyBsbG0tcGktYWkgY29uZmlndXJhdGlvbiBmb3VuZC4gQWRkIGEgY3VzdG9tIHByb3ZpZGVyIG9uIHRoZSBvZmZpY2lhbCBNb2RlbHMgcGFnZSBmaXJzdC5cIixcclxuICAgICAgbm9Nb2RlbHM6IFwiVGhpcyBwcm92aWRlciBoYXMgbm8gY3VzdG9tIG1vZGVscy5cIixcclxuICAgICAgZm9vdG5vdGU6IFwiVW5jaGVja2VkIG1lYW5zIHRleHQtb25seTsgY2hlY2tlZCBtZWFucyB0ZXh0IHBsdXMgaW1hZ2UuIEVuYWJsZSBpdCBvbmx5IGZvciBtb2RlbHMgd2hvc2UgdXBzdHJlYW0gYWN0dWFsbHkgc3VwcG9ydHMgaW1hZ2UgaW5wdXQuIEtlZXAgdGhlIGNvbnRleHQgd2luZG93IHdpdGhpbiB0aGUgdXBzdHJlYW0gbGltaXQuXCJcclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvLyBcdTRFMERcdTUxOERcdTUzMDVcdTg4QzUgc2Vzc2lvbnMuc2VsZWN0TW9kZWxcdUZGMUFcdTUyMDdcdTYzNjJcdTZBMjFcdTU3OEJcdTRFMERcdTVFOTRcdTY1MzlcdTUxOTlcdTRGMUFcdThCRERcdTRFMkRcdTc2ODRcdTU2RkVcdTcyNDdcdTUzODZcdTUzRjJcdTMwMDJcclxuICAvLyBcdTdFQUZcdTY1ODdcdTY3MkNcdTZBMjFcdTU3OEJcdTc2ODRcdTU2RkVcdTcyNDdcdTYzMDlcdTgwRkRcdTUyOUJcdTUyMDZcdTZENDFcdTc1MzEgZHNoLW1vZGxlbnMtZ3VhcmQgXHU1NzI4XHU1M0QxXHU5MDAxXHU2NUY2XHU1OTA0XHU3NDA2XHUzMDAyXHJcbiAgY29uc3QgY29ubmVjdGlvbiA9IGN0eC5nZXQoXCJjb25uZWN0aW9uXCIpO1xyXG4gIGN0eC5lZmZlY3QoKCkgPT4gY3R4LmxvY2FsZS5yZWdpc3RlcihOUywgTlNfRElDVCksIFwibW9kZWwtZW5oYW5jZXI6IGNvcHkgZGljdGlvbmFyaWVzXCIpO1xyXG4gIGNvbnN0IHQgPSBjdHgubG9jYWxlLmJpbmQoTlMpO1xyXG4gIGNvbnN0IGluamVjdGVkID0gKCkgPT4gKHsgYXBpOiBjb25uZWN0aW9uLmFwaSwgdCB9KTtcclxuICBjdHguc2xvdHMuaW5qZWN0KFwic2V0dGluZ3Muc2VjdGlvblwiLCAoKSA9PlxyXG4gICAgY3R4LnNsb3RzLnJlZ2lzdGVyKFxyXG4gICAgICB7XHJcbiAgICAgICAgbmFtZTogXCJzZXR0aW5ncy5zZWN0aW9uXCIsXHJcbiAgICAgICAgaWQ6IFwibW9kZWwtZW5oYW5jZXJcIixcclxuICAgICAgICBvcmRlcjogMTEsXHJcbiAgICAgICAgbGFiZWw6ICgpID0+IHQoXCJuYXZcIiksXHJcbiAgICAgICAgaW5qZWN0OiBpbmplY3RlZFxyXG4gICAgICB9LFxyXG4gICAgICBNb2RlbEVuaGFuY2VyU2VjdGlvblxyXG4gICAgKVxyXG4gICk7XHJcbn1cclxuXHJcbmV4cG9ydCB7IGFwcGx5LCBpbmplY3QgfTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUtBLG1CQUFpRDtBQThEeEM7QUE1RFQsSUFBTSxLQUFLO0FBQ1gsSUFBTSxTQUFTO0FBR2YsSUFBTSxpQkFBaUI7QUFBQSxFQUNyQixFQUFFLE9BQU8sUUFBUSxPQUFPLE9BQU87QUFBQSxFQUMvQixFQUFFLE9BQU8sUUFBUSxPQUFPLE9BQU87QUFBQSxFQUMvQixFQUFFLE9BQU8sUUFBUSxPQUFPLE9BQU87QUFBQSxFQUMvQixFQUFFLE9BQU8sTUFBTSxPQUFPLFFBQVE7QUFBQSxFQUM5QixFQUFFLE9BQU8sTUFBTSxPQUFPLFFBQVE7QUFBQSxFQUM5QixFQUFFLE9BQU8sTUFBTSxPQUFPLFFBQVE7QUFBQSxFQUM5QixFQUFFLE9BQU8sNEJBQVEsT0FBTyxTQUFTO0FBQ25DO0FBRUEsSUFB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

		return module.exports;
	}
});
//# sourceMappingURL=client.js.map
