/**
 * Stackra file contract:
 * Purpose: `QueryRow<Q>`, the row of a list query class: the item type of its output's `items`.
 * Boundary: a type only; `never` for a query whose output is not a page.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1: the row is the item type of the list query's output).
 */
import type { QueryOutput } from "#core/types/query-output.type";

/** The row of list query class `Q`. */
export type QueryRow<Q> =
  QueryOutput<Q> extends { readonly items: readonly (infer R)[] } ? R : never;
