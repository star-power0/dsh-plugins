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

// ../DeepSeekHarness/dsh-home/profiles/plugins/dsh-model-enhancer/src/client.js
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
  lead: { fontSize: 13, lineHeight: 1.6, color: "var(--dsw-alias-label-tertiary, #6b7280)", margin: "0 0 20px" },
  card: { border: "1px solid color-mix(in srgb, var(--dsw-alias-border-l2, #e5e7eb) 92%, transparent)", borderRadius: 14, marginBottom: 18, overflow: "hidden", background: "color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 84%, transparent)", boxShadow: "0 8px 24px rgb(0 0 0 / 0.08), inset 0 1px 0 rgb(255 255 255 / 0.06)" },
  cardHead: { padding: "13px 16px", fontWeight: 650, fontSize: 14, background: "color-mix(in srgb, var(--dsw-alias-bg-module-platform, #f7f8fa) 82%, transparent)", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--dsw-alias-border-l1, #f0f1f3)" },
  row: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 14px", padding: "12px 16px", borderTop: "1px solid color-mix(in srgb, var(--dsw-alias-border-l1, #f0f1f3) 82%, transparent)", transition: "background-color 120ms ease" },
  rowAlt: { background: "color-mix(in srgb, var(--dsw-alias-bg-module-platform, #fafbfc) 42%, transparent)" },
  modelId: { flex: "1 1 140px", minWidth: 120, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  field: { display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--dsw-alias-label-secondary, #4b5563)" },
  select: { padding: "5px 8px", borderRadius: 8, border: "1px solid var(--dsw-alias-border-l2, #d1d5db)", background: "var(--dsw-specific-input-major, #fff)", fontSize: 12, color: "inherit", minWidth: 96, maxWidth: 140 },
  input: { padding: "5px 8px", borderRadius: 8, border: "1px solid var(--dsw-alias-border-l2, #d1d5db)", background: "var(--dsw-specific-input-major, #fff)", fontSize: 12, width: 90, color: "inherit" },
  checkbox: { accentColor: "var(--dsw-alias-brand-primary, #3b82f6)", margin: 0, width: 16, height: 16 },
  empty: { padding: "14px 16px", fontSize: 13, color: "var(--dsw-alias-label-tertiary, #9ca3af)" },
  actions: { display: "flex", gap: 10, alignItems: "center", marginTop: 8, paddingTop: 14, borderTop: "1px solid var(--dsw-alias-border-l2, #e5e7eb)", flexWrap: "wrap" },
  button: { padding: "7px 15px", borderRadius: 8, border: "none", background: "var(--dsw-alias-brand-primary, #3b82f6)", color: "var(--dsw-alias-label-primary-inverted, #fff)", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  buttonDisabled: { opacity: 0.5, cursor: "not-allowed" },
  hint: { fontSize: 12, color: "var(--dsw-alias-label-tertiary, #9ca3af)" },
  status: { fontSize: 12, color: "var(--dsw-alias-label-secondary, #4b5563)" },
  error: { fontSize: 12, color: "var(--dsw-alias-state-error-primary, #dc2626)" }
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vRGVlcFNlZWtIYXJuZXNzL2RzaC1ob21lL3Byb2ZpbGVzL3BsdWdpbnMvZHNoLW1vZGVsLWVuaGFuY2VyL3NyYy9jbGllbnQuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIGRzaC1tb2RlbC1lbmhhbmNlciBcdTIwMTRcdTIwMTQgY2xpZW50IFx1N0FFRlx1RkYwOFx1NkQ0Rlx1ODlDOFx1NTY2OFx1RkYwOVxyXG4vLyBcdTU3MjhcdThCQkVcdTdGNkVcdTk4NzVcdTZDRThcdTUxOENcdTMwMENcdTZBMjFcdTU3OEJcdTU4OUVcdTVGM0FcdTMwMERzZWN0aW9uXHVGRjFBXHJcbi8vICAgLSBcdTZCQ0ZcdTRFMkFcdTgxRUFcdTVCOUFcdTRFNDlcdTZBMjFcdTU3OEJcdTYzRDBcdTRGOUJcdTMwMENcdTU2RkVcdTcyNDdcdThGOTNcdTUxNjVcdTMwMERcdTUyRkVcdTkwMDlcdUZGMDhcdTUxOTkgbGxtLXBpLWFpIFx1NzY4NCBpbnB1dCBcdTVCNTdcdTZCQjVcdUZGMDlcclxuLy8gICAtIFx1NEUwQVx1NEUwQlx1NjU4N1x1N0E5N1x1NTNFMyAvIFx1NjcwMFx1NTkyN1x1OEY5M1x1NTFGQVx1NzY4NFx1NUZFQlx1NjM3N1x1NEUwQlx1NjJDOVx1OTAwOVx1NjJFOVx1RkYwODEyOEsvMjU2Sy8xTVx1MjAyNlx1RkYwOVxyXG4vLyBcdTRFMEVcdTVCOThcdTY1QjlcdTMwMENcdTZBMjFcdTU3OEJcdTMwMERcdTk4NzVcdTUxNzFcdTc1MjhcdTU0MENcdTRFMDBcdTRFRkQgbGxtLXBpLWFpIFx1OTE0RFx1N0Y2RVx1RkYwQ1x1OTAxQVx1OEZDNyBzZXR0aW5ncyBBUEkgXHU4QkZCXHU1MTk5XHUzMDAyXHJcbmltcG9ydCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZUNhbGxiYWNrIH0gZnJvbSBcInJlYWN0XCI7XHJcblxyXG5jb25zdCBOUyA9IFwic2V0dGluZ3MubW9kZWwtZW5oYW5jZXJcIjtcclxuY29uc3QgTExNX05TID0gXCJsbG0tcGktYWlcIjtcclxuXHJcbi8vIFx1MjUwMFx1MjUwMCBcdTVGRUJcdTYzNzdcdTkwMDlcdTk4NzkgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcbmNvbnN0IFdJTkRPV19PUFRJT05TID0gW1xyXG4gIHsgbGFiZWw6IFwiMTI4S1wiLCB2YWx1ZTogMTMxMDcyIH0sXHJcbiAgeyBsYWJlbDogXCIyNTZLXCIsIHZhbHVlOiAyNjIxNDQgfSxcclxuICB7IGxhYmVsOiBcIjUxMktcIiwgdmFsdWU6IDUyNDI4OCB9LFxyXG4gIHsgbGFiZWw6IFwiMU1cIiwgdmFsdWU6IDEwNDg1NzYgfSxcclxuICB7IGxhYmVsOiBcIjJNXCIsIHZhbHVlOiAyMDk3MTUyIH0sXHJcbiAgeyBsYWJlbDogXCI0TVwiLCB2YWx1ZTogNDE5NDMwNCB9LFxyXG4gIHsgbGFiZWw6IFwiXHU4MUVBXHU1QjlBXHU0RTQ5XHUyMDI2XCIsIHZhbHVlOiBcImN1c3RvbVwiIH1cclxuXTtcclxuXHJcbmNvbnN0IE1BWFRPS0VOU19PUFRJT05TID0gW1xyXG4gIHsgbGFiZWw6IFwiXHU5RUQ4XHU4QkE0XHVGRjA4XHU0RTBEXHU1ODZCXHVGRjA5XCIsIHZhbHVlOiBcIlwiIH0sXHJcbiAgeyBsYWJlbDogXCIxNktcIiwgdmFsdWU6IDE2Mzg0IH0sXHJcbiAgeyBsYWJlbDogXCIzMktcIiwgdmFsdWU6IDMyNzY4IH0sXHJcbiAgeyBsYWJlbDogXCI2NEtcIiwgdmFsdWU6IDY1NTM2IH0sXHJcbiAgeyBsYWJlbDogXCIxMjhLXCIsIHZhbHVlOiAxMzEwNzIgfSxcclxuICB7IGxhYmVsOiBcIlx1ODFFQVx1NUI5QVx1NEU0OVx1MjAyNlwiLCB2YWx1ZTogXCJjdXN0b21cIiB9XHJcbl07XHJcblxyXG5mdW5jdGlvbiBmb3JtYXRDb3VudChuKSB7XHJcbiAgaWYgKHR5cGVvZiBuICE9PSBcIm51bWJlclwiIHx8ICFOdW1iZXIuaXNGaW5pdGUobikpIHJldHVybiBcIlwiO1xyXG4gIGlmIChuID49IDEwNDg1NzYpIHJldHVybiBgJHsobiAvIDEwNDg1NzYpLnRvRml4ZWQobiAlIDEwNDg1NzYgPT09IDAgPyAwIDogMSl9TWA7XHJcbiAgaWYgKG4gPj0gMTAyNCkgcmV0dXJuIGAkeyhuIC8gMTAyNCkudG9GaXhlZChuICUgMTAyNCA9PT0gMCA/IDAgOiAxKX1LYDtcclxuICByZXR1cm4gU3RyaW5nKG4pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYXRjaE9wdGlvbihvcHRpb25zLCB2YWx1ZSkge1xyXG4gIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsKSByZXR1cm4geyBtYXRjaGVkOiBmYWxzZSwgY3VzdG9tOiBmYWxzZSwgcmF3OiBcIlwiIH07XHJcbiAgY29uc3QgaGl0ID0gb3B0aW9ucy5maW5kKChvKSA9PiB0eXBlb2Ygby52YWx1ZSA9PT0gXCJudW1iZXJcIiAmJiBvLnZhbHVlID09PSB2YWx1ZSk7XHJcbiAgaWYgKGhpdCkgcmV0dXJuIHsgbWF0Y2hlZDogdHJ1ZSwgY3VzdG9tOiBmYWxzZSwgcmF3OiBcIlwiIH07XHJcbiAgcmV0dXJuIHsgbWF0Y2hlZDogZmFsc2UsIGN1c3RvbTogdHJ1ZSwgcmF3OiBTdHJpbmcodmFsdWUpIH07XHJcbn1cclxuXHJcbi8vIFx1MjUwMFx1MjUwMCBcdTY4MzdcdTVGMEZcdUZGMDhcdTUxODVcdTgwNTRcdUZGMENcdTkwN0ZcdTUxNEQgQ1NTIFx1NkEyMVx1NTc1N1x1Njc4NFx1NUVGQVx1RkYwOVx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxyXG5jb25zdCBjc3MgPSB7XHJcbiAgc2VjdGlvbjogeyBtYXhXaWR0aDogNzIwLCBjb2xvcjogXCJ2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgIzFmMjMyOSlcIiwgZm9udEZhbWlseTogXCJpbmhlcml0XCIgfSxcclxuICBsZWFkOiB7IGZvbnRTaXplOiAxMywgbGluZUhlaWdodDogMS42LCBjb2xvcjogXCJ2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnksICM2YjcyODApXCIsIG1hcmdpbjogXCIwIDAgMjBweFwiIH0sXHJcbiAgY2FyZDogeyBib3JkZXI6IFwiMXB4IHNvbGlkIGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwyLCAjZTVlN2ViKSA5MiUsIHRyYW5zcGFyZW50KVwiLCBib3JkZXJSYWRpdXM6IDE0LCBtYXJnaW5Cb3R0b206IDE4LCBvdmVyZmxvdzogXCJoaWRkZW5cIiwgYmFja2dyb3VuZDogXCJjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tZHN3LWFsaWFzLWJnLWJhc2UsICNmZmYpIDg0JSwgdHJhbnNwYXJlbnQpXCIsIGJveFNoYWRvdzogXCIwIDhweCAyNHB4IHJnYigwIDAgMCAvIDAuMDgpLCBpbnNldCAwIDFweCAwIHJnYigyNTUgMjU1IDI1NSAvIDAuMDYpXCIgfSxcclxuICBjYXJkSGVhZDogeyBwYWRkaW5nOiBcIjEzcHggMTZweFwiLCBmb250V2VpZ2h0OiA2NTAsIGZvbnRTaXplOiAxNCwgYmFja2dyb3VuZDogXCJjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tZHN3LWFsaWFzLWJnLW1vZHVsZS1wbGF0Zm9ybSwgI2Y3ZjhmYSkgODIlLCB0cmFuc3BhcmVudClcIiwgZGlzcGxheTogXCJmbGV4XCIsIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsIGdhcDogOCwgYm9yZGVyQm90dG9tOiBcIjFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwxLCAjZjBmMWYzKVwiIH0sXHJcbiAgcm93OiB7IGRpc3BsYXk6IFwiZmxleFwiLCBmbGV4V3JhcDogXCJ3cmFwXCIsIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsIGdhcDogXCIxMHB4IDE0cHhcIiwgcGFkZGluZzogXCIxMnB4IDE2cHhcIiwgYm9yZGVyVG9wOiBcIjFweCBzb2xpZCBjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tZHN3LWFsaWFzLWJvcmRlci1sMSwgI2YwZjFmMykgODIlLCB0cmFuc3BhcmVudClcIiwgdHJhbnNpdGlvbjogXCJiYWNrZ3JvdW5kLWNvbG9yIDEyMG1zIGVhc2VcIiB9LFxyXG4gIHJvd0FsdDogeyBiYWNrZ3JvdW5kOiBcImNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1kc3ctYWxpYXMtYmctbW9kdWxlLXBsYXRmb3JtLCAjZmFmYmZjKSA0MiUsIHRyYW5zcGFyZW50KVwiIH0sXHJcbiAgbW9kZWxJZDogeyBmbGV4OiBcIjEgMSAxNDBweFwiLCBtaW5XaWR0aDogMTIwLCBmb250U2l6ZTogMTMsIGZvbnRXZWlnaHQ6IDYwMCwgb3ZlcmZsb3c6IFwiaGlkZGVuXCIsIHRleHRPdmVyZmxvdzogXCJlbGxpcHNpc1wiLCB3aGl0ZVNwYWNlOiBcIm5vd3JhcFwiIH0sXHJcbiAgZmllbGQ6IHsgZGlzcGxheTogXCJpbmxpbmUtZmxleFwiLCBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLCBnYXA6IDcsIGZvbnRTaXplOiAxMiwgY29sb3I6IFwidmFyKC0tZHN3LWFsaWFzLWxhYmVsLXNlY29uZGFyeSwgIzRiNTU2MylcIiB9LFxyXG4gIHNlbGVjdDogeyBwYWRkaW5nOiBcIjVweCA4cHhcIiwgYm9yZGVyUmFkaXVzOiA4LCBib3JkZXI6IFwiMXB4IHNvbGlkIHZhcigtLWRzdy1hbGlhcy1ib3JkZXItbDIsICNkMWQ1ZGIpXCIsIGJhY2tncm91bmQ6IFwidmFyKC0tZHN3LXNwZWNpZmljLWlucHV0LW1ham9yLCAjZmZmKVwiLCBmb250U2l6ZTogMTIsIGNvbG9yOiBcImluaGVyaXRcIiwgbWluV2lkdGg6IDk2LCBtYXhXaWR0aDogMTQwIH0sXHJcbiAgaW5wdXQ6IHsgcGFkZGluZzogXCI1cHggOHB4XCIsIGJvcmRlclJhZGl1czogOCwgYm9yZGVyOiBcIjFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwyLCAjZDFkNWRiKVwiLCBiYWNrZ3JvdW5kOiBcInZhcigtLWRzdy1zcGVjaWZpYy1pbnB1dC1tYWpvciwgI2ZmZilcIiwgZm9udFNpemU6IDEyLCB3aWR0aDogOTAsIGNvbG9yOiBcImluaGVyaXRcIiB9LFxyXG4gIGNoZWNrYm94OiB7IGFjY2VudENvbG9yOiBcInZhcigtLWRzdy1hbGlhcy1icmFuZC1wcmltYXJ5LCAjM2I4MmY2KVwiLCBtYXJnaW46IDAsIHdpZHRoOiAxNiwgaGVpZ2h0OiAxNiB9LFxyXG4gIGVtcHR5OiB7IHBhZGRpbmc6IFwiMTRweCAxNnB4XCIsIGZvbnRTaXplOiAxMywgY29sb3I6IFwidmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjOWNhM2FmKVwiIH0sXHJcbiAgYWN0aW9uczogeyBkaXNwbGF5OiBcImZsZXhcIiwgZ2FwOiAxMCwgYWxpZ25JdGVtczogXCJjZW50ZXJcIiwgbWFyZ2luVG9wOiA4LCBwYWRkaW5nVG9wOiAxNCwgYm9yZGVyVG9wOiBcIjFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwyLCAjZTVlN2ViKVwiLCBmbGV4V3JhcDogXCJ3cmFwXCIgfSxcclxuICBidXR0b246IHsgcGFkZGluZzogXCI3cHggMTVweFwiLCBib3JkZXJSYWRpdXM6IDgsIGJvcmRlcjogXCJub25lXCIsIGJhY2tncm91bmQ6IFwidmFyKC0tZHN3LWFsaWFzLWJyYW5kLXByaW1hcnksICMzYjgyZjYpXCIsIGNvbG9yOiBcInZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LWludmVydGVkLCAjZmZmKVwiLCBmb250U2l6ZTogMTMsIGZvbnRXZWlnaHQ6IDYwMCwgY3Vyc29yOiBcInBvaW50ZXJcIiB9LFxyXG4gIGJ1dHRvbkRpc2FibGVkOiB7IG9wYWNpdHk6IDAuNSwgY3Vyc29yOiBcIm5vdC1hbGxvd2VkXCIgfSxcclxuICBoaW50OiB7IGZvbnRTaXplOiAxMiwgY29sb3I6IFwidmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjOWNhM2FmKVwiIH0sXHJcbiAgc3RhdHVzOiB7IGZvbnRTaXplOiAxMiwgY29sb3I6IFwidmFyKC0tZHN3LWFsaWFzLWxhYmVsLXNlY29uZGFyeSwgIzRiNTU2MylcIiB9LFxyXG4gIGVycm9yOiB7IGZvbnRTaXplOiAxMiwgY29sb3I6IFwidmFyKC0tZHN3LWFsaWFzLXN0YXRlLWVycm9yLXByaW1hcnksICNkYzI2MjYpXCIgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gTW9kZWxHbHlwaCh7IHNpemUgPSAyMiB9KSB7XHJcbiAgcmV0dXJuIDxzdmcgd2lkdGg9e3NpemV9IGhlaWdodD17c2l6ZX0gdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlV2lkdGg9XCIxLjhcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48cGF0aCBkPVwiTTEyIDMgMTQgOGw1IDItNSAyLTIgNS0yLTUtNS0yIDUtMiAyLTVaXCIgLz48cGF0aCBkPVwibTE4LjUgMTUgLjggMi4yIDIuMi44LTIuMi44LS44IDIuMi0uOC0yLjItMi4yLS44IDIuMi0uOC44LTIuMlpcIiAvPjwvc3ZnPjtcclxufVxyXG5cclxuLy8gXHUyNTAwXHUyNTAwIFx1NEUzQlx1N0VDNFx1NEVGNiBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuZnVuY3Rpb24gTW9kZWxFbmhhbmNlclNlY3Rpb24ocHJvcHMpIHtcclxuICBjb25zdCB7IGFwaSwgdCB9ID0gcHJvcHM7XHJcbiAgY29uc3QgW3N0YXR1cywgc2V0U3RhdHVzXSA9IHVzZVN0YXRlKFwibG9hZGluZ1wiKTsgLy8gbG9hZGluZyB8IHJlYWR5IHwgZXJyb3JcclxuICBjb25zdCBbZXJyb3IsIHNldEVycm9yXSA9IHVzZVN0YXRlKG51bGwpO1xyXG4gIGNvbnN0IFtwcm92aWRlcnMsIHNldFByb3ZpZGVyc10gPSB1c2VTdGF0ZShbXSk7IC8vIFt7aWQsIGRpc3BsYXlOYW1lLCBtb2RlbHN9XVxyXG4gIGNvbnN0IFtyZXZpc2lvbiwgc2V0UmV2aXNpb25dID0gdXNlU3RhdGUodW5kZWZpbmVkKTtcclxuICBjb25zdCBbc2F2aW5nLCBzZXRTYXZpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xyXG4gIGNvbnN0IFtzYXZlZCwgc2V0U2F2ZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xyXG4gIGNvbnN0IFtzYXZlRXJyb3IsIHNldFNhdmVFcnJvcl0gPSB1c2VTdGF0ZShudWxsKTtcclxuICBjb25zdCBbY3VzdG9tV2luZG93cywgc2V0Q3VzdG9tV2luZG93c10gPSB1c2VTdGF0ZSh7fSk7IC8vIGAke3BpZH06JHtpZHh9YCAtPiBzdHJpbmdcclxuICBjb25zdCBbY3VzdG9tTWF4LCBzZXRDdXN0b21NYXhdID0gdXNlU3RhdGUoe30pOyAvLyBgJHtwaWR9OiR7aWR4fWAgLT4gc3RyaW5nXHJcbiAgY29uc3QgW3Zpc2lvbk9ubHksIHNldFZpc2lvbk9ubHldID0gdXNlU3RhdGUoZmFsc2UpO1xyXG4gIGNvbnN0IFt2aXNpb25Pbmx5QnVzeSwgc2V0VmlzaW9uT25seUJ1c3ldID0gdXNlU3RhdGUoZmFsc2UpO1xyXG5cclxuICBjb25zdCBsb2FkID0gdXNlQ2FsbGJhY2soYXN5bmMgKCkgPT4ge1xyXG4gICAgc2V0U3RhdHVzKFwibG9hZGluZ1wiKTtcclxuICAgIHNldEVycm9yKG51bGwpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgW3Jlc3BvbnNlLCB2aXNpb25SZXNwb25zZV0gPSBhd2FpdCBQcm9taXNlLmFsbChbXHJcbiAgICAgICAgYXBpLnNldHRpbmdzLmRlc2NyaWJlKHt9KSxcclxuICAgICAgICBmZXRjaChcIi9tb2RsZW5zLWd1YXJkL3N0YXR1c1wiKS5jYXRjaCgoKSA9PiBudWxsKVxyXG4gICAgICBdKTtcclxuICAgICAgaWYgKCFyZXNwb25zZS5yZXN1bHQub2spIHRocm93IG5ldyBFcnJvcihyZXNwb25zZS5yZXN1bHQuZXJyb3IubWVzc2FnZSk7XHJcbiAgICAgIGNvbnN0IHZpc2lvbkJvZHkgPSB2aXNpb25SZXNwb25zZT8ub2sgPyBhd2FpdCB2aXNpb25SZXNwb25zZS5qc29uKCkgOiBudWxsO1xyXG4gICAgICBzZXRWaXNpb25Pbmx5KHZpc2lvbkJvZHk/LnN0YXR1cz8udmlzaW9uT25seSA9PT0gdHJ1ZSk7XHJcbiAgICAgIGNvbnN0IHZhbHVlID0gcmVzcG9uc2UucmVzdWx0LnZhbHVlO1xyXG4gICAgICBjb25zdCB2aWV3ID0gdmFsdWUubmFtZXNwYWNlcy5maW5kKCh2KSA9PiB2Lm5zID09PSBMTE1fTlMpO1xyXG4gICAgICBpZiAodmlldyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgc2V0UHJvdmlkZXJzKFtdKTtcclxuICAgICAgICBzZXRCYXNlbGluZShbXSk7XHJcbiAgICAgICAgc2V0UmV2aXNpb24odW5kZWZpbmVkKTtcclxuICAgICAgICBzZXRTdGF0dXMoXCJyZWFkeVwiKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgY2ZnID0gdmlldy52YWx1ZSA/PyB7fTtcclxuICAgICAgY29uc3QgcHJvdmlkZXJzTWFwID0gY2ZnLnByb3ZpZGVycyA/PyB7fTtcclxuICAgICAgY29uc3QgbGlzdCA9IE9iamVjdC5lbnRyaWVzKHByb3ZpZGVyc01hcCkubWFwKChbaWQsIHBdKSA9PiAoe1xyXG4gICAgICAgIGlkLFxyXG4gICAgICAgIGRpc3BsYXlOYW1lOiBwLmRpc3BsYXlOYW1lID8/IGlkLFxyXG4gICAgICAgIG1vZGVsczogQXJyYXkuaXNBcnJheShwLm1vZGVscykgPyBwLm1vZGVscy5tYXAoKG0pID0+ICh7IC4uLm0gfSkpIDogW11cclxuICAgICAgfSkpO1xyXG4gICAgICBzZXRQcm92aWRlcnMobGlzdCk7XHJcbiAgICAgIHNldEJhc2VsaW5lKGxpc3QpO1xyXG4gICAgICBzZXRSZXZpc2lvbih2aWV3LnJldmlzaW9uKTtcclxuICAgICAgc2V0U3RhdHVzKFwicmVhZHlcIik7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIHNldEVycm9yKGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSk7XHJcbiAgICAgIHNldFN0YXR1cyhcImVycm9yXCIpO1xyXG4gICAgfVxyXG4gIH0sIFthcGldKTtcclxuXHJcbiAgdXNlRWZmZWN0KCgpID0+IHtcclxuICAgIGxvYWQoKTtcclxuICB9LCBbbG9hZF0pO1xyXG5cclxuICAvLyBcdTRGRUVcdTY1MzlcdTZBMjFcdTU3OEJcdTVCNTdcdTZCQjVcclxuICBjb25zdCBwYXRjaE1vZGVsID0gKHBpZCwgaW5kZXgsIHBhdGNoKSA9PiB7XHJcbiAgICBzZXRTYXZlZChmYWxzZSk7XHJcbiAgICBzZXRTYXZlRXJyb3IobnVsbCk7XHJcbiAgICBzZXRQcm92aWRlcnMoKGxpc3QpID0+XHJcbiAgICAgIGxpc3QubWFwKChwKSA9PiB7XHJcbiAgICAgICAgaWYgKHAuaWQgIT09IHBpZCkgcmV0dXJuIHA7XHJcbiAgICAgICAgY29uc3QgbW9kZWxzID0gcC5tb2RlbHMubWFwKChtLCBpKSA9PiAoaSA9PT0gaW5kZXggPyB7IC4uLm0sIC4uLnBhdGNoIH0gOiBtKSk7XHJcbiAgICAgICAgcmV0dXJuIHsgLi4ucCwgbW9kZWxzIH07XHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG4gIH07XHJcblxyXG4gIC8vIFx1NzUxRlx1NjIxMCBvcHNcdUZGMUFcdTUzRUFcdTUzRDFcdTkwMDFcdTUzRDhcdTUzMTZcdThGQzdcdTc2ODRcdTVCNTdcdTZCQjVcclxuICAvLyBcdTZDRThcdTYxMEZcdUZGMUFzZXR0aW5ncy5tdXRhdGUgXHU3Njg0IGFwcGx5UGF0aE9wIFx1NEUwRFx1NjUyRlx1NjMwMVx1NjU3MFx1N0VDNFx1NEUwQlx1NjgwN1x1OERFRlx1NUY4NFx1RkYwOFx1NEYxQVx1NjI4QVx1NjU3MFx1N0VDNFx1OTFDRFx1NUVGQVx1NEUzQVx1NUJGOVx1OEM2MVx1RkYwOVx1RkYwQ1xyXG4gIC8vIFx1NTZFMFx1NkI2NCBtb2RlbHMgXHU2NTcwXHU3RUM0XHU1RkM1XHU5ODdCXHU2NTc0XHU0RjUzIHNldCBcdTUyMzAgW1wicHJvdmlkZXJzXCIsIGlkLCBcIm1vZGVsc1wiXVx1RkYwOFx1NUI5OFx1NjVCOVx1NkEyMVx1NTc4Qlx1OTg3NVx1NTQwQ1x1NkIzRVx1NTA1QVx1NkNENVx1RkYwOVx1MzAwMlxyXG4gIGNvbnN0IGJ1aWxkT3BzID0gdXNlQ2FsbGJhY2soXHJcbiAgICAoYmFzZWxpbmUsIGRyYWZ0KSA9PiB7XHJcbiAgICAgIGNvbnN0IG9wcyA9IFtdO1xyXG4gICAgICBmb3IgKGNvbnN0IHByb3Ygb2YgZHJhZnQpIHtcclxuICAgICAgICBjb25zdCBiYXNlUHJvdiA9IGJhc2VsaW5lLmZpbmQoKGIpID0+IGIuaWQgPT09IHByb3YuaWQpO1xyXG4gICAgICAgIGNvbnN0IGJhc2VNb2RlbHMgPSBiYXNlUHJvdj8ubW9kZWxzID8/IFtdO1xyXG4gICAgICAgIGNvbnN0IGRyYWZ0TW9kZWxzID0gcHJvdi5tb2RlbHM7XHJcbiAgICAgICAgaWYgKEpTT04uc3RyaW5naWZ5KGJhc2VNb2RlbHMpICE9PSBKU09OLnN0cmluZ2lmeShkcmFmdE1vZGVscykpIHtcclxuICAgICAgICAgIG9wcy5wdXNoKHtcclxuICAgICAgICAgICAgb3A6IFwic2V0XCIsXHJcbiAgICAgICAgICAgIHBhdGg6IFtcInByb3ZpZGVyc1wiLCBwcm92LmlkLCBcIm1vZGVsc1wiXSxcclxuICAgICAgICAgICAgdmFsdWU6IGRyYWZ0TW9kZWxzXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG9wcztcclxuICAgIH0sXHJcbiAgICBbXVxyXG4gICk7XHJcblxyXG4gIC8vIFx1NEZERFx1NUI1OFx1NTI0RFx1NzY4NCBiYXNlbGluZVx1RkYwOFx1NjcwMFx1NTQwRVx1NEUwMFx1NkIyMVx1NTJBMFx1OEY3RFx1NzY4NFx1NTM5Rlx1NTlDQlx1NTAzQ1x1RkYwOVxyXG4gIGNvbnN0IFtiYXNlbGluZSwgc2V0QmFzZWxpbmVdID0gdXNlU3RhdGUoW10pO1xyXG5cclxuICBjb25zdCBzYXZlID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgc2V0U2F2aW5nKHRydWUpO1xyXG4gICAgc2V0U2F2ZUVycm9yKG51bGwpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3Qgb3BzID0gYnVpbGRPcHMoYmFzZWxpbmUsIHByb3ZpZGVycyk7XHJcbiAgICAgIGlmIChvcHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgc2V0U2F2ZWQodHJ1ZSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXBpLnNldHRpbmdzLm11dGF0ZSh7XHJcbiAgICAgICAgbnM6IExMTV9OUyxcclxuICAgICAgICBvcHMsXHJcbiAgICAgICAgZXhwZWN0ZWRSZXZpc2lvbjogcmV2aXNpb25cclxuICAgICAgfSk7XHJcbiAgICAgIGlmICghcmVzcG9uc2UucmVzdWx0Lm9rKSB7XHJcbiAgICAgICAgc2V0U2F2ZUVycm9yKHJlc3BvbnNlLnJlc3VsdC5lcnJvci5jb2RlID09PSBcInNldHRpbmdzLWNvbmZsaWN0XCIgPyBcIlx1OTE0RFx1N0Y2RVx1NURGMlx1ODhBQlx1NTE3Nlx1NEVENlx1OTg3NVx1OTc2Mlx1NEZFRVx1NjUzOVx1RkYwQ1x1OEJGN1x1OTFDRFx1NjVCMFx1NTJBMFx1OEY3RFx1NTQwRVx1OTFDRFx1OEJENVwiIDogcmVzcG9uc2UucmVzdWx0LmVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBzZXRSZXZpc2lvbihyZXNwb25zZS5yZXN1bHQudmFsdWUucmV2aXNpb24pO1xyXG4gICAgICBzZXRTYXZlZCh0cnVlKTtcclxuICAgICAgYXdhaXQgbG9hZCgpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICBzZXRTYXZlRXJyb3IoZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpKTtcclxuICAgIH0gZmluYWxseSB7XHJcbiAgICAgIHNldFNhdmluZyhmYWxzZSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgY29uc3Qgc2V0VmlzaW9uUm91dGUgPSBhc3luYyAoZW5hYmxlZCkgPT4ge1xyXG4gICAgc2V0VmlzaW9uT25seUJ1c3kodHJ1ZSk7XHJcbiAgICBzZXRTYXZlRXJyb3IobnVsbCk7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKFwiL21vZGxlbnMtZ3VhcmQvdmlzaW9uLW9ubHlcIiwge1xyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgaGVhZGVyczogeyBcImNvbnRlbnQtdHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZW5hYmxlZCB9KVxyXG4gICAgICB9KTtcclxuICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcclxuICAgICAgaWYgKCFyZXNwb25zZS5vayB8fCBib2R5Lm9rICE9PSB0cnVlKSB0aHJvdyBuZXcgRXJyb3IoYm9keS5lcnJvciB8fCBgSFRUUCAke3Jlc3BvbnNlLnN0YXR1c31gKTtcclxuICAgICAgc2V0VmlzaW9uT25seShib2R5LnN0YXR1cz8udmlzaW9uT25seSA9PT0gdHJ1ZSk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIHNldFNhdmVFcnJvcihlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSkpO1xyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgc2V0VmlzaW9uT25seUJ1c3koZmFsc2UpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGlmIChzdGF0dXMgPT09IFwibG9hZGluZ1wiKSB7XHJcbiAgICByZXR1cm4gPGRpdiBzdHlsZT17Y3NzLnN0YXR1c30+e3QoXCJsb2FkaW5nXCIpfTwvZGl2PjtcclxuICB9XHJcbiAgaWYgKHN0YXR1cyA9PT0gXCJlcnJvclwiKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICA8ZGl2PlxyXG4gICAgICAgIDxkaXYgc3R5bGU9e2Nzcy5lcnJvcn0+e3QoXCJsb2FkRmFpbGVkXCIpfToge2Vycm9yfTwvZGl2PlxyXG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIHN0eWxlPXtjc3MuYnV0dG9ufSBvbkNsaWNrPXtsb2FkfT57dChcInJldHJ5XCIpfTwvYnV0dG9uPlxyXG4gICAgICA8L2Rpdj5cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBoYXNQaUFpID0gcHJvdmlkZXJzLmxlbmd0aCA+IDA7XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2IHN0eWxlPXtjc3Muc2VjdGlvbn0+XHJcbiAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogXCJmbGV4XCIsIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsIGdhcDogMTQsIHBhZGRpbmc6IFwiNHB4IDAgMThweFwiIH19PjxkaXYgc3R5bGU9e3sgd2lkdGg6IDQ0LCBoZWlnaHQ6IDQ0LCBkaXNwbGF5OiBcImdyaWRcIiwgcGxhY2VJdGVtczogXCJjZW50ZXJcIiwgYm9yZGVyUmFkaXVzOiAxNCwgYmFja2dyb3VuZDogXCJsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCAjN2MzYWVkLCAjZGIyNzc3KVwiLCBjb2xvcjogXCJ3aGl0ZVwiIH19PjxNb2RlbEdseXBoIHNpemU9ezI1fSAvPjwvZGl2PjxkaXY+PGgxIHN0eWxlPXt7IG1hcmdpbjogMCwgZm9udFNpemU6IDIwLCBsaW5lSGVpZ2h0OiAxLjIsIGZvbnRXZWlnaHQ6IDcwMCB9fT57dChcIm5hdlwiKX08L2gxPjxwIHN0eWxlPXt7IG1hcmdpbjogXCI1cHggMCAwXCIsIGZvbnRTaXplOiAxMywgY29sb3I6IFwidmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5LCAjNmI3MjgwKVwiIH19Pnt0KFwiaGVyb01ldGFcIil9PC9wPjwvZGl2PjwvZGl2PlxyXG4gICAgICA8cCBzdHlsZT17Y3NzLmxlYWR9Pnt0KFwibGVhZFwiKX08L3A+XHJcbiAgICAgIDxkaXYgc3R5bGU9e2Nzcy5jYXJkfT5cclxuICAgICAgICA8ZGl2IHN0eWxlPXtjc3Mucm93fT5cclxuICAgICAgICAgIDxsYWJlbCBzdHlsZT17Y3NzLmZpZWxkfSB0aXRsZT17dChcInZpc2lvblJvdXRlVGl0bGVcIil9PlxyXG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgc3R5bGU9e2Nzcy5jaGVja2JveH0gY2hlY2tlZD17dmlzaW9uT25seX0gZGlzYWJsZWQ9e3Zpc2lvbk9ubHlCdXN5fSBvbkNoYW5nZT17KGUpID0+IHZvaWQgc2V0VmlzaW9uUm91dGUoZS50YXJnZXQuY2hlY2tlZCl9IC8+XHJcbiAgICAgICAgICAgIHt0KFwidmlzaW9uUm91dGVcIil9XHJcbiAgICAgICAgICA8L2xhYmVsPlxyXG4gICAgICAgICAgPHNwYW4gc3R5bGU9e2Nzcy5oaW50fT57dmlzaW9uT25seSA/IHQoXCJ2aXNpb25Sb3V0ZU9uXCIpIDogdChcInZpc2lvblJvdXRlT2ZmXCIpfTwvc3Bhbj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgPC9kaXY+XHJcbiAgICAgIHshaGFzUGlBaSAmJiA8ZGl2IHN0eWxlPXtjc3MuZW1wdHl9Pnt0KFwibm9QaUFpXCIpfTwvZGl2Pn1cclxuICAgICAge3Byb3ZpZGVycy5tYXAoKHByb3YpID0+IChcclxuICAgICAgICA8ZGl2IGtleT17cHJvdi5pZH0gc3R5bGU9e2Nzcy5jYXJkfT5cclxuICAgICAgICAgIDxkaXYgc3R5bGU9e2Nzcy5jYXJkSGVhZH0+XHJcbiAgICAgICAgICAgIDxzcGFuPntwcm92LmRpc3BsYXlOYW1lfTwvc3Bhbj5cclxuICAgICAgICAgICAge3Byb3YuaWQgIT09IHByb3YuZGlzcGxheU5hbWUgJiYgPHNwYW4gc3R5bGU9e2Nzcy5oaW50fT57cHJvdi5pZH08L3NwYW4+fVxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICB7cHJvdi5tb2RlbHMubGVuZ3RoID09PSAwICYmIDxkaXYgc3R5bGU9e2Nzcy5lbXB0eX0+e3QoXCJub01vZGVsc1wiKX08L2Rpdj59XHJcbiAgICAgICAgICB7cHJvdi5tb2RlbHMubWFwKChtb2RlbCwgaSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBpbWFnZU9uID0gQXJyYXkuaXNBcnJheShtb2RlbC5pbnB1dCkgJiYgbW9kZWwuaW5wdXQuaW5jbHVkZXMoXCJpbWFnZVwiKTtcclxuICAgICAgICAgICAgY29uc3Qga2V5ID0gYCR7cHJvdi5pZH06JHtpfWA7XHJcbiAgICAgICAgICAgIGNvbnN0IHdpbiA9IG1hdGNoT3B0aW9uKFdJTkRPV19PUFRJT05TLCBtb2RlbC5jb250ZXh0V2luZG93KTtcclxuICAgICAgICAgICAgY29uc3QgbWF4ID0gbWF0Y2hPcHRpb24oTUFYVE9LRU5TX09QVElPTlMsIG1vZGVsLm1heFRva2Vucyk7XHJcbiAgICAgICAgICAgIGNvbnN0IHdpblNlbGVjdFZhbHVlID0gd2luLmN1c3RvbSA/IFwiY3VzdG9tXCIgOiB3aW4ubWF0Y2hlZCA/IFN0cmluZyhtb2RlbC5jb250ZXh0V2luZG93KSA6IFwiXCI7XHJcbiAgICAgICAgICAgIGNvbnN0IG1heFNlbGVjdFZhbHVlID0gbWF4LmN1c3RvbSA/IFwiY3VzdG9tXCIgOiBtb2RlbC5tYXhUb2tlbnMgPT09IHVuZGVmaW5lZCB8fCBtb2RlbC5tYXhUb2tlbnMgPT09IG51bGwgPyBcIlwiIDogU3RyaW5nKG1vZGVsLm1heFRva2Vucyk7XHJcbiAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgPGRpdiBrZXk9e21vZGVsLmlkICsgaX0gc3R5bGU9e2kgJSAyID09PSAxID8geyAuLi5jc3Mucm93LCAuLi5jc3Mucm93QWx0IH0gOiBjc3Mucm93fT5cclxuICAgICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXtjc3MubW9kZWxJZH0gdGl0bGU9e21vZGVsLmlkfT57bW9kZWwuaWR9PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgPGxhYmVsIHN0eWxlPXtjc3MuZmllbGR9IHRpdGxlPXt0KFwiaW1hZ2VUaXRsZVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgIDxpbnB1dFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJjaGVja2JveFwiXHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e2Nzcy5jaGVja2JveH1cclxuICAgICAgICAgICAgICAgICAgICBjaGVja2VkPXtpbWFnZU9ufVxyXG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5wdXQgPSBlLnRhcmdldC5jaGVja2VkID8gW1widGV4dFwiLCBcImltYWdlXCJdIDogW1widGV4dFwiXTtcclxuICAgICAgICAgICAgICAgICAgICAgIHBhdGNoTW9kZWwocHJvdi5pZCwgaSwgeyBpbnB1dCB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICAgICAgICB7dChcImltYWdlXCIpfVxyXG4gICAgICAgICAgICAgICAgPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgIDxsYWJlbCBzdHlsZT17Y3NzLmZpZWxkfT5cclxuICAgICAgICAgICAgICAgICAge3QoXCJjb250ZXh0V2luZG93XCIpfVxyXG4gICAgICAgICAgICAgICAgICA8c2VsZWN0XHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e2Nzcy5zZWxlY3R9XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3dpblNlbGVjdFZhbHVlfVxyXG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgdiA9IGUudGFyZ2V0LnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHYgPT09IFwiY3VzdG9tXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0Q3VzdG9tV2luZG93cygobSkgPT4gKHsgLi4ubSwgW2tleV06IHdpbi5yYXcgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRjaE1vZGVsKHByb3YuaWQsIGksIHsgY29udGV4dFdpbmRvdzogdW5kZWZpbmVkIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2ID09PSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldEN1c3RvbVdpbmRvd3MoKG0pID0+ICh7IC4uLm0sIFtrZXldOiBcIlwiIH0pKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0Y2hNb2RlbChwcm92LmlkLCBpLCB7IGNvbnRleHRXaW5kb3c6IHVuZGVmaW5lZCB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoTW9kZWwocHJvdi5pZCwgaSwgeyBjb250ZXh0V2luZG93OiBOdW1iZXIodikgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJcIj57dChcInVuc2V0XCIpfTwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgIHtXSU5ET1dfT1BUSU9OUy5tYXAoKG8pID0+IChcclxuICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24ga2V5PXtvLmxhYmVsfSB2YWx1ZT17by52YWx1ZSA9PT0gXCJjdXN0b21cIiA/IFwiY3VzdG9tXCIgOiBTdHJpbmcoby52YWx1ZSl9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7by5sYWJlbH1cclxuICAgICAgICAgICAgICAgICAgICAgIDwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICkpfVxyXG4gICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cclxuICAgICAgICAgICAgICAgICAge3dpblNlbGVjdFZhbHVlID09PSBcImN1c3RvbVwiICYmIChcclxuICAgICAgICAgICAgICAgICAgICA8aW5wdXRcclxuICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXtjc3MuaW5wdXR9XHJcbiAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17dChcImN1c3RvbVBsYWNlaG9sZGVyXCIpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2N1c3RvbVdpbmRvd3Nba2V5XSA/PyB3aW4ucmF3fVxyXG4gICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBlLnRhcmdldC52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0Q3VzdG9tV2luZG93cygobSkgPT4gKHsgLi4ubSwgW2tleV06IHRleHQgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuID0gcGFyc2VDYXBhY2l0eSh0ZXh0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0Y2hNb2RlbChwcm92LmlkLCBpLCB7IGNvbnRleHRXaW5kb3c6IG4gfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgICAgICAgICl9XHJcbiAgICAgICAgICAgICAgICA8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgPGxhYmVsIHN0eWxlPXtjc3MuZmllbGR9PlxyXG4gICAgICAgICAgICAgICAgICB7dChcIm1heFRva2Vuc1wiKX1cclxuICAgICAgICAgICAgICAgICAgPHNlbGVjdFxyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXtjc3Muc2VsZWN0fVxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXttYXhTZWxlY3RWYWx1ZX1cclxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHYgPSBlLnRhcmdldC52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgIGlmICh2ID09PSBcImN1c3RvbVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldEN1c3RvbU1heCgobSkgPT4gKHsgLi4ubSwgW2tleV06IG1heC5yYXcgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRjaE1vZGVsKHByb3YuaWQsIGksIHsgbWF4VG9rZW5zOiB1bmRlZmluZWQgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHYgPT09IFwiXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0Q3VzdG9tTWF4KChtKSA9PiAoeyAuLi5tLCBba2V5XTogXCJcIiB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoTW9kZWwocHJvdi5pZCwgaSwgeyBtYXhUb2tlbnM6IHVuZGVmaW5lZCB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoTW9kZWwocHJvdi5pZCwgaSwgeyBtYXhUb2tlbnM6IE51bWJlcih2KSB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgICAge01BWFRPS0VOU19PUFRJT05TLm1hcCgobykgPT4gKFxyXG4gICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiBrZXk9e28ubGFiZWx9IHZhbHVlPXtvLnZhbHVlID09PSBcImN1c3RvbVwiID8gXCJjdXN0b21cIiA6IFN0cmluZyhvLnZhbHVlKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtvLmxhYmVsfVxyXG4gICAgICAgICAgICAgICAgICAgICAgPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgKSl9XHJcbiAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxyXG4gICAgICAgICAgICAgICAgICB7bWF4U2VsZWN0VmFsdWUgPT09IFwiY3VzdG9tXCIgJiYgKFxyXG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dFxyXG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e2Nzcy5pbnB1dH1cclxuICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXt0KFwiY3VzdG9tUGxhY2Vob2xkZXJcIil9XHJcbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17Y3VzdG9tTWF4W2tleV0gPz8gbWF4LnJhd31cclxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gZS50YXJnZXQudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldEN1c3RvbU1heCgobSkgPT4gKHsgLi4ubSwgW2tleV06IHRleHQgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuID0gcGFyc2VDYXBhY2l0eSh0ZXh0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0Y2hNb2RlbChwcm92LmlkLCBpLCB7IG1heFRva2VuczogbiB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICAgICAgKX1cclxuICAgICAgICAgICAgICAgIDwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17Y3NzLmhpbnR9Pnt0KFwiZWZmZWN0aXZlXCIsIHsgd2luZG93OiBmb3JtYXRDb3VudChtb2RlbC5jb250ZXh0V2luZG93KSwgbWF4OiBmb3JtYXRDb3VudChtb2RlbC5tYXhUb2tlbnMpIH0pfTwvc3Bhbj5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgIH0pfVxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICApKX1cclxuICAgICAgPGRpdiBzdHlsZT17Y3NzLmFjdGlvbnN9PlxyXG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIHN0eWxlPXtzYXZpbmcgPyB7IC4uLmNzcy5idXR0b24sIC4uLmNzcy5idXR0b25EaXNhYmxlZCB9IDogY3NzLmJ1dHRvbn0gZGlzYWJsZWQ9e3NhdmluZ30gb25DbGljaz17c2F2ZX0+XHJcbiAgICAgICAgICB7c2F2aW5nID8gdChcInNhdmluZ1wiKSA6IHQoXCJzYXZlXCIpfVxyXG4gICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIHN0eWxlPXt7IC4uLmNzcy5idXR0b24sIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIiwgY29sb3I6IFwidmFyKC0tZHN3LWFsaWFzLWxhYmVsLXNlY29uZGFyeSwgIzRiNTU2MylcIiwgYm9yZGVyOiBcIjFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwyLCAjZDFkNWRiKVwiIH19IG9uQ2xpY2s9e2xvYWR9PlxyXG4gICAgICAgICAge3QoXCJyZWxvYWRcIil9XHJcbiAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAge3NhdmVkICYmIDxzcGFuIHN0eWxlPXtjc3Muc3RhdHVzfT57dChcInNhdmVkXCIpfTwvc3Bhbj59XHJcbiAgICAgICAge3NhdmVFcnJvciAmJiA8c3BhbiBzdHlsZT17Y3NzLmVycm9yfT57c2F2ZUVycm9yfTwvc3Bhbj59XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICA8cCBzdHlsZT17Y3NzLmhpbnR9Pnt0KFwiZm9vdG5vdGVcIil9PC9wPlxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufVxyXG5cclxuLy8gXHU4OUUzXHU2NzkwIDEyOEsgLyAxTSAvIDEzMTA3MiBcdTRFNEJcdTdDN0JcdTc2ODRcdTgwRkRcdTUyOUJcdTUxOTlcdTZDRDVcdUZGMDhcdTRFMEVcdTVCOThcdTY1QjlcdTk4NzVcdTk3NjJcdTU0MENcdThCQ0RcdTg4NjhcdUZGMDlcclxuZnVuY3Rpb24gcGFyc2VDYXBhY2l0eSh0ZXh0KSB7XHJcbiAgY29uc3QgcyA9IFN0cmluZyh0ZXh0ID8/IFwiXCIpLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xyXG4gIGlmIChzID09PSBcIlwiKSByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIGNvbnN0IG0gPSBzLm1hdGNoKC9eKFxcZCsoPzpcXC5cXGQrKT8pKFtrbV0pPyQvKTtcclxuICBpZiAoIW0pIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgY29uc3QgbiA9IHBhcnNlRmxvYXQobVsxXSk7XHJcbiAgaWYgKCFOdW1iZXIuaXNGaW5pdGUobikgfHwgbiA8PSAwKSByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIGNvbnN0IG11bHQgPSBtWzJdID09PSBcImtcIiA/IDEwMDAgOiBtWzJdID09PSBcIm1cIiA/IDEwMDAwMDAgOiAxO1xyXG4gIHJldHVybiBNYXRoLnJvdW5kKG4gKiBtdWx0KTtcclxufVxyXG5cclxuLy8gXHUyNTAwXHUyNTAwIFx1NjNEMlx1NEVGNlx1NTE2NVx1NTNFMyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuY29uc3QgaW5qZWN0ID0gW1wic2xvdHNcIiwgXCJsb2NhbGVcIiwgXCJjb25uZWN0aW9uXCJdO1xyXG5cclxuZnVuY3Rpb24gYXBwbHkoY3R4KSB7XHJcbiAgY29uc3QgTlNfRElDVCA9IHtcclxuICAgIHpoOiB7XHJcbiAgICAgIG5hdjogXCJcdTZBMjFcdTU3OEJcdTU4OUVcdTVGM0FcIixcclxuICAgICAgaGVyb01ldGE6IFwiXHU1NkZFXHU3MjQ3XHU4RjkzXHU1MTY1XHU0RTBFXHU2QTIxXHU1NzhCXHU4MEZEXHU1MjlCXHU1M0MyXHU2NTcwXCIsXHJcbiAgICAgIGxlYWQ6IFwiXHU1NzI4XHU2QjY0XHU0RTNBXHU4MUVBXHU1QjlBXHU0RTQ5XHU2QTIxXHU1NzhCXHU5MTREXHU3RjZFXHUzMDBDXHU1NkZFXHU3MjQ3XHU4RjkzXHU1MTY1XHUzMDBEXHU0RTBFXHU0RTBBXHU0RTBCXHU2NTg3XHU3QTk3XHU1M0UzL1x1NjcwMFx1NTkyN1x1OEY5M1x1NTFGQVx1NzY4NFx1NUZFQlx1NjM3N1x1OTAwOVx1OTg3OVx1MzAwMlx1NjI0MFx1NjcwOVx1NEZFRVx1NjUzOVx1NTE5OVx1NTE2NSBsbG0tcGktYWkgXHU5MTREXHU3RjZFXHVGRjBDXHU0RTBFXHU1Qjk4XHU2NUI5XHUzMDBDXHU2QTIxXHU1NzhCXHUzMDBEXHU5ODc1XHU1MTcxXHU3NTI4XHU1NDBDXHU0RTAwXHU0RUZEXHU5MTREXHU3RjZFXHUzMDAyXCIsXHJcbiAgICAgIGltYWdlOiBcIlx1NTZGRVx1NzI0N1x1OEY5M1x1NTE2NVwiLFxyXG4gICAgICBpbWFnZVRpdGxlOiBcIlx1NTE0MVx1OEJCOFx1OEJFNVx1NkEyMVx1NTc4Qlx1NjNBNVx1NjUzNlx1NTZGRVx1NzI0N1x1OTY0NFx1NEVGNlx1RkYwOFx1NTE5OVx1NTE2NSBpbnB1dDogW3RleHQsIGltYWdlXVx1RkYwOVwiLFxyXG4gICAgICB2aXNpb25Sb3V0ZTogXCJcdTg5QzZcdTg5QzlcdTY4NjVcdTZBMjFcdTU3OEJcdTUyMTdcdTg4NjhcIixcclxuICAgICAgdmlzaW9uUm91dGVUaXRsZTogXCJcdTVGMDBcdTU0MkZcdTU0MEVcdTk2OTBcdTg1Q0ZcdTVCRjlcdTVFOTRcdTc2ODRcdTUzOUZcdTU5Q0JcdTdFQUZcdTY1ODdcdTY3MkNcdTZBMjFcdTU3OEJcdUZGMENcdTRFQzVcdTRGRERcdTc1NTlcdTVFMjYgKE1vZExlbnMpIFx1NzY4NFx1ODlDNlx1ODlDOVx1Njg2NVx1NkEyMVx1NTc4QlwiLFxyXG4gICAgICB2aXNpb25Sb3V0ZU9uOiBcIlx1NURGMlx1NUYwMFx1NTQyRlx1RkYxQVx1NEVDNVx1NjYzRVx1NzkzQVx1ODlDNlx1ODlDOVx1Njg2NVx1NkEyMVx1NTc4QlwiLFxyXG4gICAgICB2aXNpb25Sb3V0ZU9mZjogXCJcdTVERjJcdTUxNzNcdTk1RURcdUZGMUFcdTU0MENcdTY1RjZcdTY2M0VcdTc5M0FcdTUzOUZcdTU5Q0JcdTZBMjFcdTU3OEJcdTRFMEVcdTg5QzZcdTg5QzlcdTY4NjVcdTZBMjFcdTU3OEJcIixcclxuICAgICAgY29udGV4dFdpbmRvdzogXCJcdTRFMEFcdTRFMEJcdTY1ODdcdTdBOTdcdTUzRTNcIixcclxuICAgICAgbWF4VG9rZW5zOiBcIlx1NjcwMFx1NTkyN1x1OEY5M1x1NTFGQVwiLFxyXG4gICAgICB1bnNldDogXCJcdTRFMERcdTU4NkJcdUZGMDhcdTlFRDhcdThCQTRcdUZGMDlcIixcclxuICAgICAgY3VzdG9tUGxhY2Vob2xkZXI6IFwiXHU1OTgyIDEzMTA3MlwiLFxyXG4gICAgICBlZmZlY3RpdmU6IFwiXHU3NTFGXHU2NTQ4XHU1MDNDXHVGRjFBXHU3QTk3XHU1M0UzIHt3aW5kb3d9IC8gXHU4RjkzXHU1MUZBIHttYXh9XCIsXHJcbiAgICAgIHNhdmU6IFwiXHU0RkREXHU1QjU4XHU0RkVFXHU2NTM5XCIsXHJcbiAgICAgIHNhdmluZzogXCJcdTRGRERcdTVCNThcdTRFMkRcdTIwMjZcIixcclxuICAgICAgc2F2ZWQ6IFwiXHU1REYyXHU0RkREXHU1QjU4IFx1MjcxM1wiLFxyXG4gICAgICByZWxvYWQ6IFwiXHU5MUNEXHU2NUIwXHU1MkEwXHU4RjdEXCIsXHJcbiAgICAgIGxvYWRpbmc6IFwiXHU1MkEwXHU4RjdEXHU0RTJEXHUyMDI2XCIsXHJcbiAgICAgIHJldHJ5OiBcIlx1OTFDRFx1OEJENVwiLFxyXG4gICAgICBsb2FkRmFpbGVkOiBcIlx1NTJBMFx1OEY3RFx1NTkzMVx1OEQyNVwiLFxyXG4gICAgICBub1BpQWk6IFwiXHU2NzJBXHU2MjdFXHU1MjMwIGxsbS1waS1haSBcdTkxNERcdTdGNkVcdTMwMDJcdThCRjdcdTUxNDhcdTU3MjhcdTVCOThcdTY1QjlcdTMwMENcdTZBMjFcdTU3OEJcdTMwMERcdTk4NzVcdTZERkJcdTUyQTBcdTgxRUFcdTVCOUFcdTRFNDlcdTYzRDBcdTRGOUJcdTU1NDZcdTMwMDJcIixcclxuICAgICAgbm9Nb2RlbHM6IFwiXHU4QkU1XHU2M0QwXHU0RjlCXHU1NTQ2XHU2Q0ExXHU2NzA5XHU4MUVBXHU1QjlBXHU0RTQ5XHU2QTIxXHU1NzhCXHUzMDAyXCIsXHJcbiAgICAgIGZvb3Rub3RlOiBcIlx1NjNEMFx1NzkzQVx1RkYxQVx1NjcyQVx1NTJGRVx1OTAwOVx1NEUzQVx1N0VBRlx1NjU4N1x1NjcyQ1x1RkYwOHRleHRcdUZGMDlcdUZGMUJcdTUyRkVcdTkwMDlcdTU0MEVcdTRFM0FcdTY1ODdcdTY3MkMrXHU1NkZFXHU3MjQ3XHVGRjA4dGV4dCwgaW1hZ2VcdUZGMDlcdTMwMDJcdThCRjdcdTUzRUFcdTVCRjlcdTRFMEFcdTZFMzhcdTVCOUVcdTk2NDVcdTY1MkZcdTYzMDFcdTU2RkVcdTcyNDdcdTc2ODRcdTZBMjFcdTU3OEJcdTUyRkVcdTkwMDlcdTMwMDJcdTRFMEFcdTRFMEJcdTY1ODdcdTdBOTdcdTUzRTNcdThCRjdcdTUyRkZcdThEODVcdThGQzdcdTRFMEFcdTZFMzhcdTc3MUZcdTVCOUVcdTk2NTBcdTUyMzZcdTMwMDJcIlxyXG4gICAgfSxcclxuICAgIGVuOiB7XHJcbiAgICAgIG5hdjogXCJNb2RlbCBFbmhhbmNlXCIsXHJcbiAgICAgIGhlcm9NZXRhOiBcIkltYWdlIGlucHV0IGFuZCBtb2RlbCBjYXBhYmlsaXR5IHNldHRpbmdzXCIsXHJcbiAgICAgIGxlYWQ6IFwiQ29uZmlndXJlIGltYWdlIGlucHV0IGFuZCBxdWljayBjb250ZXh0LXdpbmRvdyAvIG1heC1vdXRwdXQgcHJlc2V0cyBmb3IgY3VzdG9tIG1vZGVscy4gQ2hhbmdlcyBhcmUgd3JpdHRlbiB0byB0aGUgbGxtLXBpLWFpIHNldHRpbmdzIHNoYXJlZCB3aXRoIHRoZSBvZmZpY2lhbCBNb2RlbHMgcGFnZS5cIixcclxuICAgICAgaW1hZ2U6IFwiSW1hZ2UgaW5wdXRcIixcclxuICAgICAgaW1hZ2VUaXRsZTogXCJBbGxvdyB0aGlzIG1vZGVsIHRvIHJlY2VpdmUgaW1hZ2UgYXR0YWNobWVudHMgKHdyaXRlcyBpbnB1dDogW3RleHQsIGltYWdlXSlcIixcclxuICAgICAgdmlzaW9uUm91dGU6IFwiVmlzaW9uIGJyaWRnZSBtb2RlbCBsaXN0XCIsXHJcbiAgICAgIHZpc2lvblJvdXRlVGl0bGU6IFwiSGlkZSB0aGUgb3JpZ2luYWwgdGV4dC1vbmx5IG1vZGVsIGFuZCBrZWVwIG9ubHkgaXRzIChNb2RMZW5zKSBicmlkZ2UgbW9kZWxcIixcclxuICAgICAgdmlzaW9uUm91dGVPbjogXCJPbjogc2hvdyBicmlkZ2UgbW9kZWxzIG9ubHlcIixcclxuICAgICAgdmlzaW9uUm91dGVPZmY6IFwiT2ZmOiBzaG93IGJvdGggb3JpZ2luYWwgYW5kIGJyaWRnZSBtb2RlbHNcIixcclxuICAgICAgY29udGV4dFdpbmRvdzogXCJDb250ZXh0IHdpbmRvd1wiLFxyXG4gICAgICBtYXhUb2tlbnM6IFwiTWF4IG91dHB1dFwiLFxyXG4gICAgICB1bnNldDogXCJVbnNldCAoZGVmYXVsdClcIixcclxuICAgICAgY3VzdG9tUGxhY2Vob2xkZXI6IFwiZS5nLiAxMzEwNzJcIixcclxuICAgICAgZWZmZWN0aXZlOiBcIkVmZmVjdGl2ZTogd2luZG93IHt3aW5kb3d9IC8gb3V0cHV0IHttYXh9XCIsXHJcbiAgICAgIHNhdmU6IFwiU2F2ZSBjaGFuZ2VzXCIsXHJcbiAgICAgIHNhdmluZzogXCJTYXZpbmdcdTIwMjZcIixcclxuICAgICAgc2F2ZWQ6IFwiU2F2ZWQgXHUyNzEzXCIsXHJcbiAgICAgIHJlbG9hZDogXCJSZWxvYWRcIixcclxuICAgICAgbG9hZGluZzogXCJMb2FkaW5nXHUyMDI2XCIsXHJcbiAgICAgIHJldHJ5OiBcIlJldHJ5XCIsXHJcbiAgICAgIGxvYWRGYWlsZWQ6IFwiTG9hZCBmYWlsZWRcIixcclxuICAgICAgbm9QaUFpOiBcIk5vIGxsbS1waS1haSBjb25maWd1cmF0aW9uIGZvdW5kLiBBZGQgYSBjdXN0b20gcHJvdmlkZXIgb24gdGhlIG9mZmljaWFsIE1vZGVscyBwYWdlIGZpcnN0LlwiLFxyXG4gICAgICBub01vZGVsczogXCJUaGlzIHByb3ZpZGVyIGhhcyBubyBjdXN0b20gbW9kZWxzLlwiLFxyXG4gICAgICBmb290bm90ZTogXCJVbmNoZWNrZWQgbWVhbnMgdGV4dC1vbmx5OyBjaGVja2VkIG1lYW5zIHRleHQgcGx1cyBpbWFnZS4gRW5hYmxlIGl0IG9ubHkgZm9yIG1vZGVscyB3aG9zZSB1cHN0cmVhbSBhY3R1YWxseSBzdXBwb3J0cyBpbWFnZSBpbnB1dC4gS2VlcCB0aGUgY29udGV4dCB3aW5kb3cgd2l0aGluIHRoZSB1cHN0cmVhbSBsaW1pdC5cIlxyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8vIFx1NEUwRFx1NTE4RFx1NTMwNVx1ODhDNSBzZXNzaW9ucy5zZWxlY3RNb2RlbFx1RkYxQVx1NTIwN1x1NjM2Mlx1NkEyMVx1NTc4Qlx1NEUwRFx1NUU5NFx1NjUzOVx1NTE5OVx1NEYxQVx1OEJERFx1NEUyRFx1NzY4NFx1NTZGRVx1NzI0N1x1NTM4Nlx1NTNGMlx1MzAwMlxyXG4gIC8vIFx1N0VBRlx1NjU4N1x1NjcyQ1x1NkEyMVx1NTc4Qlx1NzY4NFx1NTZGRVx1NzI0N1x1NjMwOVx1ODBGRFx1NTI5Qlx1NTIwNlx1NkQ0MVx1NzUzMSBkc2gtbW9kbGVucy1ndWFyZCBcdTU3MjhcdTUzRDFcdTkwMDFcdTY1RjZcdTU5MDRcdTc0MDZcdTMwMDJcclxuICBjb25zdCBjb25uZWN0aW9uID0gY3R4LmdldChcImNvbm5lY3Rpb25cIik7XHJcbiAgY3R4LmVmZmVjdCgoKSA9PiBjdHgubG9jYWxlLnJlZ2lzdGVyKE5TLCBOU19ESUNUKSwgXCJtb2RlbC1lbmhhbmNlcjogY29weSBkaWN0aW9uYXJpZXNcIik7XHJcbiAgY29uc3QgdCA9IGN0eC5sb2NhbGUuYmluZChOUyk7XHJcbiAgY29uc3QgaW5qZWN0ZWQgPSAoKSA9PiAoeyBhcGk6IGNvbm5lY3Rpb24uYXBpLCB0IH0pO1xyXG4gIGN0eC5zbG90cy5pbmplY3QoXCJzZXR0aW5ncy5zZWN0aW9uXCIsICgpID0+XHJcbiAgICBjdHguc2xvdHMucmVnaXN0ZXIoXHJcbiAgICAgIHtcclxuICAgICAgICBuYW1lOiBcInNldHRpbmdzLnNlY3Rpb25cIixcclxuICAgICAgICBpZDogXCJtb2RlbC1lbmhhbmNlclwiLFxyXG4gICAgICAgIG9yZGVyOiAxMSxcclxuICAgICAgICBsYWJlbDogKCkgPT4gdChcIm5hdlwiKSxcclxuICAgICAgICBpbmplY3Q6IGluamVjdGVkXHJcbiAgICAgIH0sXHJcbiAgICAgIE1vZGVsRW5oYW5jZXJTZWN0aW9uXHJcbiAgICApXHJcbiAgKTtcclxufVxyXG5cclxuZXhwb3J0IHsgYXBwbHksIGluamVjdCB9O1xyXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBS0EsbUJBQWlEO0FBOER4QztBQTVEVCxJQUFNLEtBQUs7QUFDWCxJQUFNLFNBQVM7QUFHZixJQUFNLGlCQUFpQjtBQUFBLEVBQ3JCLEVBQUUsT0FBTyxRQUFRLE9BQU8sT0FBTztBQUFBLEVBQy9CLEVBQUUsT0FBTyxRQUFRLE9BQU8sT0FBTztBQUFBLEVBQy9CLEVBQUUsT0FBTyxRQUFRLE9BQU8sT0FBTztBQUFBLEVBQy9CLEVBQUUsT0FBTyxNQUFNLE9BQU8sUUFBUTtBQUFBLEVBQzlCLEVBQUUsT0FBTyxNQUFNLE9BQU8sUUFBUTtBQUFBLEVBQzlCLEVBQUUsT0FBTyxNQUFNLE9BQU8sUUFBUTtBQUFBLEVBQzlCLEVBQUUsT0FBTyw0QkFBUSxPQUFPLFNBQVM7QUFDbkM7QUFFQSxJQUFNLG9CQUFvQjtBQUFBLEVBQ3hCLEVBQUUsT0FBTyx3Q0FBVSxPQUFPLEdBQUc7QUFBQSxFQUM3QixFQUFFLE9BQU8sT0FBTyxPQUFPLE1BQU07QUFBQSxFQUM3QixFQUFFLE9BQU8sT0FBTyxPQUFPLE1BQU07QUFBQSxFQUM3QixFQUFFLE9B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

		return module.exports;
	}
});
//# sourceMappingURL=client.js.map
