/**
 * Stackra file contract:
 * Purpose: `SearchWeight`, the weight letter `@Searchable`'s `boost` gives a text field.
 * Boundary: a type only; the letters are Postgres `setweight`'s, `A` the heaviest and `D` the lightest.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 1: weighted full-text); data-layer gap se9 (stackra-302).
 */

/** The weight of a text field, `A` the heaviest and `D` the lightest. */
export type SearchWeight = "A" | "B" | "C" | "D";
