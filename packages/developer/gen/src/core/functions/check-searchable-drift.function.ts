/**
 * Stackra file contract:
 * Purpose: `checkSearchableDrift`, the refusal `searchable_columns_drift`: an own model's `@Searchable` text or filter
 *          fields differ from the latest `t.searchable({ text, filters })` literals of its table, so the search columns
 *          describe other fields than the facet indexes into them.
 * Boundary: pure; reads the IR only (`ir.searchableColumns`, which `readSearchableColumns` fills). A path is compared
 *           with each segment in snake case (`memberId` and `member_id` agree); text fields in order (position is
 *           their weight), filters as a set. A table is matched by its module and name; a model whose table no
 *           migration of the member gives search columns is not judged here.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decisions 1 and 3); ADR 0159 (as amended by ADR 0305: literal snapshots); ADR 0294
 *                     (decision 22: a refusal carries its fix); data-layer gap se10.
 */
import { snakeCase } from "@stackra/support";

import { tableName } from "#core/functions/table-name.function";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** `path` with each segment in snake case. */
const snakePath = (path: string): string => path.split(".").map(snakeCase).join(".");

/** The strings of `value`, or none when it is not an array. */
const stringsOf = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((each): each is string => typeof each === "string").map(snakePath)
    : [];

/**
 * The `searchable_columns_drift` refusals of `ir`.
 *
 * @param ir - the member read by discovery.
 * @example
 * checkSearchableDrift(ir).map((refusal) => refusal.subject); // ["Product"]
 */
export function checkSearchableDrift(ir: MemberIR): GenError[] {
  const errors: GenError[] = [];
  for (const model of ir.classes) {
    if (model.kind !== "model") continue;
    const facet = model.facets.find(
      (candidate) => candidate.name === "Searchable" && candidate.target === "class",
    );
    if (facet === undefined) continue;
    const options = facet.options as
      | { readonly text?: unknown; readonly filters?: unknown }
      | undefined;
    const table = tableName(model.module, model.name);
    const bare = table.slice(table.indexOf(".") + 1);
    // The calls are in apply order, so the last match is the latest.
    let latest: NonNullable<MemberIR["searchableColumns"]>[number] | undefined;
    for (const call of ir.searchableColumns ?? [])
      if (call.table === bare && call.module === model.module) latest = call;
    if (latest === undefined) continue;
    const text = stringsOf(options?.text);
    const filters = stringsOf(options?.filters);
    const wantText = latest.text.map(snakePath);
    const wantFilters = latest.filters.map(snakePath);
    const sameText = text.join("\u0000") === wantText.join("\u0000");
    const sameFilters =
      new Set(filters).size === new Set(wantFilters).size &&
      filters.every((path) => wantFilters.includes(path));
    if (sameText && sameFilters) continue;
    errors.push({
      code: "searchable_columns_drift",
      file: model.file,
      line: 0,
      column: 0,
      subject: model.name,
      message:
        `${model.name}'s @Searchable indexes text [${text.join(", ")}] and filters [${filters.join(", ")}], but ` +
        `the latest t.searchable on ${table} (${latest.file}) says text [${wantText.join(", ")}] and filters ` +
        `[${wantFilters.join(", ")}], so the search columns describe other fields than the documents hold`,
      fix:
        `add a migration that calls t.searchable on ${bare} with the facet's fields (or put the facet back), ` +
        `then run \`stackra search:reindex ${model.name}\``,
    });
  }
  return errors;
}
