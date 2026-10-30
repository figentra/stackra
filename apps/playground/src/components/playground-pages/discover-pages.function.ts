/**
 * Stackra file contract:
 * Purpose: `discoverPages`, which finds the playground's pages from the route folders, so a new component is one
 *          folder and nothing else: every `routes/<name>/<name>.route.ts` whose path names a `@stackra/showcase`
 *          entry (`byWebPath`) is paired with its page `routes/<name>/<name>.tsx`, checked (path is `/<name>`, the
 *          page exists) and ordered as the registry orders entries (category, then tier, then slug). The
 *          router, the index and the shell's navigation all draw from the result.
 * Boundary: discovery and validation only; `PLAYGROUND_PAGES` (`playground-pages.ts`) holds the one `import.meta.glob`
 *           of the app, and `discoverPages` takes plain module records so a test can feed it without Vite. A route
 *           whose path is no entry (the index, the components index, the Theme Studio) is not a listed page.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0294 (decision 14, rule R7 as amended by the showcase redesign spec
 *          section 2.2); ADR 0295 (decision 7).
 */
import { kindOf } from "@stackra/container";
import { byWebPath, compareEntries, COMPONENTS, type ComponentEntry } from "@stackra/showcase";
import { createElement, type ReactElement } from "react";

import { routePath } from "#src/components/playground-pages/route-path.function";
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

/** The route class a route module exports, as a link, when its path names a registry entry. */
function routeOf(exports: ModuleExports, entries: readonly ComponentEntry[]): PageLink | undefined {
  for (const value of Object.values(exports)) {
    if (typeof value !== "function" || kindOf(value)?.kind !== "route") continue;
    const path = routePath(value);
    const entry = byWebPath(path, entries);
    if (!entry) return undefined;
    const { ownsMain } = value as unknown as Record<string, unknown>;
    return { path, entry, ...(ownsMain === true && { ownsMain }) };
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
 * Pairs each route module whose path names a registry entry with its page module and returns the pages in registry
 * order.
 *
 * @param routes route modules by file path, `routes/<name>/<name>.route.ts`
 * @param pages page modules by file path, `routes/<name>/<name>.tsx`
 * @param entries the registry to pair against; the real one by default
 * @throws when a route's path is not `/<folder>` or its page is missing
 */
export function discoverPages(
  routes: Readonly<Record<string, ModuleExports>>,
  pages: Readonly<Record<string, ModuleExports>>,
  entries: readonly ComponentEntry[] = COMPONENTS,
): readonly DiscoveredPage[] {
  const pageByFolder = byFolder(pages, PAGE_FILE);
  const found: DiscoveredPage[] = [];
  for (const [folder, exports] of byFolder(routes, ROUTE_FILE)) {
    const route = routeOf(exports, entries);
    if (!route) continue; // no entry at this path: the index, the components index, the Theme Studio
    if (route.path !== `/${folder}`)
      throw new Error(`routes/${folder}: the path must be "/${folder}", not "${route.path}"`);
    const component = componentOf(pageByFolder.get(folder) ?? {});
    if (!component) throw new Error(`routes/${folder}: no page component in ${folder}.tsx`);
    found.push({ route, element: createElement(component) });
  }
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return found.sort((a, b) => compareEntries(a.route.entry, b.route.entry));
}
