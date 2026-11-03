/**
 * Stackra file contract:
 * Purpose: `emitResources`, an app's `#stackra/resources` (`.stackra/gen/resources.ts`): `Resources`, the route
 *          constants of each panel resource its dependencies record (`resource(key, { base, permission, list, view,
 *          create, update })`, `permission` being the bound list action's recorded one, so navigation hides the entry
 *          from a viewer without it) of `@stackra/panel`, by the model's PascalCase name; `resourceList`, all of them for the shell's
 *          data routes (`...resourceList.flatMap(toResource)`); and `unboundOperations`, each declared page whose
 *          operation no consumed service's client exports, with the reason, so the gap is visible and testable.
 * Boundary: pure. Only for an app that hosts the panel and composes at least one recorded resource. The base is
 *           `/<module>/<models>` in kebab case. An operation binds the descriptor the app's generated client of a
 *           consumed service exports for that action or query key (`true` names the standard `list` or `get` read);
 *           an operation no consumed service owns is left out, so its page does not exist, and nothing is imported
 *           that the client files do not export. An unbound list is left out the same way (the entry's `list` is
 *           `undefined`, so `toResource` routes no empty List page), never refused: a `true` list or get waits on gen
 *           writing the standard reads (STA-1971). Two models of one name in two modules are told apart by their module.
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
 * The resources file of `ir`, or undefined when it composes none.
 *
 * @example
 * emitResources(consoleIr)?.path; // ".stackra/gen/resources.ts"
 */
export function emitResources(ir: MemberIR): GeneratedFile | undefined {
  if (ir.layout !== "app" || !usesPanel(ir)) return undefined;
  const { resources } = hostResourcesOf(ir);
  if (resources.length === 0) return undefined;
  // The declared pages each resource could not bind, with the reason (STA-1971 for the standard reads).
  const unbound: [string, Record<string, string>][] = [];

  // The descriptor each consumed service's client exports, by action or query key (a client holds only its own).
  const refs = new Map<
    string,
    { readonly service: string; readonly name: string; readonly permission?: string }
  >();
  for (const { member, manifest } of ir.services ?? [])
    for (const action of manifest.actions ?? [])
      if (action["from"] === undefined && !refs.has(action.key))
        refs.set(action.key, {
          service: member,
          name: action.class,
          ...(typeof action.permission === "string" ? { permission: action.permission } : {}),
        });

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
    const gaps: Record<string, string> = {};
    let permission: string | undefined;
    const bound = PAGES.flatMap(([page, operation]) => {
      const value = declared[operation];
      if (value === undefined || value === false) return [];
      const actionKey =
        value === true ? `${key}.${operation}@1` : typeof value === "string" ? value : undefined;
      const ref = actionKey === undefined ? undefined : refs.get(actionKey);
      if (ref === undefined) {
        gaps[page] =
          value === true
            ? `STA-1971: gen does not write the standard ${operation} read yet`
            : `no consumed service's client exports ${actionKey ?? "it"}`;
        return [];
      }
      const from = `${CLIENTS_SPECIFIER}${ref.service}`;
      imports.set(from, (imports.get(from) ?? new Map<string, boolean>()).set(ref.name, false));
      // The list page's permission gates the navigation entry (ADR 0307 rule 4); the server still enforces it.
      if (page === "list") permission = ref.permission;
      return [`${page}: ${ref.name}`];
    });
    if (Object.keys(gaps).length > 0) unbound.push([key, gaps]);
    const base = `/${kebabCase(module)}/${kebabCase(plural(model))}`;
    const call = `resource(${JSON.stringify(key)}, { base: ${JSON.stringify(base)}${permission === undefined ? "" : `, permission: ${JSON.stringify(permission)}`}${bound.map((pair) => `, ${pair}`).join("")} })`;
    // `resource()` always makes a List page; an unbound one is taken back, so no route reaches an empty list.
    return `  ${name}: ${gaps["list"] === undefined ? call : `{ ...${call}, list: undefined }`},`;
  });

  return {
    path: ".stackra/gen/resources.ts",
    content: [
      generatedHeader({
        from: "the ui.resources of the declared packages' and consumed services' manifests",
        purpose: `the panel resources ${ir.package} composes: their route constants and operation refs.`,
        boundary:
          "an operation is bound only when a consumed service's client exports it, and a page without one gets no " +
          "route; the shell spreads `resourceList.flatMap(toResource)` into its data routes.",
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
      "/** Each declared page no consumed service's client can serve, with the reason; it gets no route. */",
      "export const unboundOperations = {",
      ...unbound.map(([key, gaps]) => `  ${JSON.stringify(key)}: ${JSON.stringify(gaps)},`),
      "} as const;",
      "",
    ].join("\n"),
  };
}
