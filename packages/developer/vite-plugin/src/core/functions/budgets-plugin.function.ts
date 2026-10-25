/**
 * Stackra file contract:
 * Purpose: `budgetsPlugin`, the Vite plugin that fails the client build when a chunk is over its gzipped budget: an
 *          entry chunk against `entryKb`, every other chunk (routes, shared code) against `routeKb`, and every chunk
 *          over budget is listed at once.
 * Boundary: build only, client environment only (the Worker and SSR bundles have no download budget). Sizes are the
 *           gzip of the emitted code, measured in the bundle before it is written.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5: generated tool configs carry `telemetry.config.ts` budgets), ADR 0184.
 */
import { gzipSync } from "node:zlib";

import type { Plugin } from "vite";

import type { ViteConfigOptions } from "#core/types/vite-config-options.type";

/**
 * The plugin that enforces the bundle budgets.
 *
 * @param budgets - the gzipped limits in kilobytes.
 * @example
 * budgetsPlugin({ entryKb: 200, routeKb: 100 }); // "assets/index-x1.js: 212.4 kB gzipped, entry budget 200 kB"
 */
export function budgetsPlugin(budgets: NonNullable<ViteConfigOptions["budgets"]>): Plugin {
  return {
    name: "stackra:budgets",
    apply: "build",
    applyToEnvironment: (environment) => environment.config.consumer === "client",
    generateBundle(_options, bundle) {
      const over: string[] = [];
      for (const output of Object.values(bundle)) {
        if (output.type !== "chunk") continue;
        const kind = output.isEntry ? "entry" : "route";
        const limit = output.isEntry ? budgets.entryKb : budgets.routeKb;
        const kb = gzipSync(output.code).byteLength / 1024;
        if (kb > limit) {
          over.push(`${output.fileName}: ${kb.toFixed(1)} kB gzipped, ${kind} budget ${limit} kB`);
        }
      }
      if (over.length > 0) {
        this.error(`The bundle is over its budget (telemetry.config.ts):\n${over.join("\n")}`);
      }
    },
  };
}
