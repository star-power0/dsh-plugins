/**
 * Host-half tool definitions for the ```dsh-ui fence channel.
 *
 * Zero runtime harness imports, deliberately: an external plugin's node half
 * must not depend on the harness module graph at runtime (the profile
 * resolves only the plugin package itself). The definition is therefore a
 * plain `ToolDefinition` object — the exact shape `defineTool` returns — with
 * the arguments schema authored as JSON Schema (the harness validates args
 * and output with the same JSON Schema validator defineTool uses). Deep
 * validation, deterministic repair, and resource limits live in the shared
 * guard (`src/client/guard.ts`), which the schema deliberately stays loose
 * enough to reach.
 *
 * The former `render_ui` tool (tool-row card + panel dock publishing) was
 * removed at the operator's request; the fence channel is the only UI path.
 * @module @omdsh-dev/dsh-genui/plugin/tool
 */

import type { ContentBlock } from '@deepseek-ai/dsh-llm'
import type { JsonValue } from '@deepseek-ai/dsh-session'
import type { GenericCallView, GenericResultView, ToolDefinition } from '@deepseek-ai/dsh-tools'
import type { GenuiSpec } from '../client/spec.ts'
import { GENUI_LIMITS, countGenuiNodes, repairGenuiSpec } from '../client/guard.ts'
import { completeFenceJson } from '../shared/fence-repair.ts'

/** Total node count of a repaired spec — the shared guard traversal
 * (`countGenuiNodes`) so the tool reports the SAME number the panel fold and
 * validation use. A local walker used to under-count specs whose content
 * lives inside tabs/accordion/file-tree (their children are not `.items`). */
function countNodes(spec: GenuiSpec): number {
  return countGenuiNodes(spec, GENUI_LIMITS.maxNodes)
}

/**
 * The `validate_dsh_ui` tool: a model-facing pre-flight check for the
 * ```dsh-ui fence channel. The model calls it with the JSON text it is about
 * to put inside a fence; it reports whether the body parses as a valid GenUI
 * spec, and when it does not, WHERE it breaks and WHAT is likely wrong
 * (bracket counts, common typo classes) so the model can fix and re-validate
 * before emitting — turning "render a red banner after the fact" into
 * "verify before you send". Purely local: no LLM, no network, no DOM.
 */
const VALIDATE_DESCRIPTION =
  'Validate the JSON body of a ```dsh-ui fence BEFORE emitting it — use for non-trivial specs (≥3 nodes or containing a table); skip for trivial ones (≤2 nodes). '
  + 'Pass the exact JSON text you are about to put inside the fence as the "spec" argument (a string). '
  + 'Returns ✅ when it parses as a valid GenUI spec, or ❌ with the exact position, bracket counts, and likely causes when it does not — fix the JSON, re-validate, and only then emit the fence. '
  + 'When the JSON is broken but repairable (unescaped quotes, trailing commas, missing closers), the ❌ reply INCLUDES the auto-repaired JSON — copy it verbatim into the fence instead of rewriting by hand.'

const VALIDATE_PARAMETERS: Record<string, unknown> = {
  type: 'object',
  properties: {
    spec: {
      oneOf: [
        { type: 'string', description: 'The exact JSON text of the fence body.' },
        { type: 'object', description: 'The spec object (serialized before validation).' },
      ],
      description: 'The dsh-ui fence body to validate: pass the JSON as a string for an exact check, or as the spec object.',
    },
  },
  required: ['spec'],
  additionalProperties: false,
}

/** Read the fence-body text from the call args (string preferred, object serialized). */
function fenceTextOf(args: unknown): string | null {
  if (typeof args === 'string') return args
  if (typeof args !== 'object' || args === null) return null
  const record = args as Record<string, unknown>
  const s = 'spec' in record ? record.spec : 'arguments' in record ? record.arguments : undefined
  if (typeof s === 'string') return s
  if (typeof s === 'object' && s !== null) return JSON.stringify(s)
  return null
}

/** Count structural brackets outside string literals. */
function bracketCounts(raw: string): { '{': number; '}': number; '[': number; ']': number } {
  const counts = { '{': 0, '}': 0, '[': 0, ']': 0 }
  let inString = false
  let escaped = false
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]!
    if (escaped) {
      escaped = false
      continue
    }
    if (inString) {
      if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === '{') counts['{'] += 1
    else if (ch === '}') counts['}'] += 1
    else if (ch === '[') counts['['] += 1
    else if (ch === ']') counts[']'] += 1
  }
  return counts
}

/** Short structural hint from bracket counts (empty when balanced). */
function bracketDiagnostic(raw: string): string {
  const c = bracketCounts(raw)
  const diffs: string[] = []
  if (c['{'] !== c['}']) {
    const d = c['{'] - c['}']
    diffs.push(`{ ×${c['{']} / } ×${c['}']} → ${d > 0 ? `缺 ${d} 个 }` : `多 ${-d} 个 }`}`)
  }
  if (c['['] !== c[']']) {
    const d = c['['] - c[']']
    diffs.push(`[ ×${c['[']} / ] ×${c[']']} → ${d > 0 ? `缺 ${d} 个 ]` : `多 ${-d} 个 ]`}`)
  }
  return diffs.length === 0 ? '' : `  括号计数：${diffs.join('；')}（长表格最易在收尾处错位，如把 ]]}]} 写成 ]}]}]}）\n`
}

const COMMON_CAUSES =
  '常见原因：① 收尾括号错位/缺失（{ 与 }、[ 与 ] 数量不相等）② 字符串值内用了半角引号 "（中文引语请用 “” 或 「」）③ 尾随逗号 ④ 字符串未闭合'

/** Build the validate_dsh_ui tool definition. */
export function createValidateDshUiTool(): ToolDefinition {
  return {
    name: 'validate_dsh_ui',
    description: VALIDATE_DESCRIPTION,
    parameters: VALIDATE_PARAMETERS,
    output: {
      schema: { type: 'string', description: 'Validation verdict for the model.' },
      render(_args: unknown, value: JsonValue): ContentBlock[] {
        return [{ type: 'text', text: String(value) }]
      },
    },
    async execute(args: unknown): Promise<JsonValue> {
      const raw = fenceTextOf(args)
      if (raw === null || raw.trim() === '') {
        return '❌ validate_dsh_ui：缺少 spec 参数 —— 把围栏 JSON 文本作为 spec 传入。'
      }
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch (error: unknown) {
        const detail = error instanceof Error ? error.message : String(error)
        // Pre-emission, both repair tiers are safe (no streaming half exists
        // in a validation call). When the repair succeeds, hand the model the
        // FIXED JSON instead of asking it to re-author the fix — re-writing
        // the whole fence by hand is where the next typo comes from.
        const repaired = completeFenceJson(raw)
        if (repaired !== null && repairGenuiSpec(JSON.parse(repaired.text) as unknown) !== null) {
          return `❌ dsh-ui 围栏 JSON 解析失败：${detail}。\n${bracketDiagnostic(raw)}  已自动修复 ${repaired.repairs} 处，下面是修复后的 JSON，直接作为围栏正文发出即可（无需再验证）：\n\`\`\`\n${repaired.text}\n\`\`\``
        }
        return `❌ dsh-ui 围栏 JSON 解析失败：${detail}。\n${bracketDiagnostic(raw)}  自动修复未能恢复（结构损坏），请按错误信息修正后重新调用本工具验证，通过后再发出围栏。\n${COMMON_CAUSES}`
      }
      const spec = repairGenuiSpec(parsed)
      if (spec === null) {
        return '❌ 不是合法 GenUI spec：根对象需要 "items" 数组，且每个节点 type 必须在白名单内（见系统提示词）。请修正后重新验证。'
      }
      return `✅ dsh-ui spec 合法（${countNodes(spec)} 个组件），可以发出围栏。`
    },
    presentCall(): GenericCallView | undefined {
      return { card: 'generic', title: '验证 dsh-ui 围栏', kind: 'other' }
    },
    presentResult(): GenericResultView | undefined {
      return { card: 'generic', title: '验证 dsh-ui 围栏' }
    },
  }
}
