/**
 * Stackra file contract:
 * Purpose: `emitRoutes`, an app's route table per client runtime (`.stackra/gen/routes/<runtime>.ts`, reached as
 *          `#stackra/routes/<runtime>`): each `Route({...})` class under its key (the snake_case of its file stem)
 *          with the page that draws it on that runtime, and the `registerRoutes(routeTable)` call that makes every
 *          `Routes.<key>` ref resolve to its path.
 * Boundary: pure. A page is bound by name beside its route (`settings.tsx`, `settings.native.tsx`); a route without a
 *           page on a runtime is still registered, so refs resolve. The data-route tree (`toRoot`) is not here: it
 *           needs the locale prefixes of `#stackra/i18n` and the router keys the booted container makes.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 14, 20 and 22); ADR 0297 (decision 4); the navigation package's
 *                     `registerRoutes`.
 */
import { clientRuntimes } from "#core/functions/client-runtimes.function";
import { componentBeside } from "#core/functions/component-beside.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import { importLines } from "#core/functions/import-lines.function";
import { snakeCase } from "#core/functions/snake-case.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The route tables of an app, one per client runtime.
 *
 * @example
 * emitRoutes(appIr).map((file) => file.path); // [".stackra/gen/routes/browser.ts", ".stackra/gen/routes/native.ts"]
 */
export function emitRoutes(ir: MemberIR): GeneratedFile[] {
  const routes = ir.classes.filter((declared) => declared.kind === "route");
  if (routes.length === 0) return [];
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
        `  ${snakeCase(stem)}: { route: ${route.name}${page !== undefined ? `, page: ${page.name}` : ""} },`,
      );
    }
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
        "",
      ].join("\n"),
    };
  });
}
