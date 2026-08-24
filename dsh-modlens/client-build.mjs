import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const engineFile = fileURLToPath(new URL('./engine/dsh/client.js', import.meta.url))
const guardFile = fileURLToPath(new URL('./guard/client.js', import.meta.url))
const outputFile = fileURLToPath(new URL('./client.js', import.meta.url))

function extractFactoryBody(source, label) {
  // Both the hand-written engine client and the esbuild-built guard client
  // are `window.__ModuleLoader__.load({ id, factory: (require) => {...} })`.
  // Brace-balancing from the factory's opening `{` tolerates either format —
  // the regex that preceded this could not match the esbuild bundle, whose
  // closing `}` is followed by a `//# sourceMappingURL` comment.
  const marker = 'factory: (require) => {'
  const markerIndex = source.indexOf(marker)
  if (markerIndex < 0) throw new Error(`${label}: factory marker not found`)
  const bodyStart = markerIndex + marker.length
  // The marker ends inside the factory's opening `{`, so that brace already
  // counts: start at depth 1, otherwise a balanced pair like `{ exports: {} }`
  // in the body would look like the closing brace.
  let depth = 1
  let i = bodyStart
  for (; i < source.length; i++) {
    const ch = source[i]
    if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) break
    }
  }
  if (depth !== 0) throw new Error(`${label}: unbalanced braces in factory body`)
  return source.slice(bodyStart, i).replace(/^\r?\n/, '')
}

function indent(source, prefix) {
  return source.split(/\r?\n/).map((line) => `${prefix}${line}`).join('\n')
}

const engineBody = extractFactoryBody(readFileSync(engineFile, 'utf8'), 'ModLens client')
const guardBody = extractFactoryBody(readFileSync(guardFile, 'utf8'), 'guard client')

const output = `// Unified client bundle for the ModLens engine and image guard.\n// The private factories stay isolated, while DSH sees one public module ID.\nwindow.__ModuleLoader__.load({\n  id: 'dsh-modlens',\n  factory: (require) => {\n    const engine = (() => {\n      var module = { exports: {} }\n      var exports = module.exports\n${indent(engineBody, '      ')}\n      return module.exports\n    })()\n\n    const guard = (() => {\n      var module = { exports: {} }\n      var exports = module.exports\n${indent(guardBody, '      ')}\n      return module.exports\n    })()\n\n    return {\n      name: 'dsh-modlens',\n      inject: ['slots', 'locale'],\n      apply(ctx) {\n        engine.apply(ctx)\n        guard.apply(ctx)\n      },\n      __card: engine.__card,\n      __guard: guard,\n    }\n  },\n})\n`

writeFileSync(outputFile, output, 'utf8')
console.log(`built ${outputFile} (${output.length} bytes)`)
