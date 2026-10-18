/**
 * Vitest config for the client renderer tests.
 *
 * The renderer imports `@deepseek-ai/dsh-client-ui-primitives`, whose module
 * graph reaches plain `.css` files (katex). Vitest externalizes those packages
 * by default, so Node's ESM loader hits an unknown `.css` extension and the
 * whole suite fails to collect. Inlining the primitives puts them through
 * Vite's transform pipeline, which stubs CSS. The CSS-Module class names stay
 * NON-scoped so assertions can match the stable `_<local>` suffix.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    server: { deps: { inline: [/@deepseek-ai\//, /katex/] } },
  },
})
