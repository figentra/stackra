/**
 * Stackra file contract:
 * Purpose: `emitResources`, an app's `#stackra/resources` (`.stackra/gen/resources.ts`): `Resources`, the route
 *          constants of each panel resource its dependencies record (`resource(key, { base, list, view, create,
 *          update })` of `@stackra/panel`, by the model's PascalCase name), and `resourceList`, all of them for the
 *          shell's data routes (`...resourceList.flatMap(toResource)`).
 * Boundary: pure. Only for an app that hosts the panel and composes at least one recorded resource. The base is
 *           `/<module>/<models>` in kebab case. An operation binds the descriptor the app's generated client of a
 *           consumed service exports for that action or query key (`true` names the standard `list` or `get` read);
 *           an operation no consumed service owns is left out, so its page does not exist, and nothing is imported
 *           that the client files do not export; a list operation none owns is refused (`resource_list_unbound`), since
 *           its List page would render empty (STA-1971 tracks the standard reads gen does not write yet). Two models of one name in two modules are told apart by their module.
 * Runtime: isomorphic
 * Governing contract: ADR 0164 (decisions 1 and 2); ADR 0307 (rule 5; owner decision R-56, generated route keys);
 *                     ADR 0260 (clients from the producer's manifest); STA-1947.
 */
import { kebabCase, pascalCase } from "@stackra/support";

import { CLIENTS_SPECIFIER } from "#core/constants/clients-specifier.constant";
import { generatedHeader } from "#core/functions/generated-header.function";
import { hostResourcesOf } from "#core/functions/host-resources-of.function";
import { importLines } from "#core/functions/import-lines.function";
import { plural } from "#core/functions/plural.function";
import { usesPanel } from "#core/functions/uses-panel.function";
import type { GenError } from "#core/types/gen-error.type";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The page options of `resource()` and the operation each one reads. */
const PAGES = [
  ["list", "list"],
  ["view", "get"],
  ["create", "create"],
  ["update", "update"],
] as const;

/**
 * The resources file of `ir` (absent when it composes none), and `resource_list_unbound` for a resource whose list
 * operation no consumed service's client exports.
 *
 * @example
 * emitResources(consoleIr).file?.path; // ".stackra/gen/resources.ts"
 */
export function emitResources(ir: MemberIR): {
  readonly file?: GeneratedFile;
  readonly errors: readonly GenError[];
} {
  if (ir.layout !== "app" || !usesPanel(ir)) return { errors: [] };
  const { resources } = hostResourcesOf(ir);
  if (resources.length === 0) return { errors: [] };
  const errors: GenError[] = [];

  // The descriptor each consumed service's client exports, by action or query key (a client holds only its own).
  const refs = new Map<string, { readonly service: string; readonly name: string }>();
  for (const { member, manifest } of ir.services ?? [])
    for (const action of manifest.actions ?? [])
      if (action["from"] === undefined && !refs.has(action.key))
        refs.set(action.key, { service: member, name: action.class });

  const models = resources.map(({ key }) => key.slice(key.indexOf(".") + 1));
  const imports = new Map<string, Map<string, boolean>>([
    ["@stackra/panel", new Map([["resource", false]])],
  ]);
  const rows = resources.map(({ key, entry }, index) => {
    const module = key.slice(0, key.indexOf("."));
    const model = models[index] ?? "";
    const name =
      models.filter((other) => other === model).length > 1
        ? pascalCase(`${module}_${model}`)
        : pascalCase(model);
    const options = entry["options"];
    const operations =
      typeof options === "object" && options !== null && !Array.isArray(options)
        ? (options as Record<string, unknown>)["operations"]
        : undefined;
    const declared =
      typeof operations === "object" && operations !== null
        ? (operations as Record<string, unknown>)
        : {};
    const bound = PAGES.flatMap(([page, operation]) => {
      const value = declared[operation];
      const actionKey =
        value === true ? `${key}.${operation}@1` : typeof value === "string" ? value : undefined;
      const ref = actionKey === undefined ? undefined : refs.get(actionKey);
      // The List page is the resource's route: without its query it would render empty, so it is refused. Another
      // page without its operation is left out, so no route reaches it.
      if (ref === undefined && page === "list")
        errors.push({
          code: "resource_list_unbound",
          file: "package.json",
          line: 0,
          column: 0,
          subject: key,
          message: `the resource \`${key}\` lists through ${actionKey === undefined ? "no query" : `\`${actionKey}\``}, which no service this app consumes exports${value === true ? " (gen does not write the standard list read yet, STA-1971)" : ""}`,
          fix: "consume the service that owns the list query (import from #stackra/clients/<service>), or name a query it exports in the resource's `operations.list`",
        });
      if (ref === undefined) return [];
      const from = `${CLIENTS_SPECIFIER}${ref.service}`;
      imports.set(from, (imports.get(from) ?? new Map<string, boolean>()).set(ref.name, false));
      return [`${page}: ${ref.name}`];
    });
    const base = `/${kebabCase(module)}/${kebabCase(plural(model))}`;
    return `  ${name}: resource(${JSON.stringify(key)}, { base: ${JSON.stringify(base)}${bound.map((pair) => `, ${pair}`).join("")} }),`;
  });

  if (errors.length > 0) return { errors };
  const file: GeneratedFile = {
    path: ".stackra/gen/resources.ts",
    content: [
      generatedHeader({
        from: "the ui.resources of the declared packages' and consumed services' manifests",
        purpose: `the panel resources ${ir.package} composes: their route constants and operation refs.`,
        boundary:
          "an operation is bound only when a consumed service's client exports it; the shell spreads " +
          "`resourceList.flatMap(toResource)` into its data routes.",
        runtime: "isomorphic",
      }),
      ...importLines(imports),
      "",
      "/** The route constants of each composed resource, by its model's name. */",
      "export const Resources = {",
      ...rows,
      "} as const;",
      "",
      "/** Every composed resource, for the shell's data routes. */",
      "export const resourceList = Object.values(Resources);",
      "",
    ].join("\n"),
  };
  return { file, errors };
}
