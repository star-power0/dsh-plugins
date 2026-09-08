// Local build for the ui-custom plugin halves.
// Upstream builds through the monorepo tsdown preset, which does not exist
// here; this script reproduces both artifact shapes with esbuild only:
//   lib/index.js  — node half (ESM, @deepseek-ai/* kept external)
//   lib/client.js — browser half wrapped in window.__ModuleLoader__.load,
//                   per-file CSS injected as style[data-plugin-css] tags with
//                   scoped class names (tsdown's `<hash>_<name>` convention).
// esbuild is reused from the Aqua plugin's local node_modules (no duplicate
// install); a bare-specifier import is tried first for portability.
// Run: node build.mjs   (after editing src/**)
import { createHash } from 'node:crypto'
import { readFileSync, writeFile as writeFileCb } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const PLUGIN_ID = '@ha-na-bi/dsh-client-ui-custom'

const { build } = await (async () => {
  try {
    return await import('esbuild')
  } catch {
    const local = path.join(ROOT, '..', 'dsh-client-ui-aqua', 'node_modules', 'esbuild', 'lib', 'main.js')
    return await import(`file://${local.replaceAll('\\', '/')}`)
  }
})()

/** Scoped class name: alphabetic content-hash prefix + original name
 *  (matches tsdown's `<hash>_<name>` convention while keeping CSS selectors
 *  valid when the hash starts with a digit). */
function scopedName(raw, name) {
  const hash = createHash('sha256').update(raw).digest('hex').slice(0, 6)
  return `u${hash}_${name}`
}

/** CSS-modules loader: every `.module.css` becomes a JS module that injects
 *  its (scoped) stylesheet and default-exports the class-name map.
 *  `:global(.name)` selectors are passed through unscoped with the wrapper
 *  stripped (motion.ts applies those classes from JS by literal name). */
const cssModulesPlugin = {
  name: 'ui-custom-css-modules',
  setup(build) {
    build.onLoad({ filter: /\.module\.css$/, namespace: 'file' }, (args) => {
      const raw = readFileSync(args.path, 'utf8')
      const globalNames = new Set()
      for (const match of raw.matchAll(/:global\(\.([A-Za-z_][A-Za-z0-9_-]*)\)/g)) {
        globalNames.add(match[1])
      }
      const names = []
      for (const match of raw.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)(?=[\s{:,.[])/g)) {
        if (!globalNames.has(match[1]) && !names.includes(match[1])) names.push(match[1])
      }
      const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const map = {}
      let css = raw
      for (const name of names) {
        const scoped = scopedName(raw, name)
        map[name] = scoped
        css = css.replace(new RegExp(`\\.${escapeRegExp(name)}(?=[\\s{:,.[])`, 'g'), `.${scoped}`)
      }
      css = css.replace(/:global\(\.([A-Za-z_][A-Za-z0-9_-]*)\)/g, '.$1')
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
  }
}

// Node half: the settings-namespace registration (schema + loader base).
{
  const outfile = path.join(ROOT, 'lib', 'index.js')
  await build({
    entryPoints: [path.join(ROOT, 'src', 'index.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: ['node18'],
    external: ['@deepseek-ai/*'],
    sourcemap: false,
    outfile,
  })
  console.log(`built ${outfile}`)
}

// Browser half: the whole client surface (theme applier, settings sections,
// motion, markdown, history) behind the module-loader factory.
{
  const outfile = path.join(ROOT, 'lib', 'client.js')
  const result = await build({
    entryPoints: [path.join(ROOT, 'src', 'client', 'index.ts')],
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
}
