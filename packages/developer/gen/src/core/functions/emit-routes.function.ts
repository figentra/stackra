/**
 * Stackra file contract:
 * Purpose: `emitRoutes`, the bare `.stackra/gen/routes.ts` (`#stackra/routes`: `Routes`, one `routeRef` per route key
 *          across the runtimes, and `RouteKey`; each class a type-only import) and an app's route table per client
 *          runtime (`.stackra/gen/routes/<runtime>.ts`, reached as
 *          `#stackra/routes/<runtime>`): each `Route({...})` class under its key (the snake_case of its file stem)
 *          with the page that draws it on that runtime and its `title` (the derived `<module>::routes.<name>.title` for a route that
 *          writes none, or the one a package records), and the `registerRoutes(routeTable)` call that makes every
 *          `Routes.<key>` ref resolve to its path; on the browser of an app that hosts `@stackra/panel`, the
 *          `registerPanelPages()` call that gives navigation the panel's shell page; and on every runtime of such an
 *          app, `registerResources({...})` with the recorded resource trees of its declared packages' and consumed
 *          services' manifests (`ui.resources` by `<module>.<model>`, `hostResourcesOf`) plus `resourceLabelKeys`, the
 *          label keys those resource pages derive, for the catalogues. The routes and menus its declared packages ship
 *          in the entry that serves the runtime (`react` for the browser, `native` for native; `ui.routes` and
 *          `ui.menus`, `hostRoutesOf`) join its own, imported from `<package>/<entry>`, and every menu is registered
 *          under its key (`menuTable`, `registerMenus`), so no app hand-writes a `register()`.
 * Boundary: only an app gets route tables. A dependency's class whose name the file already uses is imported under
 *           its module's name. A tree is manifest JSON, handed to `registerResources` as is (one key from two classes is refused by
 *           `hostResourcesOf`); a resource with no tree still gets every page from the data. A page is bound by name beside its route (`settings.tsx`, `settings.native.tsx`); a route without a
 *           page on a runtime is still registered, so refs resolve. The data-route tree (`toRoot`) is not here: it
 *           needs the locale prefixes of `#stackra/i18n` and the router keys the booted container makes.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 14, 20 and 22); ADR 0297 (decision 4); the navigation package's
 *                     `registerRoutes`; ADR 0307 (the panel's route pages; rule 6: derived labels); STA-1385; ADR 0164
 *                     (decision 2: web and native); ADR 0111 (decisions 1, 3 and 4); STA-1947.
 */
import { pascalCase, snakeCase } from "@stackra/support";

import { clientRuntimes } from "#core/functions/client-runtimes.function";
import { componentBeside } from "#core/functions/component-beside.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import { hostResourcesOf } from "#core/functions/host-resources-of.function";
import { hostRoutesOf } from "#core/functions/host-routes-of.function";
import { importLines } from "#core/functions/import-lines.function";
import { resourceLabelKeys } from "#core/functions/resource-label-keys.function";
import { routeKey } from "#core/functions/route-key.function";
import { routeTitleKey } from "#core/functions/route-title-key.function";
import { usesPanel } from "#core/functions/uses-panel.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The route tables of an app, one per client runtime, and the bare `#stackra/routes` when it has a route.
 *
 * @example
 * emitRoutes(appIr).map((file) => file.path);
 * // [".stackra/gen/routes/browser.ts", ".stackra/gen/routes/native.ts", ".stackra/gen/routes.ts"]
 */
export function emitRoutes(ir: MemberIR): GeneratedFile[] {
  if (ir.layout !== "app") return [];
  const routes = ir.classes.filter((declared) => declared.kind === "route");
  const menus = ir.classes.filter((declared) => declared.kind === "menu");
  const host = hostRoutesOf(ir);
  if (
    routes.length === 0 &&
    host.routes.length === 0 &&
    menus.length === 0 &&
    host.menus.length === 0
  )
    return [];
  const hostsPanel = usesPanel(ir);
  // Every route key across the runtimes, with the class and where it comes from, for the bare `#stackra/routes`.
  const refs = new Map<
    string,
    { readonly name: string; readonly from: string; readonly module?: string | undefined }
  >();
  const tables = clientRuntimes(ir).map((runtime) => {
    const imports = new Map<string, Map<string, boolean>>([
      ["@stackra/navigation", new Map([["registerRoutes", false]])],
    ]);
    const use = (from: string, name: string): void => {
      imports.set(from, (imports.get(from) ?? new Map<string, boolean>()).set(name, false));
    };
    // A dependency's class keeps its name unless the file already uses it; then it is imported under its module's.
    const taken = new Set<string>();
    const useAs = (from: string, name: string, module: string | undefined): string => {
      const local = taken.has(name) ? `${pascalCase(module ?? from)}${name}` : name;
      taken.add(local);
      use(from, local === name ? name : `${name} as ${local}`);
      return local;
    };
    const rows: string[] = [];
    for (const route of routes) {
      const stem = (route.file.split("/").pop() ?? "").replace(/\.route\.tsx?$/, "");
      const page = componentBeside(ir, route.file, stem, runtime);
      use(route.importPath, route.name);
      taken.add(route.name);
      if (page !== undefined) {
        use(page.from, page.name);
        taken.add(page.name);
      }
      const key = routeKey(route.file);
      if (!refs.has(key)) refs.set(key, { name: route.name, from: route.importPath });
      // A route that writes no title gets the derived key, so menus never show the raw route key (STA-2058).
      const title =
        route.options["title"] === undefined ? routeTitleKey(route.module, route.file) : undefined;
      rows.push(
        `  ${key}: { route: ${route.name}${page !== undefined ? `, page: ${page.name}` : ""}${title === undefined ? "" : `, title: ${JSON.stringify(title)}`} },`,
      );
    }
    // The routes and menus the dependencies ship in the entry that serves this runtime (ADR 0111 decision 4).
    const uiEntry = runtime === "browser" ? "react" : "native";
    for (const { entry: route, from } of host.routes) {
      if (route.entry !== uiEntry) continue;
      const specifier = `${from}/${uiEntry}`;
      const name = useAs(specifier, route.class, route.module);
      const page =
        route.page === undefined ? undefined : useAs(specifier, route.page, route.module);
      if (!refs.has(route.key))
        refs.set(route.key, { name: route.class, from: specifier, module: route.module });
      rows.push(
        `  ${route.key}: { route: ${name}${page === undefined ? "" : `, page: ${page}`}${route.title === undefined ? "" : `, title: ${JSON.stringify(route.title)}`} },`,
      );
    }
    const menuRows: string[] = [];
    for (const menu of menus) {
      use(menu.importPath, menu.name);
      taken.add(menu.name);
      menuRows.push(
        `  ${snakeCase((menu.file.split("/").pop() ?? "").replace(/\.menu\.tsx?$/, ""))}: ${menu.name},`,
      );
    }
    for (const { entry: menu, from } of host.menus)
      if (menu.entry === uiEntry)
        menuRows.push(`  ${menu.key}: ${useAs(`${from}/${uiEntry}`, menu.class, menu.module)},`);
    if (menuRows.length > 0) use("@stackra/navigation", "registerMenus");
    // The panel's shell is the page `toPanel` renders, so only the browser registers it; the recorded trees are
    // registered on every runtime of a panel host (ADR 0164 decision 2), native's pages drawing them once they exist.
    const panel = runtime === "browser" && hostsPanel;
    if (panel) use("@stackra/panel/react", "registerPanelPages");
    const trees = hostsPanel
      ? hostResourcesOf(ir).resources.map(({ key, entry }): [string, unknown] => [key, entry])
      : [];
    if (trees.length > 0) use("@stackra/panel", "registerResources");
    const resources =
      trees.length === 0
        ? []
        : [
            "",
            "/** The recorded resource trees by `<module>.<model>`, manifest JSON from `ui.resources`. */",
            "const resourceTrees = {",
            ...trees.map(([key, tree]) => `  ${JSON.stringify(key)}: ${JSON.stringify(tree)},`),
            // shortcut: the manifest holds JSON, not the typed builder nodes; a typed emit waits for gen to record trees.
            "} as unknown as Parameters<typeof registerResources>[0];",
            "",
            "registerResources(resourceTrees);",
            "",
            "/** The label keys the resource pages derive (ADR 0307 rule 6); each must be in the catalogues. */",
            "export const resourceLabelKeys = [",
            ...[...new Set(trees.flatMap(([key, tree]) => resourceLabelKeys(key, tree)))]
              // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
              .sort()
              .map((label) => `  ${JSON.stringify(label)},`),
            "] as const;",
          ];
    const header = generatedHeader({
      from: "the Route classes under src/routes and the pages beside them",
      purpose: `the ${runtime} route table of ${ir.package}: each route key with its class and its page, registered.`,
      boundary:
        "a route key is its file stem in snake_case and is locked once published; loading this file registers the " +
        "table, so every `Routes.<key>` ref resolves.",
      runtime: "isomorphic",
    });
    return {
      path: `.stackra/gen/routes/${runtime}.ts`,
      content: [
        header,
        ...importLines(imports),
        "",
        "/** Each route key with its class and its page on this runtime. */",
        "export const routeTable = {",
        ...rows,
        "} as const;",
        "",
        "registerRoutes(routeTable);",
        ...(panel ? ["registerPanelPages();"] : []),
        ...(menuRows.length === 0
          ? []
          : [
              "",
              "/** Each menu key with its class: the app's own and those its packages ship (`useMenus` lists them). */",
              "export const menuTable = {",
              ...menuRows,
              "} as const;",
              "",
              "registerMenus(menuTable);",
            ]),
        ...resources,
        "",
      ].join("\n"),
    };
  });

  // An app with menus but no route has no ref to write.
  if (refs.size === 0) return tables;
  // The bare module: runtime-free, so a ref never loads a route; each class is a type argument only, imported as a type.
  const bareImports = new Map<string, Map<string, boolean>>([
    ["@stackra/navigation", new Map([["routeRef", false]])],
  ]);
  const used = new Set<string>();
  const bareRows = [...refs.entries()].map(([key, { name, from, module }]) => {
    const local = used.has(name) ? `${pascalCase(module ?? from)}${name}` : name;
    used.add(local);
    const names = bareImports.get(from) ?? new Map<string, boolean>();
    bareImports.set(from, names.set(local === name ? name : `${name} as ${local}`, true));
    return `  ${key}: routeRef<typeof ${local}>(${JSON.stringify(key)}),`;
  });
  const bare: GeneratedFile = {
    path: ".stackra/gen/routes.ts",
    content: [
      generatedHeader({
        from: "the Route classes under src/routes and the routes its packages ship",
        purpose: `the typed route refs of ${ir.package}: \`Routes\` by route key and \`RouteKey\`.`,
        boundary:
          "a ref is data; the route class is a type argument only, so importing this file loads no route module. " +
          "The path resolves once the runtime table registers.",
        runtime: "isomorphic",
      }),
      ...importLines(bareImports),
      "",
      "/** Each route key with its typed ref. */",
      "export const Routes = {",
      ...bareRows,
      "} as const;",
      "",
      "/** A key of `Routes`. */",
      "export type RouteKey = keyof typeof Routes;",
      "",
    ].join("\n"),
  };
  return [...tables, bare];
}
