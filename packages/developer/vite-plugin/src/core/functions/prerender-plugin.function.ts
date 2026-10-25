/**
 * Stackra file contract:
 * Purpose: `prerenderPlugin`, the Vite plugin that writes one static document per prerendered route after the client
 *          build: it imports the prerender entry in Node through a Vite module runner and writes what its
 *          `render(url, assets)` export returns to `<outDir>/<route>/index.html`. `assets` names the entry's own
 *          browser chunk and stylesheets from the same build, so the document hydrates with exactly that bundle.
 * Boundary: build only, client environment only; runs in `writeBundle`, so the documents exist before the service
 *           worker's precache manifest is built. The runner loads the preset's own plugins (class components and
 *           `#stackra/*`), not the whole config. An entry without a `render` function fails the build; the route
 *           list and the entry are gen's (a route class with `prerender: true`).
 * Runtime: node
 * Governing contract: ADR 0297 (prerendered documents), ADR 0255 (the offline page precached), ADR 0295 (decision 5).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { runnerImport } from "vite";
import type { Plugin, ResolvedConfig } from "vite";

import { corePlugins } from "#core/functions/core-plugins.function";
import type { ViteConfigOptions } from "#core/types/vite-config-options.type";

/** The browser files of the prerender entry, as URLs under the build's base. */
type PrerenderAssets = { readonly script: string; readonly styles: readonly string[] };

/** What the prerender entry exports. */
type PrerenderModule = {
  readonly render?: (url: string, assets: PrerenderAssets) => string | Promise<string>;
};

/**
 * The plugin that prerenders the routes.
 *
 * @param prerender - the entry and the routes, from the route classes with `prerender: true`.
 * @example
 * prerenderPlugin({ entry: ".stackra/entry/offline.ts", routes: ["/offline", "/ar/offline"] });
 * // dist/offline/index.html, dist/ar/offline/index.html
 */
export function prerenderPlugin(prerender: NonNullable<ViteConfigOptions["prerender"]>): Plugin {
  let config: ResolvedConfig | undefined;
  return {
    name: "stackra:prerender",
    apply: "build",
    applyToEnvironment: (environment) => environment.config.consumer === "client",
    configResolved(resolved) {
      config = resolved;
    },
    async writeBundle(_options, bundle) {
      if (config === undefined) return;
      const { base, root, mode, define } = config;
      const entry = resolve(root, prerender.entry);
      const chunk = Object.values(bundle).find(
        (output) => output.type === "chunk" && output.isEntry && output.facadeModuleId === entry,
      );
      if (chunk === undefined || chunk.type !== "chunk") {
        return this.error(
          `The prerender entry ${prerender.entry} is not in the client build's input`,
        );
      }
      const styles = [...(chunk.viteMetadata?.importedCss ?? [])];
      const { module } = await runnerImport<PrerenderModule>(entry, {
        root,
        mode,
        ...(define === undefined ? {} : { define }),
        configFile: false,
        logLevel: "error",
        plugins: corePlugins(),
      });
      const render = module.render;
      if (typeof render !== "function") {
        return this.error(`The prerender entry ${prerender.entry} must export render(url, assets)`);
      }
      const outDir = resolve(root, config.build.outDir);
      for (const route of prerender.routes) {
        const folder = route.replace(/^\/+|\/+$/g, "");
        // a relative base (the desktop renderer) is relative to each document's own folder
        const prefix =
          base === "" || base.startsWith(".")
            ? "../".repeat(folder === "" ? 0 : folder.split("/").length) || "./"
            : base;
        const assets: PrerenderAssets = {
          script: `${prefix}${chunk.fileName}`,
          styles: styles.map((style) => `${prefix}${style}`),
        };
        const file = join(outDir, folder, "index.html");
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, await render(route, assets));
      }
    },
  };
}
