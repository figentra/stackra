/**
 * Stackra file contract:
 * Purpose: `emitPackageRoutes`, a package's `Routes` ref table (`.stackra/gen/routes.ts`, reached as `#stackra/routes`):
 *          one `routeRef` per route its `react` or `native` entry declares, under the route's stem in snake_case, with
 *          the key its manifest records in `ui.routes` (`<module>_<stem>`, `uiRoutesOf`) and a host app registers, so the
 *          package's own pages link to its routes by ref.
 * Boundary: pure. Only a package with such routes gets the file; an app's own refs are not written here. A stem shipped
 *           by both entries is one ref, typed by the `react` class (both declare the same path and params); a class
 *           name two stems share is imported under an alias.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: derived identities, route refs); ADR 0111 (decisions 3 and 4); STA-1947.
 */

import { entryOf } from "#core/functions/entry-of.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import { importLines } from "#core/functions/import-lines.function";
import { routeKey } from "#core/functions/route-key.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The `Routes` ref table of a package, or nothing when it ships no route.
 *
 * @example
 * emitPackageRoutes(storefrontIr)[0]?.path; // ".stackra/gen/routes.ts"
 */
export function emitPackageRoutes(ir: MemberIR): GeneratedFile[] {
  if (ir.layout !== "package") return [];
  // The react class first, so a stem both entries ship is typed by it.
  const routes = ir.classes
    .filter((declared) => declared.kind === "route")
    .map((declared) => ({ declared, entry: entryOf(declared.file) }))
    .filter(({ entry }) => entry === "react" || entry === "native")
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    .sort((a, b) => (a.entry === b.entry ? 0 : a.entry === "react" ? -1 : 1));
  if (routes.length === 0) return [];
  const imports = new Map<string, Map<string, boolean>>([
    ["@stackra/navigation", new Map([["routeRef", false]])],
  ]);
  const taken = new Set<string>();
  const rows = new Map<string, string>();
  for (const { declared } of routes) {
    const name = routeKey(declared.file);
    if (rows.has(name)) continue;
    const local = taken.has(declared.name) ? `${declared.name}${taken.size}` : declared.name;
    taken.add(local);
    imports.set(
      declared.importPath,
      (imports.get(declared.importPath) ?? new Map<string, boolean>()).set(
        local === declared.name ? declared.name : `${declared.name} as ${local}`,
        true,
      ),
    );
    // The key `uiRoutesOf` records: `<module>_<stem>`.
    const key = `${declared.module}_${name}`;
    rows.set(name, `  ${name}: routeRef<typeof ${local}>(${JSON.stringify(key)}),`);
  }
  const header = generatedHeader({
    from: "the Route classes of the react and native entries",
    purpose: `the route refs of ${ir.package}: each route stem with the key its host app registers.`,
    boundary:
      "a ref names a route by key and loads no route module; the host app's route table registers the key, so a ref " +
      "resolves there.",
    runtime: "isomorphic",
  });
  return [
    {
      path: ".stackra/gen/routes.ts",
      content: [
        header,
        ...importLines(imports),
        "",
        "/** Each route this package ships, by stem: the ref its pages link with. */",
        "export const Routes = Object.freeze({",
        // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
        ...[...rows.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([, row]) => row),
        "});",
        "",
      ].join("\n"),
    },
  ];
}
