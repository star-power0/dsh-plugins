/**
 * Block-level Markdown: paragraphs, lists and headings render as real blocks.
 * Use for free-form copy (a text node body, a callout body).
 */
export declare function Md({ text }: {
    text: string;
}): React.ReactNode;
/**
 * Inline Markdown for contexts that must stay on ONE line — a table cell, a
 * key/value value, a list row. MarkdownText always emits a block wrapper, so the
 * `mdInline` class flattens the generated `<p>` back to inline and strips the
 * paragraph margin that would otherwise break table row rhythm.
 */
export declare function MdInline({ text }: {
    text: string;
}): React.ReactNode;
