/**
 * Markdown rendering for GenUI node text.
 *
 * GenUI specs are authored by the model, so node text routinely carries inline
 * Markdown (`**bold**`, `` `code` ``, links, lists). The node renderers used to
 * drop those strings straight into JSX, so the markup showed up literally —
 * `**350 ms**` rendered with its asterisks and `` `step-3.7-flash` `` kept its
 * backticks. Every text-bearing node now funnels through here.
 *
 * The host's MarkdownText is reused rather than re-implementing a parser: it
 * already applies the shell's untrusted-link allowlist (`http(s)`/`mailto`) and
 * code-block handling, so GenUI text inherits exactly the same safety stance as
 * assistant prose.
 *
 * @module @omdsh-dev/dsh-genui/client/md
 */
import { MarkdownText } from '@deepseek-ai/dsh-client-ui-primitives'
import css from './GenuiBlock.module.css'

/**
 * Block-level Markdown: paragraphs, lists and headings render as real blocks.
 * Use for free-form copy (a text node body, a callout body).
 */
export function Md({ text }: { text: string }): React.ReactNode {
  if (text === '') return null
  return <div className={css.md}><MarkdownText text={text} /></div>
}

/**
 * Inline Markdown for contexts that must stay on ONE line — a table cell, a
 * key/value value, a list row. MarkdownText always emits a block wrapper, so the
 * `mdInline` class flattens the generated `<p>` back to inline and strips the
 * paragraph margin that would otherwise break table row rhythm.
 */
export function MdInline({ text }: { text: string }): React.ReactNode {
  if (text === '') return null
  return <span className={css.mdInline}><MarkdownText text={text} /></span>
}
