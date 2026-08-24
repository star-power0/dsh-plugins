// Build the browser bundle consumed by DSH's ModuleLoader.
import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const entry = fileURLToPath(new URL("./src/client.js", import.meta.url));
const outfile = fileURLToPath(new URL("./client.js", import.meta.url));
const result = await build({ entryPoints: [entry], bundle: true, format: "cjs", platform: "neutral", jsx: "automatic", loader: { ".js": "jsx" }, target: ["es2022"], external: ["react", "react/jsx-runtime", "react/jsx-dev-runtime", "react-dom", "react-dom/client", "@deepseek-ai/*"], sourcemap: true, write: false });
const code = result.outputFiles[0].text;
const map = result.outputFiles.find((file) => file.path.endsWith(".map"))?.text ?? "";
const pkg = JSON.parse(await readFile(fileURLToPath(new URL("./package.json", import.meta.url)), "utf8"));
const wrapped = `window.__ModuleLoader__.load({\n\tid: "${pkg.name}",\n\tfactory: (require) => {\n\t\tvar module = { exports: {} };\n\t\tvar exports = module.exports;\n\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: "Module" });\n${code}\n\t\treturn module.exports;\n\t}\n});\n//# sourceMappingURL=client.js.map\n`;
await writeFile(outfile, wrapped, "utf8");
await writeFile(`${outfile}.map`, map, "utf8");
console.log(`built ${outfile} (${wrapped.length} bytes)`);
