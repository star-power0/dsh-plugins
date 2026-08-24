import { build } from "esbuild";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const entry = fileURLToPath(new URL("./src/client.js", import.meta.url));
const outfile = fileURLToPath(new URL("./client.js", import.meta.url));

const result = await build({
  entryPoints: [entry],
  bundle: true,
  format: "cjs",
  platform: "neutral",
  jsx: "automatic",
  loader: { ".js": "jsx" },
  target: ["es2022"],
  external: [
    "react",
    "react/jsx-runtime",
    "react/jsx-dev-runtime",
    "react-dom",
    "react-dom/client",
    "@deepseek-ai/*"
  ],
  sourcemap: true,
  write: false
});

const code = result.outputFiles[0].text;
const map = result.outputFiles.find((f) => f.path.endsWith(".map"))?.text ?? "";
const wrapped = `window.__ModuleLoader__.load({
\tid: "dsh-modlens-guard",
\tfactory: (require) => {
\t\tvar module = { exports: {} };
\t\tvar exports = module.exports;
\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
${code}
\t\treturn module.exports;
\t}
});
//# sourceMappingURL=client.js.map
`;

writeFileSync(outfile, wrapped, "utf8");
writeFileSync(`${outfile}.map`, map, "utf8");
console.log(`built ${outfile} (${wrapped.length} bytes)`);
