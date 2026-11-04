/**
 * Stackra file contract:
 * Purpose: `REACT_ROUTER_CONFIG_TEMPLATE`, the `react-router.config.ts` of a generated Fumadocs site: no server
 *          (`ssr: false`), every page path from `app/site.json` prerendered with the 404 page and the static search
 *          index, and the prerendered `404/index.html` moved to `404.html`, the page a Worker's `404-page` handling
 *          serves.
 * Boundary: a constant; the emitted config reads `app/site.json` and moves one file in its build folder.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (decisions 1 and 9: prerendered static files on a Worker); ADR 0284; STA-2026.
 */

/** The emitted `react-router.config.ts`. */
export const REACT_ROUTER_CONFIG_TEMPLATE = `import { readFileSync, renameSync } from "node:fs";
import { join } from "node:path";

import type { Config } from "@react-router/dev/config";

const site = JSON.parse(readFileSync(new URL("./app/site.json", import.meta.url), "utf8")) as {
  readonly paths: readonly string[];
};

export default {
  appDirectory: "app",
  ssr: false,
  prerender: [...site.paths, "/404", "/api/search"],
  buildEnd({ reactRouterConfig }) {
    const client = join(reactRouterConfig.buildDirectory, "client");
    renameSync(join(client, "404", "index.html"), join(client, "404.html"));
  },
} satisfies Config;
`;
