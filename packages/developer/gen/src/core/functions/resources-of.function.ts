/**
 * Stackra file contract:
 * Purpose: `resourcesOf(ir, actions)`, a member's `ui.resources`: each resource class under `<module>.<model>`, as its
 *          recorded tree (options, table, views, form, infolist, relations, actions) with `module`, `class` and, in a
 *          package, `from`; every class in the tree written as its locked action key when it is an action or query.
 *          A service or app also lists its hosted packages' resources, as it lists their other sections.
 * Boundary: pure. The tree is the one `readResourceTrees` read; a resource of an IR built by hand has none and is
 *           recorded by its identity alone. Refuses `resource_operation_unknown` (an operation class that is no known
 *           action or query) and `resource_duplicate` (one key from two classes).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 5 and 7); ADR 0111 (decision 3: every entry records its owning module); ADR 0109
 *                     (decision 1); ADR 0164 (decision 2); STA-1947.
 */
import type { Json } from "@stackra/contracts";

import { modelKey } from "#core/functions/model-key.function";
import { packageSpecifier } from "#core/functions/package-specifier.function";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A JSON object. */
type JsonObject = { [key: string]: Json };

/** Whether `value` is a JSON object. */
const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The `ui.resources` of `ir`, sorted by key, and the refusals found.
 *
 * @param ir - the member read by discovery, with the trees `readResourceTrees` read.
 * @param actions - the member's action and query entries (its own and its hosted packages'), each with `class` and `key`.
 * @example
 * resourcesOf(ir, actions).resources["loyalty_kit.loyalty_account"]?.["module"]; // "loyalty_kit"
 */
export function resourcesOf(
  ir: MemberIR,
  actions: readonly { readonly [key: string]: Json }[],
): { readonly resources: Readonly<Record<string, JsonObject>>; readonly errors: GenError[] } {
  const errors: GenError[] = [];
  const keys = new Map<string, string>();
  for (const entry of [
    ...actions,
    ...ir.dependencies.flatMap(({ manifest }) => manifest.actions ?? []),
    ...(ir.services ?? []).flatMap(({ manifest }) => manifest.actions ?? []),
  ]) {
    const name = entry["class"];
    if (typeof name === "string" && typeof entry["key"] === "string" && !keys.has(name))
      keys.set(name, entry["key"]);
  }
  // Every `{ $class }` in a tree becomes the action key it names, when it names one.
  const resolveClasses = (value: Json): Json => {
    if (Array.isArray(value)) return value.map(resolveClasses);
    if (!isObject(value)) return value;
    const name = value["$class"];
    if (typeof name === "string" && keys.has(name)) return keys.get(name) ?? name;
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveClasses(item)]),
    );
  };

  const resources = new Map<string, JsonObject>();
  const add = (key: string, entry: JsonObject, file: string, subject: string): void => {
    const other = resources.get(key);
    if (other === undefined) resources.set(key, entry);
    else if (other["module"] !== entry["module"] || other["class"] !== entry["class"])
      errors.push({
        code: "resource_duplicate",
        file,
        line: 0,
        column: 0,
        subject,
        message: `the resource \`${key}\` is declared by ${String(other["class"])}${typeof other["from"] === "string" ? ` (${other["from"]})` : ""} and by ${String(entry["class"])}${typeof entry["from"] === "string" ? ` (${entry["from"]})` : ""}`,
        fix: "keep one resource per model and area: remove one, or merge them",
      });
  };

  for (const declared of ir.classes) {
    if (declared.kind !== "resource" || declared.abstract === true) continue;
    if (declared.partner === undefined) continue; // the base refuses a resource without its model
    const tree = ir.resourceTrees?.[declared.file];
    const resolved = isObject(tree) ? (resolveClasses(tree) as JsonObject) : {};
    const operations = isObject(resolved["options"])
      ? resolved["options"]["operations"]
      : undefined;
    if (isObject(operations))
      for (const [operation, value] of Object.entries(operations))
        if (isObject(value))
          errors.push({
            code: "resource_operation_unknown",
            file: declared.file,
            line: 0,
            column: 0,
            subject: `${declared.name}.${operation}`,
            message: `the ${operation} operation of ${declared.name} names ${String(value["$class"])}, which is no action or query of this member or of a member it depends on`,
            fix: "name an action or query class this member declares or depends on, or `true` for the standard read gen writes",
          });
    add(
      modelKey(declared.module, declared.partner.name),
      {
        module: declared.module,
        class: declared.name,
        ...(ir.layout === "package" ? { from: packageSpecifier(ir.package, declared.file) } : {}),
        ...resolved,
      },
      declared.file,
      declared.name,
    );
  }

  // A host lists its hosted packages' resources, as it lists their actions (one entry per key when the class agrees).
  if (ir.layout !== "package")
    for (const dependency of ir.dependencies) {
      if (dependency.manifest["kind"] === "app") continue;
      const ui = dependency.manifest["ui"];
      const hosted = isObject(ui) ? ui["resources"] : undefined;
      if (!isObject(hosted)) continue;
      for (const [key, entry] of Object.entries(hosted))
        if (isObject(entry))
          add(
            key,
            {
              ...entry,
              from: typeof entry["from"] === "string" ? entry["from"] : dependency.package,
            },
            "package.json",
            dependency.package,
          );
    }

  return {
    resources: Object.fromEntries(
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      [...resources].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
    ),
    errors,
  };
}
