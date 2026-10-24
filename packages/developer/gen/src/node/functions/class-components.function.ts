/**
 * Stackra file contract:
 * Purpose: `classComponents`, the Vite plugin of the class-component pass, which the generated Vite config puts first
 *          (`plugins: [classComponents()]`) so React Router, the React Compiler and Fast Refresh see plain function
 *          components: it compiles each `.tsx`/`.jsx` source with a `#stackra/ui` import and returns its source map.
 * Boundary: a plain plugin object with no `vite` import (gen does not depend on Vite); `enforce: "pre"` runs it before
 *           every transform that strips TypeScript. Dependencies under `node_modules` are never compiled.
 * Runtime: node
 * Governing contract: ADR 0305 (rules 38 and 40: Vite integration through `@stackra/vite-plugin`); registry v3.1 A14
 *                     (gen ships the pass, vite-plugin wires it).
 */
import { compileClassComponents } from "#node/functions/compile-class-components.function";
import type { ClassComponentsPlugin } from "#node/types/class-components-plugin.type";

/**
 * The class-component Vite plugin.
 *
 * @example
 * export default defineConfig({ plugins: [classComponents()] });
 */
export function classComponents(): ClassComponentsPlugin {
  return {
    name: "stackra:class-components",
    enforce: "pre",
    async transform(code, id) {
      const file = id.split("?")[0] ?? id;
      if (!/\.[jt]sx$/.test(file) || file.includes("/node_modules/")) return null;
      const compiled = await compileClassComponents(code, file);
      return compiled === undefined ? null : { code: compiled.code, map: compiled.map };
    },
  };
}
