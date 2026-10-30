/**
 * Stackra file contract:
 * Purpose: proves `facetDefinitionOf` labels each counted option of a choice filter and leaves the rest as they are.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); design-system gap inventory (2026-10-28) row 9.
 */
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import { facetDefinitionOf } from "#core/functions/facet-definition-of.function";

const STATUS: FilterDefinition = {
  id: "status",
  label: "Status",
  kind: "multi-select",
  options: [
    { id: "paid", label: "Paid" },
    { id: "void", label: "Void" },
  ],
};

const labelOf = (label: string, count: number) => `${label} (${count})`;

describe("facetDefinitionOf", () => {
  it("labels each counted option and keeps an uncounted one", () => {
    const facet = facetDefinitionOf(STATUS, { paid: 12 }, labelOf);
    expect(facet.kind === "multi-select" && facet.options.map((option) => option.label)).toEqual([
      "Paid (12)",
      "Void",
    ]);
  });

  it("returns a filter that is not a choice, or has no counts, as it is", () => {
    const text: FilterDefinition = { id: "q", label: "Customer", kind: "text" };
    expect(facetDefinitionOf(text, { a: 1 }, labelOf)).toBe(text);
    expect(facetDefinitionOf(STATUS, undefined, labelOf)).toBe(STATUS);
  });
});
