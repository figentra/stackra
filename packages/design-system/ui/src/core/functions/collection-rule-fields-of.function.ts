/**
 * Stackra file contract:
 * Purpose: `collectionRuleFieldsOf()`, the fields a collection's rule builder offers: every filterable column, by its
 *          shown name, with its type and choices.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); STA-1371.
 */
import type { ResolvedCollectionColumn } from "#contracts/types/resolved-collection-column.type";
import type { RuleField } from "#contracts/types/rule-field.type";

/**
 * The rule fields of the columns.
 * @param columns - the resolved columns
 */
export function collectionRuleFieldsOf(
  columns: readonly ResolvedCollectionColumn[],
): readonly RuleField[] {
  return columns
    .filter((column) => column.isFilterable !== false)
    .map((column) => ({
      key: column.id,
      label: column.label,
      type: column.type ?? "text",
      ...(column.options ? { options: column.options } : {}),
    }));
}
