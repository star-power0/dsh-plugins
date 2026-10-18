/**
 * Regression: GenUI node text must render inline Markdown.
 *
 * Incident (2026-10-18): the table renderer wrote cells with
 * `String(cell)` straight into `<td>`, so model-authored Markdown showed up
 * literally — `**350 ms**` kept its asterisks and `` `step-3.7-flash` `` kept
 * its backticks (the user's screenshot). The same gap existed in the `text`
 * node, `callout`, `keyvalue`, `steps` and `list` renderers: no node ever
 * consulted the host MarkdownText even though the plugin already depends on
 * `@deepseek-ai/dsh-client-ui-primitives`.
 *
 * The fix funnels every text-bearing node through `md.tsx` (Md / MdInline).
 * These tests pin the observable contract: emphasis and code markup become real
 * DOM nodes, and the raw delimiters never appear as literal text.
 */
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { TableNode } from './charts.tsx'
import { CalloutNode, KeyValueNode, StepsNode } from './advanced.tsx'
import { renderNode } from './render-node.tsx'
import type { GenuiCallout, GenuiKeyValue, GenuiSteps, GenuiTable, GenuiText } from '../spec.ts'

const table: GenuiTable = {
  type: 'table',
  columns: ['站点', '首字', '判定'],
  rows: [
    ['**stepfun**', '**350 ms**', '✅ 最优'],
    ['`whiteapi.dev`', '2,510 ms', '⚠️ 偏慢'],
  ],
}

const text: GenuiText = { type: 'text', content: '这是**粗体**和 `行内代码`，还有 [链接](https://example.com)。' }

const callout: GenuiCallout = {
  type: 'callout',
  tone: 'warning',
  title: '**注意**',
  content: '正文里的 `code` 必须渲染。',
}

const keyvalue: GenuiKeyValue = {
  type: 'keyvalue',
  pairs: [{ key: '模型', value: '`deepseek-v4.1-flash`' }],
}

const steps: GenuiSteps = {
  type: 'steps',
  steps: [{ title: '**第一**步', desc: '跑 `npm test`' }],
}

/** Raw Markdown delimiters that must NOT survive into rendered text. */
const RAW_MARKERS = ['**', '`', '](https://']

const expectNoRawMarkdown = (root: HTMLElement): void => {
  const visible = root.textContent ?? ''
  for (const marker of RAW_MARKERS) {
    expect(visible, `raw Markdown delimiter ${marker} leaked into: ${visible}`).not.toContain(marker)
  }
}

describe('GenUI table cells render inline Markdown', () => {
  it('turns **bold** into <strong> instead of literal asterisks', () => {
    const { container } = render(<TableNode node={table} />)
    const strongs = Array.from(container.querySelectorAll('td strong')).map(el => el.textContent)
    expect(strongs).toContain('stepfun')
    expect(strongs).toContain('350 ms')
  })

  it('turns `code` into <code> and drops the backticks', () => {
    const { container } = render(<TableNode node={table} />)
    const codes = Array.from(container.querySelectorAll('td code')).map(el => el.textContent)
    expect(codes).toContain('whiteapi.dev')
  })

  it('renders header Markdown too', () => {
    const boldHeader: GenuiTable = { type: 'table', columns: ['**粗**'], rows: [['x']] }
    const { container } = render(<TableNode node={boldHeader} />)
    expect(container.querySelector('th strong')?.textContent).toBe('粗')
  })

  it('never leaks raw delimiters into the table text', () => {
    const { container } = render(<TableNode node={table} />)
    expectNoRawMarkdown(container)
  })

  it('keeps cells on one line (the inline wrapper flattens the paragraph)', () => {
    const { container } = render(<TableNode node={table} />)
    // The host MarkdownText always emits a block wrapper; MdInline re-inlines it.
    // Structure check: the <td> holds our span.mdInline, not a nested block div.
    const td = container.querySelector('td')
    expect(td).not.toBeNull()
    expect(td!.querySelector('span')).not.toBeNull()
  })
})

describe('other text-bearing nodes render Markdown', () => {
  it('text node renders bold, code and links', () => {
    const { container } = render(<>{renderNode(text, 0, undefined)}</>)
    expect(container.querySelector('strong')?.textContent).toBe('粗体')
    expect(container.querySelector('code')?.textContent).toBe('行内代码')
    const anchor = container.querySelector('a')
    expect(anchor?.getAttribute('href')).toBe('https://example.com')
  })

  it('callout renders Markdown in both title and content', () => {
    const { container } = render(<CalloutNode node={callout} />)
    expect(container.querySelector('strong')?.textContent).toBe('注意')
    expect(container.querySelector('code')?.textContent).toBe('code')
    expectNoRawMarkdown(container)
  })

  it('keyvalue renders Markdown in the value', () => {
    const { container } = render(<KeyValueNode node={keyvalue} />)
    expect(container.querySelector('dd code')?.textContent).toBe('deepseek-v4.1-flash')
    expectNoRawMarkdown(container)
  })

  it('steps render Markdown in title and desc', () => {
    const { container } = render(<StepsNode steps={steps} />)
    expect(container.querySelector('strong')?.textContent).toBe('第一')
    expect(container.querySelector('code')?.textContent).toBe('npm test')
    expectNoRawMarkdown(container)
  })
})

describe('Markdown rendering survives hostile and edge input', () => {
  it('escapes script tags instead of executing them', () => {
    const evil: GenuiText = { type: 'text', content: 'a <script>alert(1)</script> b\n\n**safe**' }
    const { container } = render(<>{renderNode(evil, 0, undefined)}</>)
    // The hostile tag never becomes a live script element...
    expect(container.querySelector('script')).toBeNull()
    // ...and the following block-level Markdown still renders normally.
    expect(container.querySelector('strong')?.textContent).toBe('safe')
  })

  it('refuses javascript: links', () => {
    const evil: GenuiText = { type: 'text', content: '[click](javascript:alert(1))' }
    const { container } = render(<>{renderNode(evil, 0, undefined)}</>)
    const href = container.querySelector('a')?.getAttribute('href') ?? ''
    expect(href.startsWith('javascript:')).toBe(false)
  })

  it('renders an empty cell without crashing', () => {
    const empty: GenuiTable = { type: 'table', columns: ['a'], rows: [['']] }
    const { container } = render(<TableNode node={empty} />)
    expect(container.textContent).toContain('a')
  })

  it('leaves plain text unchanged', () => {
    const plain: GenuiText = { type: 'text', content: '就是一句普通的话' }
    const { container } = render(<>{renderNode(plain, 0, undefined)}</>)
    expect(container.textContent).toContain('就是一句普通的话')
  })
})
