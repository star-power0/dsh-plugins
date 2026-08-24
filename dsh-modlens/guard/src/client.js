// dsh-modlens-guard —— client 端（浏览器）
// 在设置页注册「视觉状态」section：显示纯文本模型的图片识别链路是否可用。
// 纯文本模型收到图片时由 ModLens 在发送前转写；原生多模态模型不受影响。
import { useState, useEffect, useCallback } from "react";

const NS = "settings.modlens-guard";

const TONE = {
  ready: { fg: "#0f7b3f", bg: "rgba(16,163,74,0.12)", border: "rgba(16,163,74,0.35)" },
  unconfigured: { fg: "#8a5300", bg: "rgba(217,119,6,0.12)", border: "rgba(217,119,6,0.35)" },
  failing: { fg: "#b3261e", bg: "rgba(220,38,38,0.12)", border: "rgba(220,38,38,0.35)" },
  off: { fg: "#5b6270", bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.35)" }
};

const css = {
  section: { maxWidth: 760, color: "var(--dsw-alias-label-primary, #1f2329)", fontFamily: "inherit" },
  hero: { display: "flex", alignItems: "center", gap: 14, marginBottom: 12 },
  heroIcon: { flex: "none", color: "var(--dsw-alias-label-tertiary, #6b7280)" },
  heroTitle: { fontSize: 20, fontWeight: 650, letterSpacing: 0.2 },
  heroMeta: { fontSize: 14, color: "var(--dsw-alias-label-tertiary, #6b7280)" },
  lead: { fontSize: 15, lineHeight: 1.7, color: "var(--dsw-alias-label-tertiary, #6b7280)", margin: "0 0 18px" },
  card: {
    border: "1px solid var(--dsw-alias-border-strong, #e5e7eb)",
    borderRadius: 10,
    padding: 18,
    marginBottom: 16,
    display: "flex",
    flexDirection: "column",
    gap: 14
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
  grid: { display: "grid", gridTemplateColumns: "minmax(110px, 180px) 1fr", gap: "10px 18px", fontSize: 15 },
  key: { color: "var(--dsw-alias-label-tertiary, #6b7280)" },
  val: { wordBreak: "break-word" },
  err: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 14 },
  btn: {
    padding: "8px 16px",
    fontSize: 15,
    borderRadius: 8,
    cursor: "pointer",
    border: "1px solid var(--dsw-alias-border-strong, #e5e7eb)",
    background: "transparent",
    color: "inherit"
  },
  foot: { fontSize: 14, lineHeight: 1.7, color: "var(--dsw-alias-label-tertiary, #6b7280)" }
};

function HeroIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m4 7.5 8 4.5 8-4.5M12 12v9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function stamp(value, never) {
  if (!value) return never;
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function ModlensGuardSection({ t }) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [probing, setProbing] = useState(false);

  const load = useCallback(async () => {
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

  const probe = useCallback(async () => {
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

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15000);
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

  return (
    <div style={css.section}>
      <div style={css.hero}>
        <span style={css.heroIcon}>
          <HeroIcon />
        </span>
        <div>
          <div style={css.heroTitle}>{t("nav")}</div>
          <div style={css.heroMeta}>{t("heroMeta")}</div>
        </div>
      </div>
      <p style={css.lead}>{t("lead")}</p>

      <div style={css.card}>
        <div style={css.row}>
          <span style={{ ...css.badge, color: tone.fg, background: tone.bg, borderColor: tone.border }}>
            <span style={css.dot} />
            {stateLabel}
          </span>
          <button type="button" style={css.btn} onClick={() => void probe()} disabled={loading || probing}>
            {probing ? t("probing") : t("refresh")}
          </button>
        </div>

        <div style={css.hint}>{stateHint}</div>
        {error !== "" && <div style={{ ...css.hint, color: TONE.failing.fg }}>{`${t("loadFailed")}: ${error}`}</div>}

        {status !== null && (
          <div style={css.grid}>
            <div style={css.key}>{t("bridge")}</div>
            <div style={css.val}>{status.pluginLoaded ? t("bridgeOn") : t("bridgeOff")}</div>

            <div style={css.key}>{t("engines")}</div>
            <div style={css.val}>{status.engines?.length > 0 ? status.engines.join(", ") : t("none")}</div>

            <div style={css.key}>{t("pinned")}</div>
            <div style={css.val}>{status.pinned || t("pinnedAuto")}</div>

            <div style={css.key}>{t("visionModels")}</div>
            <div style={css.val}>{status.visionProviders?.length > 0 ? status.visionProviders.join(", ") : t("none")}</div>

            <div style={css.key}>{t("lastProbe")}</div>
            <div style={css.val}>{status.probeAt ? stamp(status.probeAt, t("never")) : t("never")}</div>

            <div style={css.key}>{t("probeResult")}</div>
            <div style={css.val}>{status.probeOk === null ? t("never") : status.probeOk ? t("probeOk") : t("probeFailed")}</div>

            <div style={css.key}>{t("probeEngine")}</div>
            <div style={css.val}>{status.probeProvider || t("none")}</div>

            <div style={css.key}>{t("probeModel")}</div>
            <div style={css.val}>{status.probeModel || t("none")}</div>

            <div style={css.key}>{t("probeDuration")}</div>
            <div style={css.val}>{typeof status.probeDurationMs === "number" ? t("probeDurationValue").replace("{ms}", String(status.probeDurationMs)) : t("never")}</div>

            <div style={css.key}>{t("lastOk")}</div>
            <div style={css.val}>{stamp(status.lastOkAt, t("never"))}</div>

            <div style={css.key}>{t("lastFail")}</div>
            <div style={css.val}>{stamp(status.lastFailAt, t("never"))}</div>

            {status.lastError && (
              <>
                <div style={css.key}>{t("lastError")}</div>
                <div style={{ ...css.val, ...css.err }}>{status.lastError}</div>
              </>
            )}

            <div style={css.key}>{t("counters")}</div>
            <div style={css.val}>
              {t("countersValue")
                .replace("{reads}", String(status.reads ?? 0))
                .replace("{failures}", String(status.failures ?? 0))
                .replace("{blocks}", String(status.blocks ?? 0))}
            </div>
          </div>
        )}

        <div style={css.foot}>{t("configHint")}</div>
      </div>
    </div>
  );
}

function ModlensTurnStatus({ matched, sessionId }) {
  const [status, setStatus] = useState(null);
  const turn = matched;

  useEffect(() => {
    if (!turn || !Number.isInteger(turn.turn)) return undefined;
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
      } catch {}
    };
    void load();
    timer = window.setInterval(() => void load(), 500);
    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [turn, sessionId]);

  if (!status || (status.state !== "ready" && status.state !== "failed")) return null;

  const failed = status.state === "failed";
  return (
    <div
      style={{
        color: failed ? TONE.failing.fg : "var(--dsw-alias-label-tertiary, #6b7280)",
        fontSize: 13,
        lineHeight: 1.5,
        margin: "6px 0 0 2px"
      }}
    >
      {failed ? "ModLens · 图片读取失败" : "ModLens · 已读取图片"}
    </div>
  );
}

function ModlensTurnTail({ matched, sessionId }) {
  return <ModlensTurnStatus matched={matched} sessionId={sessionId} />;
}

// ── 插件入口 ────────────────────────────────────────────────────────────
const inject = ["slots", "locale"];

const NS_DICT = {  zh: {
    nav: "视觉状态",
    heroMeta: "纯文本模型的图片识别状态",
    lead: "纯文本模型收到图片时，由 ModLens 在发送前把图片转成文字证据；原生多模态模型不受影响。此页显示识别链路当前是否可用。",
    stateReady: "可用",
    stateUnconfigured: "未配置",
    stateFailing: "识别失败",
    stateOff: "未加载",
    readyHint: "纯文本模型发送图片时会自动识别；可随时执行探查确认当前引擎真实可用。",
    unconfiguredHint: "尚未配置视觉引擎。纯文本模型发送图片时不会被识别，模型会明确收到“图片未被读取”的提示，不会凭空猜测图片内容。",
    failingHint: "最近一次识别或探查失败。点击“探查”会真实调用当前视觉引擎；成功后立即恢复为可用。",
    offHint: "ModLens 未安装或未加载，图片无法被识别。",
    bridge: "识别桥",
    bridgeOn: "已加载",
    bridgeOff: "未加载",
    engines: "可用引擎",
    pinned: "已固定引擎",
    visionModels: "视觉桥模型",
    lastProbe: "最近探查",
    probeResult: "探查结果",
    probeOk: "可用",
    probeFailed: "不可用",
    probeEngine: "探查引擎",
    probeModel: "探查模型",
    probeDuration: "探查耗时",
    probeDurationValue: "{ms} ms",
    pinnedAuto: "自动（故障转移链）",
    none: "无",
    lastOk: "最近成功",
    lastFail: "最近失败",
    lastError: "最后错误",
    counters: "累计",
    countersValue: "成功 {reads} / 失败 {failures} / 未识别 {blocks}",
    never: "从未",
    refresh: "刷新状态并探查",
    probing: "探查中…",
    loading: "加载中…",
    loadFailed: "无法读取状态",
    configHint: "引擎配置在“设置 → 插件 → 视觉引擎（ModLens）”中修改。原生多模态模型始终使用自身能力，不经过此链路。"
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
    unconfiguredHint:
      "No vision engine is configured. Images sent to a text-only model are not read; the model is told explicitly that the image was not read and will not guess at its contents.",
    failingHint:
      "The latest image read or probe failed. Run a probe to call the current vision engine; a successful probe immediately restores Ready.",
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
    probing: "Probing…",
    loading: "Loading…",
    loadFailed: "Cannot read status",
    configHint:
      "Configure engines under Settings → Plugins → Vision engine (ModLens). Native multimodal models always use their own capability and never pass through this bridge."
  }
};

function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, NS_DICT), "modlens-guard: copy dictionaries");
  const t = ctx.locale.bind(NS);
  const injected = () => ({ t });
  ctx.slots.inject("conversation.chat.turnTail", () =>
    ctx.slots.register(
      {
        name: "conversation.chat.turnTail",
        select: (owner) => owner?.turn ?? null,
        locale: NS
      },
      ModlensTurnTail
    )
  );
  ctx.slots.inject("settings.section", () =>
    ctx.slots.register(
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

export { apply, inject, NS, ModlensGuardSection };
