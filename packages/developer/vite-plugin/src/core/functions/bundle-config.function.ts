/**
 * Stackra file contract:
 * Purpose: `bundleConfig(options)`, reached as `stackra.bundleConfig`: the Vite config of one surface's extension
 *          bundle from a product UI package. Every specifier the shell's import map maps stays external (an ES module
 *          import the shell resolves at run time), and with `proTypesOnly` so does HeroUI Pro; the entry keeps its
 *          exports for the shell to load; the output is ES modules with content-hashed names under
 *          `<outDir>/<surface>/<version>/` beside `bundle.manifest.json`.
 * Boundary: build only, no dev server: serving a bundle into a running shell is `stackra dev --surface` (stackra-05).
 *           Runs the preset's plugins and React's (a bundle is a single-page module, never server-rendered), then
 *           `bundlePlugin`. Nothing is read from the environment here.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4: extension bundles with the shell's shared dependencies as externals);
 *                     app-shells-edge-and-extension.md 4.2 and 16 (point 8); ADR 0295 (decision 5); ADR 0261.
 */
import type { PluginOption, UserConfig } from "vite";

import { PRO_IMPORTS } from "#core/constants/pro-imports.constant";
import { bundlePlugin } from "#core/functions/bundle-plugin.function";
import { corePlugins } from "#core/functions/core-plugins.function";
import { importMapResolves } from "#core/functions/import-map-resolves.function";
import { renderPlugins } from "#core/functions/render-plugins.function";
import type { BundleConfigOptions } from "#core/types/bundle-config-options.type";

/** The default output root of the bundles. */
const BUNDLES_DIR = "dist/bundles";

/**
 * The Vite config of an extension bundle.
 *
 * @param options - see `BundleConfigOptions`.
 * @example
 * export default defineConfig(() =>
 *   stackra.bundleConfig({ surface: "console", entry: "src/console.ts", importMap: shell.importMap }),
 * );
 */
export async function bundleConfig(options: BundleConfigOptions): Promise<UserConfig> {
  const given = options.plugins ?? [];
  const external = (id: string): boolean =>
    importMapResolves(options.importMap, id) ||
    (options.proTypesOnly === true && importMapResolves(PRO_IMPORTS, id));
  const plugins: PluginOption[] = [
    ...given,
    ...corePlugins(given),
    ...(await renderPlugins(false)),
    bundlePlugin({
      surface: options.surface,
      importMap: options.importMap,
      outDir: options.outDir ?? BUNDLES_DIR,
      ...(options.proTypesOnly === undefined ? {} : { proTypesOnly: options.proTypesOnly }),
    }),
  ];
  return {
    plugins,
    // Relative, so dynamic-import preloads resolve from the bundle's own URL on the asset store.
    base: "./",
    define: { ...options.define },
    build: {
      ...options.build,
      manifest: false,
      // The edge emits the modulepreload links from bundle.manifest.json; the shell already polyfills.
      modulePreload: { polyfill: false },
      rolldownOptions: {
        ...options.build?.rolldownOptions,
        input: { [options.surface]: options.entry },
        external,
        preserveEntrySignatures: "strict",
        output: {
          format: "es",
          entryFileNames: "[name].[hash].js",
          chunkFileNames: "chunks/[name].[hash].js",
          assetFileNames: "assets/[name].[hash][extname]",
        },
      },
    },
  };
}
