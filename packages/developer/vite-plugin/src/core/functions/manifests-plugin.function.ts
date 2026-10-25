/**
 * Stackra file contract:
 * Purpose: `manifestsPlugin`, the Vite plugin of the PWA's per-locale web manifests gen writes
 *          (`.stackra/pwa/manifest.<locale>.webmanifest`): each is served and emitted at the site root under its file
 *          name, the URL each locale's page links (`/manifest.ar-sa.webmanifest`).
 * Boundary: client environment only; serves and copies the files as they are (gen owns every attribute). A listed
 *           file that does not exist fails the build with what to run.
 * Runtime: node
 * Governing contract: ADR 0255 (the PWA build), ADR 0295 (decision 5: gen writes the per-locale web manifests).
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

import type { Plugin } from "vite";

/**
 * The plugin that serves and emits the web manifests.
 *
 * @param files - the generated manifests, relative to the member root.
 * @example
 * manifestsPlugin([".stackra/pwa/manifest.en.webmanifest"]); // GET /manifest.en.webmanifest; dist/manifest.en.webmanifest
 */
export function manifestsPlugin(files: readonly string[]): Plugin {
  let root = process.cwd();
  return {
    name: "stackra:manifests",
    applyToEnvironment: (environment) => environment.config.consumer === "client",
    configResolved(config) {
      root = config.root;
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = (request.url ?? "/").split("?")[0] ?? "/";
        const file = files.find((candidate) => `/${basename(candidate)}` === pathname);
        if (file === undefined) {
          next();
          return;
        }
        response.setHeader("Content-Type", "application/manifest+json");
        response.end(readFileSync(resolve(root, file)));
      });
    },
    generateBundle() {
      for (const file of files) {
        const path = resolve(root, file);
        if (!existsSync(path))
          this.error(`The web manifest ${file} is missing: run \`stackra gen\``);
        this.emitFile({ type: "asset", fileName: basename(file), source: readFileSync(path) });
      }
    },
  };
}
