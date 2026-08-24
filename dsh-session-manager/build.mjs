// build.mjs —— 用 esbuild 打包 client 端为 DSH ModuleLoader bundle
// 产物：client.js（本插件包的 exports["./client"]）
// 运行：node build.mjs
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
  // 这些依赖由 web 外壳的模块注册表提供，运行时不打包
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
const pkgName = JSON.parse(
  new TextDecoder().decode(await (await import("node:fs/promises")).readFile(fileURLToPath(new URL("./package.json", import.meta.url))))
).name;

const wrapped = `window.__ModuleLoader__.load({
\tid: "${pkgName}",
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
