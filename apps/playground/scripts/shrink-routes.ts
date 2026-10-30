/**
 * Stackra file contract:
 * Purpose: `shrink-routes`, the codemod that turns a playground route folder into the registry-driven shape: the route
 *          class keeps `path` (and `ownsMain`) and loses its `title` and `category` statics, and the page becomes
 *          `export default () => <ComponentPage tier slug />`. The old page's tests go with the page (the demos and
 *          `ComponentPage` carry their own); its keys constant and catalogues stay for the demos to reuse.
 * Boundary: a one-off tool: `node apps/playground/scripts/shrink-routes.ts button tabs` (folder names) or `--all`. It
 *           never writes demos: WP6 extracts each `PageSection` into `demos/<tier>/<slug>/<id>.tsx` by hand.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) sections 2.2 and 4 (WP5).
 */
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { pageSource } from "./page-source.function";
import { shrinkRouteSource } from "./shrink-route-source.function";

const ROUTES = join(dirname(fileURLToPath(import.meta.url)), "../src/routes");

/** The folders that are not component routes. */
const SHELL_ROUTES = new Set(["home", "theme-studio", "components"]);

/** Shrinks one route folder in place. */
function shrink(folder: string): void {
  const dir = join(ROUTES, folder);
  const routeFile = join(dir, `${folder}.route.ts`);
  const pageFile = join(dir, `${folder}.tsx`);
  if (!existsSync(routeFile) || !existsSync(pageFile))
    throw new Error(`routes/${folder}: not a route folder`);
  writeFileSync(routeFile, shrinkRouteSource(readFileSync(routeFile, "utf8")));
  writeFileSync(pageFile, pageSource(folder));
  rmSync(join(dir, "__tests__"), { recursive: true, force: true });
  console.log(`shrunk routes/${folder}`);
}

const args = process.argv.slice(2);
const folders = args.includes("--all")
  ? readdirSync(ROUTES).filter((folder) => !SHELL_ROUTES.has(folder))
  : args;
if (folders.length === 0) throw new Error("usage: shrink-routes.ts <folder>... | --all");
for (const folder of folders) shrink(folder);
