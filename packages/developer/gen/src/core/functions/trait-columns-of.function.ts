/**
 * Stackra file contract:
 * Purpose: `traitColumnsOf`, the columns and indexes the traits of a model write on its table, derived from the traits
 *          as discovery records them (`Model.with(...)` with constant arguments), the static form of `traitsOf`: each
 *          trait's name to its registry code (`HasTree` is `has_tree`), its `TRAIT_COLUMNS` row, and for
 *          `Partitioned({ by })` the optional BRIN index `t.partitionBy` writes over the `by` field's column.
 * Boundary: pure. A trait with no row and no columns of its own adds nothing; a trait named twice counts once; a later
 *           trait's column of the same name wins, as the later mixin does. `Partitioned` whose `by` is not a constant
 *           string adds no index. A namespaced trait (`traits.HasTree`) is read by its last segment.
 * Runtime: isomorphic
 * Governing contract: ADR 0096 (decision 4: the trait registry, read by gen); ADR 0159; ADR 0282 (decision 3: `stackra
 *                     db diff`); data-layer gaps mo24 and db12 (`Partitioned`); STA-1408.
 */
import { snakeCase } from "@stackra/support";

import { TRAIT_COLUMNS } from "#core/constants/trait-columns.constant";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { TraitColumns } from "#core/types/trait-columns.type";

/** A trait as discovery records it. */
type TraitUse = DeclaredClass["traits"][number];

/** The registry code of a trait as the source names it. */
const codeOf = (name: string): string => snakeCase(name.slice(name.lastIndexOf(".") + 1));

/** The column `Partitioned({ by })` partitions by, or undefined when its options are not read. */
function partitionColumnOf(trait: TraitUse): string | undefined {
  const options = trait.args[0];
  if (typeof options !== "object" || options === null || Array.isArray(options)) return undefined;
  const by = (options as Readonly<Record<string, unknown>>)["by"];
  return typeof by === "string" && by !== "" ? snakeCase(by) : undefined;
}

/**
 * The columns and indexes `traits` write.
 *
 * @param traits - a model's traits, the first applied first (its base models' before its own).
 * @example
 * traitColumnsOf([{ name: "HasTree", args: [] }]).columns.map((column) => column.name); // ["parent_id", "tree_path"]
 */
export function traitColumnsOf(traits: readonly TraitUse[]): TraitColumns {
  const columns = new Map<string, TraitColumns["columns"][number]>();
  const indexes = new Map<string, TraitColumns["indexes"][number]>();
  const seen = new Set<string>();
  for (const trait of traits) {
    const code = codeOf(trait.name);
    if (code === "partitioned") {
      const column = partitionColumnOf(trait);
      if (column !== undefined)
        indexes.set(column, { columns: [column], method: "brin", optional: true });
      continue;
    }
    const row = TRAIT_COLUMNS[code];
    if (row === undefined || seen.has(code)) continue;
    seen.add(code);
    for (const column of row.columns) {
      columns.delete(column.name);
      columns.set(column.name, column);
    }
    for (const index of row.indexes) indexes.set(index.columns.join("\u0000"), index);
  }
  return { columns: [...columns.values()], indexes: [...indexes.values()] };
}
