/**
 * Stackra file contract:
 * Purpose: `discoverPages`, which finds the playground's pages from the route folders, so a new component is one
 *          folder and nothing else: every `routes/<name>/<name>.route.ts` that names a category is paired with its
 *          page `routes/<name>/<name>.tsx`, checked (path is `/<name>`, category is a known one, the page exists) and
 *          ordered by category, then Free before Pro (`page-tier`), then by title. The router, the index page and the
 *          shell's navigation all draw from the result.
 * Boundary: discovery and validation only; `PLAYGROUND_PAGES` (`playground-pages.ts`) holds the one `import.meta.glob`
 *           of the app, and `discoverPages` takes plain module records so a test can feed it without Vite. A route
 *           with no category (the index route) is not a listed page and is skipped here.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0294 (decision 14, rule R7); ADR 0295 (decision 7).
 */
import { createElement, type ReactElement } from "react";

import { tierOf } from "#src/components/playground-pages/tier-of.function";
import { PageCategory } from "#src/enums/page-category.enum";
import type { PageLink } from "#src/types/page-link.type";
import type { ModuleExports } from "#src/components/playground-pages/module-exports.type";
import type { DiscoveredPage } from "#src/components/playground-pages/discovered-page.type";

// The folder name written twice (`avatar/avatar.route.ts`) is the pairing rule; the backreference enforces it.
const ROUTE_FILE = /\/([^/]+)\/\1\.route\.ts$/;
const PAGE_FILE = /\/([^/]+)\/\1\.tsx$/;

/** Folder name to module, for every file of `files` that follows `pattern`. */
function byFolder(files: Readonly<Record<string, ModuleExports>>, pattern: RegExp) {
  const folders = new Map<string, ModuleExports>();
  for (const [file, exports] of Object.entries(files)) {
    const folder = pattern.exec(file)?.[1];
    if (folder) folders.set(folder, exports);
  }
  return folders;
}

/**
 * The route class a route module exports: the one export that carries a string `path`, `title` and `category`, and
 * `ownsMain` when it is `true`.
 */
function routeOf(exports: ModuleExports): PageLink | undefined {
  for (const value of Object.values(exports)) {
    if (typeof value !== "function") continue;
    const { path, title, category, ownsMain } = value as unknown as Record<string, unknown>;
    if (typeof path === "string" && typeof title === "string" && typeof category === "string")
      return {
        path,
        title,
        category: category as PageCategory,
        ...(ownsMain === true && { ownsMain }),
      };
  }
  return undefined;
}

/** The page component a page module exports: its first function export. */
function componentOf(exports: ModuleExports) {
  return Object.values(exports).find((value) => typeof value === "function") as
    | (() => ReactElement | null)
    | undefined;
}

/**
 * Pairs each route module that names a category with its page module and returns the pages in navigation order.
 *
 * @param routes route modules by file path, `routes/<name>/<name>.route.ts`
 * @param pages page modules by file path, `routes/<name>/<name>.tsx`
 * @throws when a route's path is not `/<folder>`, its category is unknown or its page is missing
 */
export function discoverPages(
  routes: Readonly<Record<string, ModuleExports>>,
  pages: Readonly<Record<string, ModuleExports>>,
): readonly DiscoveredPage[] {
  const pageByFolder = byFolder(pages, PAGE_FILE);
  const found: DiscoveredPage[] = [];
  for (const [folder, exports] of byFolder(routes, ROUTE_FILE)) {
    const route = routeOf(exports);
    if (!route) continue; // the index route names no category: it is not a listed page
    if (route.path !== `/${folder}`)
      throw new Error(`routes/${folder}: the path must be "/${folder}", not "${route.path}"`);
    if (!PageCategory.includes(route.category))
      throw new Error(`routes/${folder}: "${route.category}" is not a page category`);
    const component = componentOf(pageByFolder.get(folder) ?? {});
    if (!component) throw new Error(`routes/${folder}: no page component in ${folder}.tsx`);
    found.push({ route, element: createElement(component) });
  }
  return found.sort(
    (a, b) =>
      PageCategory.indexOf(a.route.category) - PageCategory.indexOf(b.route.category) ||
      Number(tierOf(a.route.path) === "Pro") - Number(tierOf(b.route.path) === "Pro") ||
      a.route.title.localeCompare(b.route.title, "en"),
  );
}
