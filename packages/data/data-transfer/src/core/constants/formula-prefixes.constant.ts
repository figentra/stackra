/**
 * Stackra file contract:
 * Purpose: `FORMULA_PREFIXES`, the first characters that make a spreadsheet read a CSV text cell as a formula.
 * Boundary: security mechanism (CSV injection), read by the CSV writer's formula guard.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 10).
 */

/** `=`, `+`, `-`, `@`, tab and carriage return. */
export const FORMULA_PREFIXES: readonly string[] = ["=", "+", "-", "@", "\t", "\r"];
