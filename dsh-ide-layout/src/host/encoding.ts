/**
 * Host-side text codec: iconv-lite handles multi-encoding (GBK/GB18030/Big5/
 * UTF-16LE etc.); auto-detect is for "open a garbled file, pick auto once".
 * Contract:
 * - Strip leading U+FEFF after decode (UTF-8 / UTF-16 BOM residue); never
 *   write BOM on save (matches VS Code default "UTF-8 without BOM").
 * - iconv-lite's label for utf-16le is 'utf16-le'; normalise here.
 */

import iconv from 'iconv-lite'
import type { TextEncodingId } from '../core/encoding.ts'

/** Normalise to iconv-lite label ('utf-16le' → 'utf16-le'). */
function iconvLabel(encoding: TextEncodingId): string {
  return encoding === 'utf-16le' ? 'utf16-le' : encoding
}

/** Strict UTF-8 validation (overlong / surrogate / out-of-range checks). */
export function isValidUtf8(data: Uint8Array): boolean {
  for (let i = 0; i < data.length; i += 1) {
    const b = data[i]!
    if (b < 0x80) continue
    let extra = 0
    if (b >= 0xc2 && b <= 0xdf) extra = 1
    else if (b >= 0xe0 && b <= 0xef) extra = 2
    else if (b >= 0xf0 && b <= 0xf4) extra = 3
    else return false
    if (i + extra >= data.length) return false
    for (let j = 1; j <= extra; j += 1) {
      const c = data[i + j]!
      if (c < 0x80 || c > 0xbf) return false
    }
    if (extra === 2 && b === 0xe0 && data[i + 1]! < 0xa0) return false
    if (extra === 2 && b === 0xed && data[i + 1]! >= 0xa0) return false
    if (extra === 3 && b === 0xf0 && data[i + 1]! < 0x90) return false
    if (extra === 3 && b === 0xf4 && data[i + 1]! >= 0x90) return false
    i += extra
  }
  return true
}

/** Auto-detect: strict UTF-8 → GB18030 (GBK superset) → UTF-8 fallback. */
export function detectTextEncoding(data: Uint8Array): TextEncodingId {
  if (isValidUtf8(data)) return 'utf-8'
  try {
    const decoded = iconv.decode(Buffer.from(data), 'gb18030')
    if (!decoded.includes('￿')) return 'gb18030'
  } catch {
    // fall through to UTF-8 fallback
  }
  return 'utf-8'
}

/** Decode by encoding; 'auto' detects first, returns actual encoding used. */
export function decodeText(
  data: Uint8Array,
  encoding: TextEncodingId | 'auto',
): { text: string; encoding: TextEncodingId } {
  const used = encoding === 'auto' ? detectTextEncoding(data) : encoding
  let text = iconv.decode(Buffer.from(data), iconvLabel(used))
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  return { text, encoding: used }
}

/** Encode by encoding (UTF-16LE writes BOM: iconv's utf16-le does not). */
export function encodeText(text: string, encoding: TextEncodingId): Buffer {
  if (encoding === 'utf-16le') {
    const body = iconv.encode(text, 'utf16-le')
    const withBom = Buffer.alloc(body.length + 2)
    withBom.writeUInt16LE(0xfeff, 0)
    body.copy(withBom, 2)
    return withBom
  }
  return iconv.encode(text, iconvLabel(encoding))
}
