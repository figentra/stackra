/**
 * Stackra file contract:
 * Purpose: `filterDefinitionsOf`, the quick filters a FilterBar or FilterPanel offers, derived from a collection's
 *          filterable columns: the kind from the column's `type` (text, a number range within `min` and `max`, any of
 *          a choice's `options`, a date range, yes or no), the name from its label, and the editor's settings from its
 *          `filter` (a hint, a step and number format, the yes and no words, refused while disabled).
 * Boundary: pure; the column is the one declaration, so there is no separate list of filters to keep in step.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0505 (one filter model, kinds from the column type).
 */
import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { FilterDefinition } from "#contracts/types/filter-definition.type";

/**
 * The quick filters of the columns.
 * @param columns - the collection's columns (usually the engine's, so a renamed column keeps its new name)
 * @returns one filter per filterable column, in column order
 */
export function filterDefinitionsOf(
  columns: readonly CollectionColumn[],
): readonly FilterDefinition[] {
  return columns
    .filter((column) => column.isFilterable !== false)
    .map((column): FilterDefinition => {
      const { placeholder, isDisabled, step, formatOptions, trueLabel, falseLabel } =
        column.filter ?? {};
      const base = {
        id: column.id,
        label: column.label,
        ...(isDisabled === undefined ? {} : { isDisabled }),
      };
      switch (column.type ?? "text") {
        case "number": {
          return {
            ...base,
            kind: "number",
            ...(column.min === undefined ? {} : { minValue: column.min }),
            ...(column.max === undefined ? {} : { maxValue: column.max }),
            ...(step === undefined ? {} : { step }),
            ...(formatOptions === undefined ? {} : { formatOptions }),
          };
        }
        case "choice": {
          return { ...base, kind: "multi-select", options: column.options ?? [] };
        }
        case "date": {
          return { ...base, kind: "date-range" };
        }
        case "boolean": {
          return {
            ...base,
            kind: "boolean",
            ...(trueLabel === undefined ? {} : { trueLabel }),
            ...(falseLabel === undefined ? {} : { falseLabel }),
          };
        }
        default: {
          return { ...base, kind: "text", ...(placeholder === undefined ? {} : { placeholder }) };
        }
      }
    });
}
