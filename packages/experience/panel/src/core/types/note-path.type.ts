/**
 * Stackra file contract:
 * Purpose: `NotePath<O>`, the top-level keys of an output whose value is a number or a string: what a KPI's note line
 *          reads (`spendOtherCurrencies: number`).
 * Boundary: a type only; structural, so a nullable number or string counts.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 14: display paths are checked against the query output).
 */

/** The keys of `O` holding a number or a string. */
export type NotePath<O> = {
  [K in keyof O & string]: NonNullable<O[K]> extends number | string ? K : never;
}[keyof O & string];
