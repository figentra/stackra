/**
 * Stackra file contract:
 * Purpose: the six kinds of filter a resource index offers, each with its own editor and its own value: free text, a
 *          number range, one choice, several choices, a date range and a yes or no. A `FilterDefinition` names its kind,
 *          so FilterBar draws the matching editor and a URL codec knows how to read the value back.
 * Boundary: the values only; `FilterValueByKind` maps each kind to its value type, and the editors live in FilterBar.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318.
 */

/** The filter kinds, `text` first. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the kinds carry no labels.
export const FilterKind = Object.freeze([
  "text",
  "number",
  "select",
  "multi-select",
  "date-range",
  "boolean",
] as const);

/** One filter kind. */
export type FilterKind = (typeof FilterKind)[number];
