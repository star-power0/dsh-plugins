// dsh-reasoning-slider —— host 半区（node）
// 自动给 llm-pi-ai 下所有自定义网关模型注入 5 档思考强度（reasoningEfforts）。
// 规则：凡未显式声明 reasoningEfforts 的模型，一律补默认 5 档：
//   off / low / medium / high / max
// 已声明（含 false，即明确关闭）的模型不覆盖。监听 settings/updated，
// 以后在官方模型页新增的模型也会自动带上思考强度，无需手动配置。
// 网关兼容：凡未显式声明 compat.supportsDeveloperRole 的模型，一律补 false，
// 让系统提示走最通用的 system role。OpenAI 推理模型的 developer role 写法
// 会让部分严格中转网关返回 400（如 nova），system 则几乎所有网关可接受。
//
// 2026-08-22 补充（nova 400 修复）：官方 dsh-llm-pi-ai 的 compatProfile schema
// 只透传 thinkingFormat / supportsReasoningEffort，settings 里的
// supportsDeveloperRole 在模型 materialize 时被丢弃，从未到达 pi-ai——
// 对配置了 reasoningEfforts 的推理模型，pi-ai 回落自动检测为
// supportsDeveloperRole=true，system 提示以 role:"developer" 发送，
// 严格网关（如 nova）返回 400。此处新增 llm/stream waterfall 拦截：
// 对声明 supportsDeveloperRole:false 的模型，把 system 提示并入首条 user
// 消息并短路重放，使 pi-ai 不再生成 developer/system 首条，端点必然接受。
import { settingsNamespace } from "@deepseek-ai/dsh-settings";

const name = "reasoning-slider";
const inject = ["settings", "llm"];

const NS = settingsNamespace("llm-pi-ai");

// 默认 5 档：键 = pi-ai ThinkingLevel，值 = wire 拼写。
// openai-completions / openai-responses 的 reasoning_effort 标准写法；
// off 留空 = 不发送该参数。不同网关若要求不同拼写，values 可在此调整。
const DEFAULT_EFFORTS = {
  off: null,
  low: "low",
  medium: "medium",
  high: "high",
  max: "max"
};

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** 深读路径上的值（只读，不创建）。 */
function atPath(source, path) {
  let current = source;
  for (const key of path) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }
  return current;
}

/** 构造补缺 ops（settings.mutate 的 applyPathOp 不支持数组下标，models 整体 set）：
 *  1. 未声明 reasoningEfforts 的模型补默认 5 档（已声明含 false 不覆盖）；
 *  2. 未显式声明 compat.supportsDeveloperRole 的模型补 false（system role 最通用）。 */
function buildOps(current) {
  const ops = [];
  const providers = isRecord(current) ? atPath(current, ["providers"]) : undefined;
  if (!isRecord(providers)) return ops;
  for (const [routeId, profile] of Object.entries(providers)) {
    if (!isRecord(profile)) continue;
    if (!Array.isArray(profile.models)) continue;
    let changed = false;
    const nextModels = profile.models.map((entry) => {
      if (!isRecord(entry)) return entry;
      let next = entry;
      // 未声明思考强度 → 补默认 5 档（已声明含 false 关闭不覆盖）
      if (next.reasoningEfforts === undefined) {
        next = { ...next, reasoningEfforts: { ...DEFAULT_EFFORTS } };
        changed = true;
      }
      // 网关兼容：未显式声明 developer role 支持 → 统一补 false。
      // 仅当 compat 缺失或是对象时补写；显式非对象值（如 false）不碰。
      if (next.compat === undefined || isRecord(next.compat)) {
        const compat = next.compat ?? {};
        if (compat.supportsDeveloperRole === undefined) {
          next = { ...next, compat: { ...compat, supportsDeveloperRole: false } };
          changed = true;
        }
      }
      return next;
    });
    if (!changed) continue;
    ops.push({
      op: "set",
      path: ["providers", routeId, "models"],
      value: nextModels
    });
  }
  return ops;
}

async function sync(ctx) {
  let current;
  try {
    current = ctx.settings.get(NS);
  } catch (error) {
    ctx.logger?.warn?.("[reasoning-slider] could not read llm-pi-ai settings");
    ctx.logger?.warn?.(error);
    return;
  }
  if (current === undefined) return;
  const ops = buildOps(current);
  if (ops.length === 0) return;
  try {
    await ctx.settings.mutate(NS, ops);
    ctx.logger?.info?.("[reasoning-slider] injected default 5-step reasoningEfforts + system-role compat into %d provider(s)", ops.length);
  } catch (error) {
    // settings-conflict：另一处同时写入，触发一次重同步即可
    ctx.logger?.warn?.("[reasoning-slider] could not write llm-pi-ai settings");
    ctx.logger?.warn?.(error);
  }
}

/** 剥离 modlens- 包装前缀，得到 settings 里的上游 provider 键。 */
function upstreamProvider(provider) {
  return String(provider ?? "").replace(/^modlens-/, "");
}

/** settings 里该 provider/model 是否显式声明了 supportsDeveloperRole: false。 */
function declaresSystemRole(settingsValue, provider, model) {
  const providers = isRecord(settingsValue) ? atPath(settingsValue, ["providers"]) : undefined;
  if (!isRecord(providers)) return false;
  const profile = providers[provider];
  if (!isRecord(profile) || !Array.isArray(profile.models)) return false;
  return profile.models.some((entry) => isRecord(entry) && entry.id === model
    && isRecord(entry.compat) && entry.compat.supportsDeveloperRole === false);
}

/**
 * llm/stream waterfall 拦截：对声明 supportsDeveloperRole:false 的模型，
 * 把 options.system 并入首条 user 消息并短路重放，使 pi-ai 不会以
 * developer/system role 生成首条消息（request 对象被 dsh-agent-loop
 * deepFreeze，无法原地修改，只能克隆后短路 this.stream 重新派发）。
 * patched.system === undefined，二次进入本监听器时直接 next()，无循环。
 */
function installStreamCompat(ctx, getSettings) {
  if (typeof ctx?.on !== "function" || typeof ctx?.llm?.stream !== "function") return;
  ctx.on("llm/stream", function (options, next) {
    if (!isRecord(options) || options.system === undefined) return next();
    const base = upstreamProvider(options.provider);
    if (!declaresSystemRole(getSettings(), base, String(options.model ?? ""))) return next();
    const systemContent = typeof options.system === "string"
      ? [{ type: "text", text: options.system }]
      : options.system;
    const patched = {
      ...options,
      system: undefined,
      messages: [{ role: "user", content: systemContent }, ...(options.messages ?? [])]
    };
    return this.stream(patched);
  }, { prepend: true });
}

function apply(ctx) {
  const run = () => {
    void sync(ctx);
  };
  // 让 llm-pi-ai 先完成 settings 命名空间注册
  setTimeout(run, 0);
  ctx.on("settings/updated", (ns) => {
    if (ns === NS) run();
  });
  installStreamCompat(ctx, () => {
    try {
      return ctx.settings.get(NS);
    } catch {
      return undefined;
    }
  });
}

export { DEFAULT_EFFORTS, apply, buildOps, declaresSystemRole, inject, installStreamCompat, name };