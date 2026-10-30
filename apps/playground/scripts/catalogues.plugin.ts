/**
 * Stackra file contract:
 * Purpose: `cataloguesPlugin`, the Vite plugin that serves every `assets/lang/<locale>/<namespace>.json` of the
 *          playground as one module, `virtual:playground-catalogues` (`{ [locale]: { [namespace]: catalogue } }`), so
 *          the dev server answers one request for the app's words instead of one per file (about 430).
 * Boundary: dev server, build and vitest alike; the module is plain data. A changed, added or removed catalogue
 *           invalidates the module and reloads the page.
 * Runtime: node
 * Governing contract: ADR 0305 (conventions 1: `assets/lang/<locale>/<namespace>.json`); STA-1371 (playground dev
 *          speed, owner approval 2026-10-29).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Plugin } from "vite";

/** The id the playground imports. */
const ID = "virtual:playground-catalogues";

/** The resolved id; the `\0` keeps other plugins off it. */
const RESOLVED = `\0${ID}`;

/** Every catalogue under `dir`, by locale, then namespace. */
function readCatalogues(dir: string): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const locale of readdirSync(dir)) {
    const namespaces: Record<string, unknown> = {};
    for (const file of readdirSync(join(dir, locale))) {
      if (!file.endsWith(".json")) continue;
      namespaces[file.slice(0, -".json".length)] = JSON.parse(
        readFileSync(join(dir, locale, file), "utf8"),
      );
    }
    out[locale] = namespaces;
  }
  return out;
}

/** Serves the playground's catalogues as one module. */
export function cataloguesPlugin(): Plugin {
  const dir = fileURLToPath(new URL("../assets/lang", import.meta.url));
  return {
    name: "stackra-playground-catalogues",
    resolveId: (id) => (id === ID ? RESOLVED : undefined),
    load(id) {
      if (id !== RESOLVED) return undefined;
      // JSON.parse of a string literal parses faster than the same object written as a JavaScript literal.
      return `export default JSON.parse(${JSON.stringify(JSON.stringify(readCatalogues(dir)))});`;
    },
    configureServer(server) {
      server.watcher.add(dir);
      const reload = (file: string) => {
        if (!file.startsWith(dir) || !file.endsWith(".json")) return;
        for (const environment of Object.values(server.environments)) {
          const module = environment.moduleGraph.getModuleById(RESOLVED);
          if (module) environment.moduleGraph.invalidateModule(module);
        }
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("change", reload);
      server.watcher.on("add", reload);
      server.watcher.on("unlink", reload);
    },
  };
}
