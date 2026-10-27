/**
 * Stackra file contract:
 * Purpose: `stackra`, the Stackra Vite preset. Called, it returns the plugins every Stackra Vite build runs (gen's
 *          class-component pass, `#stackra/*` served from gen's files, the `.server` import refusal);
 *          `stackra.viteConfig(app, options)` builds a member's whole Vite config, which is what the generated
 *          `.stackra/vite.config.ts` calls; `stackra.bundleConfig(options)` builds a product UI package's extension
 *          bundle for one surface (ADR 0436).
 * Boundary: one value with a call signature and two methods, so `import { stackra } from "@stackra/vite-plugin"` is the
 *           package's only import. It adds no `#stackra/*` export of its own (ADR 0261).
 * Runtime: node
 * Governing contract: ADR 0261 (decision 4), ADR 0295 (decision 5), ADR 0305 (rule 40); ADR 0436 (decision 4); registry v3.1 A14 (gen ships
 *                     the class-component pass, this package wires it).
 */
import type { Plugin } from "vite";

import { bundleConfig } from "#core/functions/bundle-config.function";
import { corePlugins } from "#core/functions/core-plugins.function";
import { viteConfig } from "#core/functions/vite-config.function";

/**
 * The Stackra Vite preset.
 *
 * @example
 * export default defineConfig({ plugins: [stackra()] }); // a hand-written config
 * @example
 * export default defineConfig(({ mode }) => stackra.viteConfig(app, { mode, server: devServer("console") }));
 * @example
 * export default defineConfig(() => stackra.bundleConfig({ surface: "console", entry: "src/console.ts", importMap }));
 */
export const stackra: {
  (): Plugin[];
  readonly viteConfig: typeof viteConfig;
  readonly bundleConfig: typeof bundleConfig;
} = Object.assign((): Plugin[] => corePlugins(), { viteConfig, bundleConfig });
