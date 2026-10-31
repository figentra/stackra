/**
 * Stackra file contract:
 * Purpose: `RuleValue`, what a rule condition compares a field with: text (a number or an ISO day is written as text),
 *          a list of choice ids (`in`, `not_in`) or a `[from, to]` pair (`between`, an empty end is open).
 * Boundary: types only; plain data, so a filter serialises to a URL or a request body as is.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0505 (one filter model); STA-1371.
 */
/** The value of a rule condition. */
export type RuleValue = string | readonly string[];
