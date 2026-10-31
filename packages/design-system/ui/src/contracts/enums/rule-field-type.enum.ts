/**
 * Stackra file contract:
 * Purpose: `RuleFieldType`, the one kind-of-value enum of the data family: a rule field's and a collection column's
 *          (text, number, choice, date as an ISO calendar day, boolean). It sets the filter operators, the input, the
 *          sort and the cell editor; it replaced `DataGridCellType` (2026-10-31, `select` is now `choice`).
 * Boundary: values only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); ADR 0505 (one data family); STA-1371.
 */

/** The value kinds of a rule field. */
export const RuleFieldType = Object.freeze([
  "text",
  "number",
  "choice",
  "date",
  "boolean",
] as const);

/** One rule field type. */
export type RuleFieldType = (typeof RuleFieldType)[number];
