/**
 * Stackra file contract:
 * Purpose: `checkTableIndexes`, the resource-table index refusals of ADR 0307 rule 2: `sort_not_indexed` (a sortable
 *          column, the default sort or a tiebreak key on a path no index leads with) and `filter_not_indexed` (a
 *          declared filter on such a path). An own model's indexed paths are the primary key and public id, the
 *          leading property of each `@Index`, and every `@Searchable` filter, read through its own base models too.
 * Boundary: pure; reads `ir.classes`, `ir.shapes` and the recorded resource trees under the committed manifest's
 *           `ui.resources` (by `<module>.<model>`), which the resource-recording step writes; with no recorded tree
 *           there is nothing to check. A table key is a model path (ADR 0307 rule 1, until gen writes `ListRows`); a
 *           path through a relation is not judged here, nor is the trashed filter. An index's method is not read, so a
 *           `contains` filter passes on any index that leads with its path (a pg_trgm GIN index serves it best).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 2: a sortable or filterable key needs an index; Enforcement); ADR 0294 (decision
 *                     22: a refusal carries its fix); reporting gap 5.
 */
import type { StackraManifest } from "@stackra/contracts";

import { modelKey } from "#core/functions/model-key.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The paths every model reads by index: its primary key and its public id. */
const ALWAYS_INDEXED = ["id", "publicId"];

/** The part of a recorded table this check reads. */
interface RecordedTable {
  readonly columns?: readonly { readonly key?: unknown; readonly sortable?: unknown }[];
  readonly filters?: readonly { readonly kind?: unknown; readonly key?: unknown }[];
  readonly defaultSort?: { readonly key?: unknown };
  readonly thenSort?: readonly { readonly key?: unknown }[];
}

/** `value` as a plain object, or undefined. */
function objectOf(value: unknown): Readonly<Record<string, unknown>> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}

/**
 * The index refusals of `ir`'s recorded resource tables.
 *
 * @param ir - the member read by discovery.
 * @param previous - the committed manifest, whose `ui.resources` holds the recorded trees.
 * @example
 * checkTableIndexes(ir, committed).map((refusal) => refusal.subject); // ["orders.order.table.sort.total"]
 */
export function checkTableIndexes(ir: MemberIR, previous?: StackraManifest): GenError[] {
  const resources = objectOf(objectOf(previous?.["ui"])?.["resources"]);
  if (resources === undefined) return [];
  const models = new Map(
    ir.classes
      .filter((declared) => declared.kind === "model")
      .map((declared) => [declared.name, declared]),
  );
  const shapes = new Map(ir.shapes.map((shape) => [shape.name, shape]));

  /** The model and its own base models, nearest first. */
  const chainOf = (model: DeclaredClass): DeclaredClass[] => {
    const chain: DeclaredClass[] = [];
    let at: DeclaredClass | undefined = model;
    while (at !== undefined && !chain.includes(at)) {
      chain.push(at);
      at = at.base?.own === true ? models.get(at.base.name) : undefined;
    }
    return chain;
  };

  const errors: GenError[] = [];
  for (const model of models.values()) {
    const key = modelKey(model.module, model.name);
    const table = objectOf(objectOf(resources[key])?.["table"]) as RecordedTable | undefined;
    if (table === undefined) continue;
    const chain = chainOf(model);
    const indexed = new Set(ALWAYS_INDEXED);
    const relations = new Set<string>();
    for (const each of chain) {
      for (const facet of each.facets) {
        if (facet.target !== "class") continue;
        if (facet.name === "Index" && Array.isArray(facet.options)) {
          const [leading] = facet.options as readonly unknown[];
          if (typeof leading === "string") indexed.add(leading);
        }
        if (facet.name === "Searchable")
          for (const path of (objectOf(facet.options)?.["filters"] as unknown[] | undefined) ?? [])
            if (typeof path === "string") indexed.add(path);
      }
      for (const relation of shapes.get(each.name)?.entity?.relations ?? [])
        relations.add(relation.name);
    }

    const refuse = (code: "sort_not_indexed" | "filter_not_indexed", path: unknown): void => {
      if (typeof path !== "string" || indexed.has(path)) return;
      if (relations.has(path.split(".")[0] ?? "")) return;
      const what = code === "sort_not_indexed" ? "sorts by" : "filters on";
      errors.push({
        code,
        file: model.file,
        line: 0,
        column: 0,
        subject: `${key}.table.${code === "sort_not_indexed" ? "sort" : "filter"}.${path}`,
        message: `the ${key} resource table ${what} ${path}, which no index of ${model.name} leads with, so the list scans the table`,
        fix: `add @Index(["${path}"]) to ${model.name} (or name it in @Searchable's filters), or drop it from the table`,
      });
    };
    const sorted = new Set<unknown>([
      ...(table.columns ?? [])
        .filter((column) => column.sortable === true)
        .map((column) => column.key),
      table.defaultSort?.key,
      ...(table.thenSort ?? []).map((sort) => sort.key),
    ]);
    for (const path of sorted) refuse("sort_not_indexed", path);
    for (const filter of table.filters ?? [])
      if (filter.kind !== "trashed") refuse("filter_not_indexed", filter.key);
  }
  return errors;
}
