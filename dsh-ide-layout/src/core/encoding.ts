/**
 * Text encoding whitelist (shared by client menu and host codec).
 * Only common encodings iconv-lite / WHATWG cover: Chinese Windows legacy
 * files (Notepad ANSI = GBK) + UTF-8 are the main use case.
 */

/** Writable encodings (read + write). 'auto' is read-only detect, not here. */
export const TEXT_ENCODING_IDS = ['utf-8', 'gbk', 'gb18030', 'big5', 'utf-16le', 'latin1'] as const

export type TextEncodingId = (typeof TEXT_ENCODING_IDS)[number]

export function isTextEncodingId(value: string): value is TextEncodingId {
  return (TEXT_ENCODING_IDS as readonly string[]).includes(value)
}

/** Encoding id → display label (status bar). */
export const TEXT_ENCODING_LABELS: Readonly<Record<TextEncodingId, string>> = {
  'utf-8': 'UTF-8',
  gbk: 'GBK',
  gb18030: 'GB18030',
  big5: 'Big5',
  'utf-16le': 'UTF-16 LE',
  latin1: 'ISO-8859-1',
}

export function encodingLabel(id: string): string {
  return TEXT_ENCODING_LABELS[id as TextEncodingId] ?? id
}

/** Encoding menu items ('auto' = read-time detect, read-only option). */
export const TEXT_ENCODING_CHOICES: ReadonlyArray<{ id: TextEncodingId | 'auto'; label: string }> = [
  { id: 'utf-8', label: 'UTF-8' },
  { id: 'auto', label: '自动检测（乱码时推荐）' },
  { id: 'gb18030', label: 'GB18030' },
  { id: 'gbk', label: 'GBK' },
  { id: 'big5', label: 'Big5' },
  { id: 'utf-16le', label: 'UTF-16 LE' },
  { id: 'latin1', label: 'ISO-8859-1' },
]
