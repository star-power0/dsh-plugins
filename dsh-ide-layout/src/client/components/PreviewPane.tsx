/**
 * PreviewPane — non-code file viewers for the IDE editor body.
 * Dispatches by extension:
 *  - .md / .markdown  → Markdown rendered with `marked` (HTML, no scripts)
 *  - images            → <img> via the /dsh-ide/media host route
 *  - .pdf              → PDF.js canvas rendering from the /dsh-ide/media host route

 * Anything else falls through to the CodeMirror code viewer (caller decides).
 */

import { useEffect, useRef, useState, type JSX } from 'react'
import { marked } from 'marked'
import { getDocument } from 'pdfjs-dist'
import { WorkerMessageHandler } from 'pdfjs-dist/build/pdf.worker.mjs'

/** Image extensions the media route serves with image/* mime. */
const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'avif', 'svg'])

/** Media URL for one file (the host route is GET + loopback-gated). */
export function mediaUrl(root: string, path: string): string {
  return `/dsh-ide/media?root=${encodeURIComponent(root)}&path=${encodeURIComponent(path)}`
}

/** Render Markdown to sanitized-ish HTML (marked escapes raw HTML by default
 *  when `breaks` is off and we never enable raw HTML; scripts are dropped). */
function renderMarkdown(source: string): string {
  return marked.parse(source, { async: false, gfm: true, breaks: true }) as string
}

const markdownStyle: Record<string, string | number> = {
  padding: '16px 20px',
  overflow: 'auto',
  height: '100%',
  boxSizing: 'border-box',
  fontSize: 14,
  lineHeight: 1.7,
  color: 'var(--dsw-alias-label-primary, #1f2328)',
}

/** The markdown preview document body (styles scoped to the preview root). */
const markdownCss = `
.md-preview h1, .md-preview h2, .md-preview h3 { border-bottom: 1px solid var(--dsw-alias-border-l2,#e5e6eb); padding-bottom: .3em; }
.md-preview code { background: rgba(127,127,127,.12); padding: .15em .35em; border-radius: 4px; font-size: .9em; font-family: ui-monospace, "Cascadia Code", Consolas, monospace; }
.md-preview pre { background: rgba(127,127,127,.08); padding: 12px; border-radius: 8px; overflow: auto; }
.md-preview pre code { background: transparent; padding: 0; }
.md-preview blockquote { border-left: 3px solid var(--dsw-alias-border-l3,#d0d7de); margin: .5em 0; padding-left: 12px; color: var(--dsw-alias-label-secondary,#57606a); }
.md-preview table { border-collapse: collapse; }
.md-preview th, .md-preview td { border: 1px solid var(--dsw-alias-border-l2,#d0d7de); padding: 4px 10px; }
.md-preview img { max-width: 100%; }
.md-preview a { color: var(--dsw-alias-accent,#0969da); }
`

function PdfPreview({ data, path }: { data: Uint8Array; path: string }): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (container === null) return
    let cancelled = false
    let loadingTask: ReturnType<typeof getDocument> | null = null
    container.replaceChildren()
    setError(null)
    ;(globalThis as typeof globalThis & { pdfjsWorker?: { WorkerMessageHandler: unknown } }).pdfjsWorker = { WorkerMessageHandler }

    void (async () => {
      try {
        loadingTask = getDocument({ data })
        const pdfDocument = await loadingTask.promise
        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
          if (cancelled) return
          const page = await pdfDocument.getPage(pageNumber)
          const baseViewport = page.getViewport({ scale: 1 })
          const availableWidth = Math.max(container.clientWidth - 32, 320)
          const scale = Math.min(1.5, availableWidth / baseViewport.width)
          const viewport = page.getViewport({ scale })
          const canvas = globalThis.document.createElement('canvas')
          const context = canvas.getContext('2d')
          if (context === null) throw new Error('无法创建 PDF 画布')
          const pageRoot = globalThis.document.createElement('div')
          pageRoot.style.cssText = 'display:flex;justify-content:center;padding:16px;background:rgba(127,127,127,.12);'
          canvas.width = Math.ceil(viewport.width)
          canvas.height = Math.ceil(viewport.height)
          canvas.style.cssText = 'display:block;max-width:100%;height:auto;background:var(--dsw-alias-bg-layer-1,rgba(255,255,255,.55));box-shadow:0 2px 12px rgba(0,0,0,.18);'
          pageRoot.appendChild(canvas)
          container.appendChild(pageRoot)
          await page.render({ canvasContext: context, viewport }).promise
        }
        await pdfDocument.destroy()
      } catch (reason: unknown) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : '无法渲染 PDF')
      }
    })()

    return () => {
      cancelled = true
      if (loadingTask !== null) void loadingTask.destroy()
    }
  }, [data])

  if (error !== null) {
    return <div style={{ padding: 20, color: '#dc2626', fontSize: 13 }}>PDF 预览失败：{error}</div>
  }
  return <div ref={containerRef} aria-label={`${path} PDF 预览`} style={{ height: '100%', overflow: 'auto' }} />
}

function MediaPreview({ root, path, type }: { root: string; path: string; type: 'image' | 'pdf' }): JSX.Element {
  const [url, setUrl] = useState<string | null>(null)
  const [data, setData] = useState<Uint8Array | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let objectUrl: string | null = null
    setUrl(null)
    setData(null)
    setError(null)
    void fetch(mediaUrl(root, path), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const blob = await response.blob()
        if (type === 'pdf') {
          setData(new Uint8Array(await blob.arrayBuffer()))
        } else {
          objectUrl = URL.createObjectURL(blob)
          setUrl(objectUrl)
        }
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setError(reason instanceof Error ? reason.message : '无法加载文件')
      })
    return () => {
      controller.abort()
      if (objectUrl !== null) URL.revokeObjectURL(objectUrl)
    }
  }, [root, path, type])

  if (error !== null) {
    return <div style={{ padding: 20, color: '#dc2626', fontSize: 13 }}>预览加载失败：{error}</div>
  }
  if (type === 'pdf') {
    if (data === null) return <div style={{ padding: 20, color: '#9ca3af', fontSize: 13 }}>正在加载 PDF…</div>
    return <PdfPreview data={data} path={path} />
  }
  if (url === null) {
    return <div style={{ padding: 20, color: '#9ca3af', fontSize: 13 }}>正在加载预览…</div>
  }
  return (
    <div data-ide-preview="" style={{ height: '100%', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
      <img src={url} alt={path} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
    </div>
  )
}

export function PreviewPane({ root, path, source }: { root: string; path: string; source: string }): JSX.Element {
  const ext = (path.split('.').pop() ?? '').toLowerCase()

  // Markdown preview
  if (ext === 'md' || ext === 'markdown') {
    return (
      <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <style>{markdownCss}</style>
        <div data-ide-preview="" className="md-preview"
          style={markdownStyle}
          // marked output for GFM markdown never contains executable content
          // when raw HTML is disabled; still, the preview is inert (no handlers).
          dangerouslySetInnerHTML={{ __html: renderMarkdown(source) }}
        />
      </div>
    )
  }

  // PDF preview (PDF.js canvas renderer)
  if (ext === 'pdf') {
    return <MediaPreview root={root} path={path} type="pdf" />
  }

  // Image preview
  if (IMAGE_EXTS.has(ext)) {
    return <MediaPreview root={root} path={path} type="image" />
  }

  // Fallback: not a previewable type (caller should not render us).
  return <div style={{ padding: 16, color: '#9ca3af' }}>无预览</div>
}

/** Whether this path should open in the preview pane instead of CodeMirror. */
export function isPreviewable(path: string): boolean {
  const ext = (path.split('.').pop() ?? '').toLowerCase()
  return ext === 'md' || ext === 'markdown' || ext === 'pdf' || IMAGE_EXTS.has(ext)
}

/** Whether this path is markdown (editable in the preview with a save). */
export function isMarkdown(path: string): boolean {
  const ext = (path.split('.').pop() ?? '').toLowerCase()
  return ext === 'md' || ext === 'markdown'
}
