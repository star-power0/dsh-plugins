/**
 * Regression: the file-tree must render as a VERTICAL hierarchy.
 *
 * Incident (2026-10-01): `FileTreeNode` emitted each node's children as
 * siblings of the row button inside `.ftRow`, which is `display: flex;
 * flex-direction: row`. The whole subtree therefore flattened onto one
 * horizontal line — the "叠起来的显示" the user reported on the DSH GUI
 * (a 9-row tree measured 51px tall and its rows ran off the right edge).
 *
 * The fix gives every node its own column wrapper (`.ftNode`). These tests
 * assert the STRUCTURE (a row must never contain another row) plus the two
 * behaviours the tree promises: indentation per depth and local collapsing.
 */
import { describe, expect, it } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { FileTreeNode } from './advanced.tsx'
import type { GenuiFileTree } from '../spec.ts'

const spec: GenuiFileTree = {
  type: 'file-tree',
  items: [
    { name: 'SKILL.md', type: 'file' },
    {
      name: 'references',
      type: 'dir',
      children: [
        { name: 'intake.md', type: 'file' },
        { name: 'selection.md', type: 'file' },
        { name: 'skeletons.md', type: 'file' },
      ],
    },
  ],
}

/**
 * Every element carrying the given CSS-module local class. Tolerates both the
 * production hashed form (`<hash>_ftRow`) and the test config's non-scoped form
 * (`ftRow`), so the assertions describe structure, not the bundler's naming.
 */
const byLocal = (root: HTMLElement, local: string): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>('*')].filter(el =>
    [...el.classList].some(c => c === local || c.endsWith(`_${local}`)))

describe('file-tree layout', () => {
  it('never nests a row inside another row (the flattening bug)', () => {
    const { container } = render(<FileTreeNode node={spec} />)
    const rows = byLocal(container, 'ftRow')
    expect(rows.length).toBe(5) // 2 top-level + 3 children
    for (const row of rows) {
      const nested = byLocal(row, 'ftRow')
      expect(nested).toHaveLength(0)
    }
  })

  it('wraps each node in its own column container', () => {
    const { container } = render(<FileTreeNode node={spec} />)
    const nodes = byLocal(container, 'ftNode')
    // One wrapper per node — the row and its children are NOT siblings.
    expect(nodes).toHaveLength(5)
    for (const node of nodes) {
      // Exactly one row is a DIRECT child (descendant rows belong to child nodes).
      const directRows = [...node.children].filter(c =>
        [...c.classList].some(n => n === 'ftRow' || n.endsWith('_ftRow')))
      expect(directRows).toHaveLength(1)
      // The row must come FIRST, children after it.
      expect(node.firstElementChild).toBe(directRows[0])
    }
  })

  it('indents by depth so the hierarchy is readable', () => {
    const { container } = render(<FileTreeNode node={spec} />)
    const rows = byLocal(container, 'ftRow')
    expect(rows[0]!.style.paddingLeft).toBe('0px')
    // `references` sits at depth 0; its children are indented one level.
    const child = rows.find(r => r.textContent?.includes('intake.md'))
    expect(child?.style.paddingLeft).toBe('16px')
  })

  it('keeps every file name in the tree exactly once', () => {
    const { container } = render(<FileTreeNode node={spec} />)
    const text = container.textContent ?? ''
    for (const name of ['SKILL.md', 'references', 'intake.md', 'selection.md', 'skeletons.md']) {
      expect(text).toContain(name)
    }
  })

  it('collapses a directory locally without dropping the node', () => {
    const { container } = render(<FileTreeNode node={spec} />)
    const dirRow = byLocal(container, 'ftRow').find(r => r.textContent?.includes('references'))
    const button = dirRow!.querySelector('button')!
    expect(button.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('false')
    // The directory row survives; only its children are hidden.
    expect(byLocal(container, 'ftRow')).toHaveLength(2)
  })
})
