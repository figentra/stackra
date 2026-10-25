/**
 * Stackra file contract:
 * Purpose: `ListPath<O>`, the top-level keys of an output whose value is a list: what a List display reads.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 14: display paths are checked against the query output).
 */

/** The keys of `O` holding an array. */
export type ListPath<O> = {
  [K in keyof O & string]: NonNullable<O[K]> extends readonly unknown[] ? K : never;
}[keyof O & string];
