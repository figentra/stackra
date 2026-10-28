/**
 * Stackra file contract:
 * Purpose: `emitRoutes`, an app's route table per client runtime (`.stackra/gen/routes/<runtime>.ts`, reached as
 *          `#stackra/routes/<runtime>`): each `Route({...})` class under its key (the snake_case of its file stem)
 *          with the page that draws it on that runtime, and the `registerRoutes(routeTable)` call that makes every
 *          `Routes.<key>` ref resolve to its path; on the browser of an app that hosts `@stackra/panel`, the
 *          `registerPanelPages()` call that gives navigation the panel's shell page, and `registerResources({...})` with
 *          the recorded resource trees of the declared packages' and services' manifests (`ui.resources`, by
 *          `<module>.<model>`) plus `resourceLabelKeys`, the label keys those resource pages derive, for the catalogues.
 * Boundary: pure. A tree is manifest JSON, handed to `registerResources` as is (the first manifest that records a key
 *           wins); a resource with no tree still gets every page from the data. A page is bound by name beside its route (`settings.tsx`, `settings.native.tsx`); a route without a
 *           page on a runtime is still registered, so refs resolve. The data-route tree (`toRoot`) is not here: it
 *           needs the locale prefixes of `#stackra/i18n` and the router keys the booted container makes.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 14, 20 and 22); ADR 0297 (decision 4); the navigation package's
 *                     `registerRoutes`; ADR 0307 (the panel's route pages; rule 6: derived labels); STA-1385.
 */
import { clientRuntimes } from "#core/functions/client-runtimes.function";
import { componentBeside } from "#core/functions/component-beside.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import { importLines } from "#core/functions/import-lines.function";
import { resourceLabelKeys } from "#core/functions/resource-label-keys.function";
import { routeKey } from "#core/functions/route-key.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The recorded resource trees of the declared members' manifests (`ui.resources`), sorted by key. */
function resourceTrees(ir: MemberIR): [string, unknown][] {
  const trees = new Map<string, unknown>();
  for (const { manifest } of ir.dependencies) {
    const ui = manifest["ui"];
    const resources =
      typeof ui === "object" && ui !== null && !Array.isArray(ui)
        ? (ui as Record<string, unknown>)["resources"]
        : undefined;
    if (typeof resources !== "object" || resources === null || Array.isArray(resources)) continue;
    for (const [key, tree] of Object.entries(resources)) if (!trees.has(key)) trees.set(key, tree);
  }
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return [...trees].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * The route tables of an app, one per client runtime.
 *
 * @example
 * emitRoutes(appIr).map((file) => file.path); // [".stackra/gen/routes/browser.ts", ".stackra/gen/routes/native.ts"]
 */
export function emitRoutes(ir: MemberIR): GeneratedFile[] {
  const routes = ir.classes.filter((declared) => declared.kind === "route");
  if (routes.length === 0) return [];
  const usesPanel =
    (ir.packages ?? []).includes("@stackra/panel") ||
    ir.dependencies.some((dependency) => dependency.package === "@stackra/panel");
  return clientRuntimes(ir).map((runtime) => {
    const imports = new Map<string, Map<string, boolean>>([
      ["@stackra/navigation", new Map([["registerRoutes", false]])],
    ]);
    const use = (from: string, name: string): void => {
      imports.set(from, (imports.get(from) ?? new Map<string, boolean>()).set(name, false));
    };
    const rows: string[] = [];
    for (const route of routes) {
      const stem = (route.file.split("/").pop() ?? "").replace(/\.route\.tsx?$/, "");
      const page = componentBeside(ir, route.file, stem, runtime);
      use(route.importPath, route.name);
      if (page !== undefined) use(page.from, page.name);
      rows.push(
        `  ${routeKey(route.file)}: { route: ${route.name}${page !== undefined ? `, page: ${page.name}` : ""} },`,
      );
    }
    // The panel's shell is the page `toPanel` renders; an app that hosts the panel registers it on the browser.
    const panel = runtime === "browser" && usesPanel;
    if (panel) use("@stackra/panel/react", "registerPanelPages");
    const trees = panel ? resourceTrees(ir) : [];
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
        ...resources,
        "",
      ].join("\n"),
    };
  });
}
