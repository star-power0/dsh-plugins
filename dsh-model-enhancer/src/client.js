// dsh-model-enhancer —— client 端（浏览器）
// 在设置页注册「模型增强」section：
//   - 每个自定义模型提供「图片输入」勾选（写 llm-pi-ai 的 input 字段）
//   - 上下文窗口 / 最大输出的快捷下拉选择（128K/256K/1M…）
// 与官方「模型」页共用同一份 llm-pi-ai 配置，通过 settings API 读写。
import { useState, useEffect, useCallback } from "react";

const NS = "settings.model-enhancer";
const LLM_NS = "llm-pi-ai";

// ── 快捷选项 ────────────────────────────────────────────────────────────
const WINDOW_OPTIONS = [
  { label: "128K", value: 131072 },
  { label: "256K", value: 262144 },
  { label: "512K", value: 524288 },
  { label: "1M", value: 1048576 },
  { label: "2M", value: 2097152 },
  { label: "4M", value: 4194304 },
  { label: "自定义…", value: "custom" }
];

const MAXTOKENS_OPTIONS = [
  { label: "默认（不填）", value: "" },
  { label: "16K", value: 16384 },
  { label: "32K", value: 32768 },
  { label: "64K", value: 65536 },
  { label: "128K", value: 131072 },
  { label: "自定义…", value: "custom" }
];

function formatCount(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "";
  if (n >= 1048576) return `${(n / 1048576).toFixed(n % 1048576 === 0 ? 0 : 1)}M`;
  if (n >= 1024) return `${(n / 1024).toFixed(n % 1024 === 0 ? 0 : 1)}K`;
  return String(n);
}

function matchOption(options, value) {
  if (value === undefined || value === null) return { matched: false, custom: false, raw: "" };
  const hit = options.find((o) => typeof o.value === "number" && o.value === value);
  if (hit) return { matched: true, custom: false, raw: "" };
  return { matched: false, custom: true, raw: String(value) };
}

// ── 样式（内联，避免 CSS 模块构建）──────────────────────────────────────
const css = {
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
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 3 14 8l5 2-5 2-2 5-2-5-5-2 5-2 2-5Z" /><path d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" /></svg>;
}

// ── 主组件 ──────────────────────────────────────────────────────────────
function ModelEnhancerSection(props) {
  const { api, t } = props;
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState(null);
  const [providers, setProviders] = useState([]); // [{id, displayName, models}]
  const [revision, setRevision] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [customWindows, setCustomWindows] = useState({}); // `${pid}:${idx}` -> string
  const [customMax, setCustomMax] = useState({}); // `${pid}:${idx}` -> string
  const [visionOnly, setVisionOnly] = useState(false);
  const [visionOnlyBusy, setVisionOnlyBusy] = useState(false);

  const load = useCallback(async () => {
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
      if (view === undefined) {
        setProviders([]);
        setBaseline([]);
        setRevision(undefined);
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

  useEffect(() => {
    load();
  }, [load]);

  // 修改模型字段
  const patchModel = (pid, index, patch) => {
    setSaved(false);
    setSaveError(null);
    setProviders((list) =>
      list.map((p) => {
        if (p.id !== pid) return p;
        const models = p.models.map((m, i) => (i === index ? { ...m, ...patch } : m));
        return { ...p, models };
      })
    );
  };

  // 生成 ops：只发送变化过的字段
  // 注意：settings.mutate 的 applyPathOp 不支持数组下标路径（会把数组重建为对象），
  // 因此 models 数组必须整体 set 到 ["providers", id, "models"]（官方模型页同款做法）。
  const buildOps = useCallback(
    (baseline, draft) => {
      const ops = [];
      for (const prov of draft) {
        const baseProv = baseline.find((b) => b.id === prov.id);
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

  // 保存前的 baseline（最后一次加载的原始值）
  const [baseline, setBaseline] = useState([]);

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
        setSaveError(response.result.error.code === "settings-conflict" ? "配置已被其他页面修改，请重新加载后重试" : response.result.error.message);
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
    return <div style={css.status}>{t("loading")}</div>;
  }
  if (status === "error") {
    return (
      <div>
        <div style={css.error}>{t("loadFailed")}: {error}</div>
        <button type="button" style={css.button} onClick={load}>{t("retry")}</button>
      </div>
    );
  }

  const hasPiAi = providers.length > 0;

  return (
    <div style={css.section}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "4px 0 18px" }}><div style={{ width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: 14, background: "linear-gradient(135deg, #7c3aed, #db2777)", color: "white" }}><ModelGlyph size={25} /></div><div><h1 style={{ margin: 0, fontSize: 20, lineHeight: 1.2, fontWeight: 700 }}>{t("nav")}</h1><p style={{ margin: "5px 0 0", fontSize: 13, color: "var(--dsw-alias-label-tertiary, #6b7280)" }}>{t("heroMeta")}</p></div></div>
      <p style={css.lead}>{t("lead")}</p>
      <div style={css.card}>
        <div style={css.row}>
          <label style={css.field} title={t("visionRouteTitle")}>
            <input type="checkbox" style={css.checkbox} checked={visionOnly} disabled={visionOnlyBusy} onChange={(e) => void setVisionRoute(e.target.checked)} />
            {t("visionRoute")}
          </label>
          <span style={css.hint}>{visionOnly ? t("visionRouteOn") : t("visionRouteOff")}</span>
        </div>
      </div>
      {!hasPiAi && <div style={css.empty}>{t("noPiAi")}</div>}
      {providers.map((prov) => (
        <div key={prov.id} style={css.card}>
          <div style={css.cardHead}>
            <span>{prov.displayName}</span>
            <span style={css.hint}>{prov.id}</span>
          </div>
          {prov.models.length === 0 && <div style={css.empty}>{t("noModels")}</div>}
          {prov.models.map((model, i) => {
            const imageOn = Array.isArray(model.input) && model.input.includes("image");
            const key = `${prov.id}:${i}`;
            const win = matchOption(WINDOW_OPTIONS, model.contextWindow);
            const max = matchOption(MAXTOKENS_OPTIONS, model.maxTokens);
            const winSelectValue = win.custom ? "custom" : win.matched ? String(model.contextWindow) : "";
            const maxSelectValue = max.custom ? "custom" : model.maxTokens === undefined || model.maxTokens === null ? "" : String(model.maxTokens);
            return (
              <div key={model.id + i} style={i % 2 === 1 ? { ...css.row, ...css.rowAlt } : css.row}>
                <span style={css.modelId} title={model.id}>{model.id}</span>
                <label style={css.field} title={t("imageTitle")}>
                  <input
                    type="checkbox"
                    style={css.checkbox}
                    checked={imageOn}
                    onChange={(e) => {
                      const input = e.target.checked ? ["text", "image"] : ["text"];
                      patchModel(prov.id, i, { input });
                    }}
                  />
                  {t("image")}
                </label>
                <label style={css.field}>
                  {t("contextWindow")}
                  <select
                    style={css.select}
                    value={winSelectValue}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "custom") {
                        setCustomWindows((m) => ({ ...m, [key]: win.raw }));
                        patchModel(prov.id, i, { contextWindow: undefined });
                      } else if (v === "") {
                        setCustomWindows((m) => ({ ...m, [key]: "" }));
                        patchModel(prov.id, i, { contextWindow: undefined });
                      } else {
                        patchModel(prov.id, i, { contextWindow: Number(v) });
                      }
                    }}
                  >
                    <option value="">{t("unset")}</option>
                    {WINDOW_OPTIONS.map((o) => (
                      <option key={o.label} value={o.value === "custom" ? "custom" : String(o.value)}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {winSelectValue === "custom" && (
                    <input
                      style={css.input}
                      placeholder={t("customPlaceholder")}
                      value={customWindows[key] ?? win.raw}
                      onChange={(e) => {
                        const text = e.target.value;
                        setCustomWindows((m) => ({ ...m, [key]: text }));
                        const n = parseCapacity(text);
                        patchModel(prov.id, i, { contextWindow: n });
                      }}
                    />
                  )}
                </label>
                <label style={css.field}>
                  {t("maxTokens")}
                  <select
                    style={css.select}
                    value={maxSelectValue}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "custom") {
                        setCustomMax((m) => ({ ...m, [key]: max.raw }));
                        patchModel(prov.id, i, { maxTokens: undefined });
                      } else if (v === "") {
                        setCustomMax((m) => ({ ...m, [key]: "" }));
                        patchModel(prov.id, i, { maxTokens: undefined });
                      } else {
                        patchModel(prov.id, i, { maxTokens: Number(v) });
                      }
                    }}
                  >
                    {MAXTOKENS_OPTIONS.map((o) => (
                      <option key={o.label} value={o.value === "custom" ? "custom" : String(o.value)}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {maxSelectValue === "custom" && (
                    <input
                      style={css.input}
                      placeholder={t("customPlaceholder")}
                      value={customMax[key] ?? max.raw}
                      onChange={(e) => {
                        const text = e.target.value;
                        setCustomMax((m) => ({ ...m, [key]: text }));
                        const n = parseCapacity(text);
                        patchModel(prov.id, i, { maxTokens: n });
                      }}
                    />
                  )}
                </label>
                <span style={css.hint}>{t("effective", { window: formatCount(model.contextWindow), max: formatCount(model.maxTokens) })}</span>
              </div>
            );
          })}
        </div>
      ))}
      <div style={css.actions}>
        <button type="button" style={saving ? { ...css.button, ...css.buttonDisabled } : css.button} disabled={saving} onClick={save}>
          {saving ? t("saving") : t("save")}
        </button>
        <button type="button" style={{ ...css.button, background: "transparent", color: "var(--dsw-alias-label-secondary, #4b5563)", border: "1px solid var(--dsw-alias-border-strong, #d1d5db)" }} onClick={load}>
          {t("reload")}
        </button>
        {saved && <span style={css.status}>{t("saved")}</span>}
        {saveError && <span style={css.error}>{saveError}</span>}
      </div>
      <p style={css.hint}>{t("footnote")}</p>
    </div>
  );
}

// 解析 128K / 1M / 131072 之类的能力写法（与官方页面同词表）
function parseCapacity(text) {
  const s = String(text ?? "").trim().toLowerCase();
  if (s === "") return undefined;
  const m = s.match(/^(\d+(?:\.\d+)?)([km])?$/);
  if (!m) return undefined;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  const mult = m[2] === "k" ? 1000 : m[2] === "m" ? 1000000 : 1;
  return Math.round(n * mult);
}

// ── 插件入口 ────────────────────────────────────────────────────────────
const inject = ["slots", "locale", "connection"];

function apply(ctx) {
  const NS_DICT = {
    zh: {
      nav: "模型增强",
      heroMeta: "图片输入与模型能力参数",
      lead: "在此为自定义模型配置「图片输入」与上下文窗口/最大输出的快捷选项。所有修改写入 llm-pi-ai 配置，与官方「模型」页共用同一份配置。",
      image: "图片输入",
      imageTitle: "允许该模型接收图片附件（写入 input: [text, image]）",
      visionRoute: "视觉桥模型列表",
      visionRouteTitle: "开启后隐藏对应的原始纯文本模型，仅保留带 (ModLens) 的视觉桥模型",
      visionRouteOn: "已开启：仅显示视觉桥模型",
      visionRouteOff: "已关闭：同时显示原始模型与视觉桥模型",
      contextWindow: "上下文窗口",
      maxTokens: "最大输出",
      unset: "不填（默认）",
      customPlaceholder: "如 131072",
      effective: "生效值：窗口 {window} / 输出 {max}",
      save: "保存修改",
      saving: "保存中…",
      saved: "已保存 ✓",
      reload: "重新加载",
      loading: "加载中…",
      retry: "重试",
      loadFailed: "加载失败",
      noPiAi: "未找到 llm-pi-ai 配置。请先在官方「模型」页添加自定义提供商。",
      noModels: "该提供商没有自定义模型。",
      footnote: "提示：未勾选为纯文本（text）；勾选后为文本+图片（text, image）。请只对上游实际支持图片的模型勾选。上下文窗口请勿超过上游真实限制。"
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
      saving: "Saving…",
      saved: "Saved ✓",
      reload: "Reload",
      loading: "Loading…",
      retry: "Retry",
      loadFailed: "Load failed",
      noPiAi: "No llm-pi-ai configuration found. Add a custom provider on the official Models page first.",
      noModels: "This provider has no custom models.",
      footnote: "Unchecked means text-only; checked means text plus image. Enable it only for models whose upstream actually supports image input. Keep the context window within the upstream limit."
    }
  };

  // 不再包装 sessions.selectModel：切换模型不应改写会话中的图片历史。
  // 纯文本模型的图片按能力分流由 dsh-modlens-guard 在发送时处理。
  const connection = ctx.get("connection");
  ctx.effect(() => ctx.locale.register(NS, NS_DICT), "model-enhancer: copy dictionaries");
  const t = ctx.locale.bind(NS);
  const injected = () => ({ api: connection.api, t });
  ctx.slots.inject("settings.section", () =>
    ctx.slots.register(
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

export { apply, inject };
