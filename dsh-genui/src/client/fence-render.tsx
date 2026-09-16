/**
 * The dsh-ui fence render pipeline, shared by both render channels:
 *
 * - **Registry channel** (contract hosts): the host's MarkdownText resolves
 *   ```dsh-ui fences through the fence-registry extension point and calls
 *   {@link renderGenuiFence} with a session-scoped context (sessionId + the
 *   settled source identity). An unrepairable body renders {@link FenceFallback}.
 * - **DOM channel** (pristine hosts, no extension point): the DOM observer
 *   (`dom-fence.ts`) finds stock code blocks labelled `dsh-ui` and mounts
 *   {@link renderResolvedFenceNode} into its own React root, wrapped in the
 *   plugin-owned action context. An unrepairable body returns `null` so the
 *   stock code block stays visible.
 *
 * Structural types are declared locally on purpose: the context contract is
 * a data shape, and pristine hosts do not export the host-side type names.
 */
import { useLayoutEffect, useRef, useState, type CSSProperties, type Key, type ReactNode } from 'react'
import { CodeBlock } from '@deepseek-ai/dsh-client-ui-primitives'
import { ErrorBoundary } from './ErrorBoundary.tsx'
import { GenuiBlock } from './GenuiBlock.tsx'
import { repairGenuiSpec } from './guard.ts'
import { fenceStateKey } from './interaction-store.ts'
import { parsePartialGenuiSpec } from './parse-partial.ts'
import type { GenuiSpec } from './spec.ts'
import { completeFenceJson, describeJsonFailure, repairFenceJson } from '../shared/fence-repair.ts'

/** Settled fence source identity (data shape, host-independent). */
export interface GenuiFenceSource {
  /** Stable structural id, e.g. `['assistant', seq, block, fence]` or `dom:<anchor>:<i>`. */
  readonly id: string
  /** Three-part order: [messageSeq, textBlockIndex, fenceIndex]. */
  readonly order: readonly [number, number, number]
}

/** Context a fence renderer receives beside the raw source and React key. */
export interface GenuiFenceContext {
  /** Owning session route; absent outside a session-scoped render. */
  readonly sessionId?: string
  /** Present only for settled/interrupted renders with a stable identity. */
  readonly source?: GenuiFenceSource
}

const FENCE_ERROR_STYLE: CSSProperties = {
  margin: '0 0 6px',
  padding: '6px 10px',
  borderRadius: 6,
  background: 'rgba(239, 68, 68, 0.14)',
  border: '1px solid rgba(239, 68, 68, 0.4)',
  color: '#f87171',
  fontSize: 12,
  lineHeight: 1.55,
  whiteSpace: 'pre-wrap',
}

/** Amber variant for PARTIAL drops: the block renders, but some nodes were
 * dropped by repair (field defects). Silent partial drops used to look like
 * a mysteriously empty stretch of UI — never again. */
const FENCE_WARN_STYLE: CSSProperties = {
  ...FENCE_ERROR_STYLE,
  background: 'rgba(245, 158, 11, 0.12)',
  border: '1px solid rgba(245, 158, 11, 0.4)',
  color: '#fbbf24',
}

/**
 * Fallback for a ```dsh-ui fence whose body has no finished component yet.
 * Two very different situations land here and they must not be conflated:
 *
 * 1. **Streaming partial** — the reply is still being written and the JSON
 *    simply is not complete. The host marks the streaming message with
 *    `[data-streaming]` on the AssistantMarkdown root, which is an ancestor
 *    of every fence. While that marker is present, a plain code block is the
 *    correct rendering (partial JSON must never look like an error).
 *
 * 2. **Settled defect** — the message is finished but the body still does
 *    not parse as JSON (a malformed fence like a missing `}`). This used to
 *    fail silently: the fence degraded to a code block with no hint, and the
 *    author had no way to know the UI never rendered. Once the streaming
 *    marker is gone, surface a compact diagnostic with the parse position so
 *    the defect is visible instead of silent.
 */
function FenceFallback({ raw, fenceKey, allDropped }: { raw: string; fenceKey: Key; allDropped?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [settled, setSettled] = useState(false)
  useLayoutEffect(() => {
    const node = ref.current
    if (node !== null && node.closest('[data-streaming]') === null) setSettled(true)
  })
  // Two failure shapes share the fallback: a malformed body (JSON parse
  // position is the useful hint) and a body that parses but yields no
  // component at all (field-name defects — the JSON is fine, so the usual
  // "解析失败" wording would mislead).
  const diagnostic = settled && raw.trim() !== ''
    ? allDropped === true
      ? '（JSON 本身合法，但所有组件都因字段名错误被丢弃。常见错误：keyvalue 要 pairs、steps 要 steps、table 要 columns+rows、callout 要 content、stat 每项要 label+value）'
      : describeJsonFailure(raw)
    : null
  return (
    <div ref={ref}>
      {diagnostic !== null && (
        <div style={FENCE_ERROR_STYLE} role="alert">
          {allDropped === true
            ? <>⚠️ dsh-ui 围栏没有可渲染组件{diagnostic} —— 围栏保持为代码块；请让模型按字段名速查修正后重发。</>
            : <>⚠️ dsh-ui fence JSON 解析失败{diagnostic} —— 围栏保持为代码块；请让模型检查并修复 JSON 后重发。</>}
        </div>
      )}
      <CodeBlock key={fenceKey} code={`${raw}\n`} lang="dsh-ui" />
    </div>
  )
}

/**
 * Resolve a raw fence body to a guarded spec.
 *
 * - Tier-1 repair (quote escape + trailing commas): safe at any time —
 *   adopted only when the whole body parses, so a still-growing streaming
 *   half keeps falling back to the code block, never flashing a banner.
 * - Tier-2 completion (missing quotes/brackets): settled renders only —
 *   `context.source` exists exclusively once the message finished, so
 *   streaming halves are never completed early.
 */
export function resolveGenuiSpec(raw: string, context?: GenuiFenceContext): GenuiSpec | null {
  const parsed = parsePartialGenuiSpec(raw)
  let spec = parsed === null ? null : repairGenuiSpec(parsed)
  if (spec === null) {
    const repaired = repairFenceJson(raw)
    if (repaired !== null) {
      const reparsed = parsePartialGenuiSpec(repaired.text)
      spec = reparsed === null ? null : repairGenuiSpec(reparsed)
    }
    if (spec === null && context?.source !== undefined) {
      const completed = completeFenceJson(raw)
      if (completed !== null) {
        const reparsed = parsePartialGenuiSpec(completed.text)
        spec = reparsed === null ? null : repairGenuiSpec(reparsed)
      }
    }
  }
  return spec
}

/** The inline GenuiBlock tree for a resolved non-panel spec. */
function renderInlineFence(key: Key, context: GenuiFenceContext | undefined, spec: GenuiSpec): ReactNode {
  const sessionId = context?.sessionId
  // Partial-drop diagnostic: repair dropped some top-level nodes (field
  // defects). Amber note above the surviving block — the defect is visible
  // without punishing the parts that DO render. Clean specs (and
  // re-repaired ones) have no droppedCount and pay nothing.
  const dropped = spec.droppedCount ?? 0
  return (
    // React key carries the stable source identity when present (atomic
    // remount at streaming→settled), falling back to the document key.
    // Repaired specs render SILENTLY: once the UI renders, no amber note
    // tells the user something was wrong — only an unrecoverable body keeps
    // the red diagnostic.
    <ErrorBoundary key={context?.source?.id ?? key} label="该界面">
      {dropped > 0 && (
        <div style={FENCE_WARN_STYLE} role="status">
          ⚠️ {dropped} 个组件因字段名错误未渲染（其余正常显示）。常见错误：keyvalue 要 `pairs`、steps 要 `steps`、table 要 `columns`+`rows`、callout 要 `content`、stat 每项要 `label`+`value`。
        </div>
      )}
      <GenuiBlock
        spec={spec}
        // v2.7 durable state: session + stable source + content fingerprint —
        // replaying the same content restores answers/lock/field values; new
        // content (换题, edited spec) gets a fresh key. Without a stable
        // source (streaming / non-conversation surfaces) state is not
        // persisted.
        stateKey={sessionId === undefined
          ? undefined
          : fenceStateKey(sessionId, context?.source?.id ?? String(key), JSON.stringify(spec))}
      />
    </ErrorBoundary>
  )
}

/**
 * The resolved fence render for the DOM channel: `null` when the body is
 * unrepairable (the stock code block stays visible), otherwise the inline
 * GenuiBlock tree. Shared verbatim by both channels.
 *
 * A legacy `panel:true` fence renders inline now that the panel dock is gone
 * (the operator removed that surface) — old history stays readable instead of
 * collapsing into an empty mount.
 */
export function renderResolvedFenceNode(raw: string, key: Key, context?: GenuiFenceContext): ReactNode | null {
  const spec = resolveGenuiSpec(raw, context)
  if (spec === null) return null
  // Every top-level node was dropped (field defects): an empty block would
  // be a NEW silent failure mode — keep the stock code block visible instead.
  if (spec.items.length === 0) return null
  return renderInlineFence(key, context, spec)
}

/**
 * Registry-channel fence renderer (contract hosts): like the resolved node,
 * but an unrepairable body renders the fallback code block + settled
 * diagnostic — the host replaced its own block with our output.
 */
export function renderGenuiFence(raw: string, key: Key, context?: GenuiFenceContext): ReactNode {
  const spec = resolveGenuiSpec(raw, context)
  if (spec === null) return <FenceFallback key={key} fenceKey={key} raw={raw} />
  // Parses but yields no component at all (field defects): same fallback
  // surface, different wording (the JSON is fine — blame the field names).
  if (spec.items.length === 0) return <FenceFallback key={key} fenceKey={key} raw={raw} allDropped />
  return renderInlineFence(key, context, spec)
}
