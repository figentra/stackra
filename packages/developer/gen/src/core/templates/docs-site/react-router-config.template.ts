/**
 * Stackra file contract:
 * Purpose: `REACT_ROUTER_CONFIG_TEMPLATE`, the `react-router.config.ts` of a generated Fumadocs site: no server
 *          (`ssr: false`), every page path from `app/site.json` prerendered with the 404 page and the static search
 *          index, and the prerendered `404/index.html` moved to `404.html`, the page a Worker's `404-page` handling
 *          serves. The build then fails when a listed page prerendered as the bare shell (no `<title>`): no route
 *          matched it, and the site would ship a blank page; or when a title repeats a part (the home page's own
 *          words followed by the same site name).
 * Boundary: a constant; the emitted config reads `app/site.json`, moves one file and reads the prerendered pages in its
 *           build folder.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (decisions 1 and 9: prerendered static files on a Worker); ADR 0284; STA-2026; the blank root page found in Geo's docs (2026-11-08).
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
    // Every page renders its <title>; a page without one is the bare shell, so no route matched it.
    const titles = site.paths.map((path) => ({
      path,
      title: /<title>([^<]*)<[/]title>/.exec(readFileSync(join(client, path, "index.html"), "utf8"))?.[1],
    }));
    const blank = titles.filter(({ title }) => title === undefined).map(({ path }) => path);
    if (blank.length > 0)
      throw new Error("prerendered as the bare shell, with no route for them: " + blank.join(", "));
    // A title names each part once: "Figentra Geo · Figentra Geo" is a page title that repeats the site name.
    const repeated = titles.filter(({ title = "" }) => {
      const parts = title.split(" · ");
      return new Set(parts).size !== parts.length;
    });
    if (repeated.length > 0)
      throw new Error(
        "titles repeat a part: " + repeated.map(({ path, title }) => path + " (" + title + ")").join(", "),
      );
  },
} satisfies Config;
`;
