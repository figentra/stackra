/**
 * Stackra file contract:
 * Purpose: `facetDefinitionOf(definition, counts, labelOf)`, a choice filter whose option labels carry their counts
 *          ("Paid (12)"), so the facet editors of `FilterPanel` show how many records each option matches.
 * Boundary: pure; a filter that is not a choice, or has no counts, is returned as it is. The chips keep the plain
 *           definition, so the counts never reach a chip's text.
 * Runtime: isomorphic
 * Governing contract: ADR 0318; design-system gap inventory (2026-10-28) row 9.
 */
import type { FilterDefinition } from "#contracts/types/filter-definition.type";

/**
 * The definition a facet editor draws.
 *
 * @example
 * facetDefinitionOf(status, { paid: 12 }, (label, count) => `${label} (${count})`);
 */
export function facetDefinitionOf(
  definition: FilterDefinition,
  counts: Readonly<Record<string, number>> | undefined,
  labelOf: (label: string, count: number) => string,
): FilterDefinition {
  if (counts === undefined || (definition.kind !== "select" && definition.kind !== "multi-select"))
    return definition;
  return {
    ...definition,
    options: definition.options.map((option) => {
      const count = counts[option.id];
      return count === undefined ? option : { ...option, label: labelOf(option.label, count) };
    }),
  };
}
