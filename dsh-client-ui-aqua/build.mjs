// Local build for the Aqua client bundle.
// Upstream builds through the monorepo tsdown preset (D:\Hermes Work\...),
// which does not exist here; this script reproduces the same artifact shape —
// window.__ModuleLoader__.load({ id, factory }) with per-file CSS injected as
// style[data-plugin-css] tags and scoped class names — using esbuild only.
// Run: node build.mjs   (after editing src/client/*)
import { build } from 'esbuild'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const PLUGIN_ID = '@deepseek-ai/dsh-client-ui-aqua'

/** Scoped class name: alphabetic content-hash prefix + original name
 *  (matches tsdown's `<hash>_<name>` convention while keeping CSS selectors
 *  valid when the hash starts with a digit). */
function scopedName(raw, name) {
  const hash = createHash('sha256').update(raw).digest('hex').slice(0, 6)
  return `a${hash}_${name}`
}

/** CSS-modules loader: every `.module.css` becomes a JS module that injects
 *  its (scoped) stylesheet and default-exports the class-name map. */
const cssModulesPlugin = {
  name: 'aqua-css-modules',
  setup(build) {
    build.onLoad({ filter: /\.module\.css$/, namespace: 'file' }, (args) => {
      const raw = readFileSync(args.path, 'utf8')
      const names = []
      for (const match of raw.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)(?=[\s{:,.[])/g)) {
        if (!names.includes(match[1])) names.push(match[1])
      }
      const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const map = {}
      let css = raw
      for (const name of names) {
        const scoped = scopedName(raw, name)
        map[name] = scoped
        css = css.replace(new RegExp(`\\.${escapeRegExp(name)}(?=[\\s{:,.[])`, 'g'), `.${scoped}`)
      }
      const tagId = `${PLUGIN_ID}/${path.basename(args.path)}`
      const contents = [
        `const css = ${JSON.stringify(css)};`,
        `const tagId = ${JSON.stringify(tagId)};`,
        `if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {`,
        `  const tag = document.createElement('style');`,
        `  tag.dataset.plugin = ${JSON.stringify(PLUGIN_ID)};`,
        `  tag.dataset.pluginCss = tagId;`,
        `  tag.textContent = css;`,
        `  document.head.appendChild(tag);`,
        `}`,
        `export default ${JSON.stringify(map)};`,
      ].join('\n')
      return { contents, loader: 'js' }
    })
  },
}

const entry = path.join(ROOT, 'src', 'client', 'index.ts')
const outfile = path.join(ROOT, 'lib', 'client.js')
const result = await build({
  entryPoints: [entry],
  bundle: true,
  format: 'cjs',
  platform: 'neutral',
  jsx: 'automatic',
  target: ['es2022'],
  // Provided by the host module registry at runtime.
  external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/*'],
  plugins: [cssModulesPlugin],
  sourcemap: true,
  write: false,
})

const code = result.outputFiles.find((file) => !file.path.endsWith('.map'))?.text ?? ''
const map = result.outputFiles.find((file) => file.path.endsWith('.map'))?.text ?? ''
const wrapped = `window.__ModuleLoader__.load({\n\tid: "${PLUGIN_ID}",\n\tfactory: (require) => {\n\t\tvar module = { exports: {} };\n\t\tvar exports = module.exports;\n\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: "Module" });\n${code}\n\t\treturn module.exports;\n\t}\n});\n//# sourceMappingURL=client.js.map\n`
await writeFile(outfile, wrapped, 'utf8')
await writeFile(`${outfile}.map`, map, 'utf8')
console.log(`built ${outfile} (${wrapped.length} bytes)`)
