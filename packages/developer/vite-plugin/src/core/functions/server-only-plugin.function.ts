/**
 * Stackra file contract:
 * Purpose: `serverOnlyPlugin`, the Vite plugin that refuses a `.server.ts` (or `.server.tsx`, `.server.js`) import in
 *          a browser bundle: server code (secrets, the database, the Worker's bindings) never reaches the client
 *          environment, whichever path reaches it.
 * Boundary: checks the specifier in the client environment only (`consumer: "client"`); the server and SSR
 *           environments import `.server` files freely. A dependency under `node_modules` is not checked. It only
 *           refuses; it never rewrites an import.
 * Runtime: node
 * Governing contract: ADR 0297 (web on Workers: server modules stay on the Worker), ADR 0173 (no secret in a bundle).
 */
import type { Plugin } from "vite";

/** A specifier naming a server-only module, with or without its extension. */
const SERVER_MODULE = /\.server(\.[cm]?[jt]sx?)?$/;

/**
 * The plugin that keeps `.server` modules out of the browser bundle.
 *
 * @example
 * serverOnlyPlugin(); // `import { db } from "./orders.server"` in a client module fails the build
 */
export function serverOnlyPlugin(): Plugin {
  return {
    name: "stackra:server-only",
    enforce: "pre",
    resolveId(source, importer) {
      if (importer === undefined || importer.includes("/node_modules/")) return null;
      if (this.environment.config.consumer !== "client") return null;
      if (!SERVER_MODULE.test(source.split("?")[0] ?? source)) return null;
      this.error(
        `"${source}" is server-only and cannot be imported into the browser bundle (from ${importer}); ` +
          "move the shared part to a file without the `.server` suffix",
      );
    },
  };
}
