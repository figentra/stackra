/**
 * Stackra file contract:
 * Purpose: `scopedQueryKeyOf(query, input, scope)`, the cache key of a query run in an explicit scope: the query's own
 *          key (`queryKeyOf`) when no scope is given, else that key plus `{ scope }`, so the same query in two scopes
 *          caches two answers.
 * Boundary: pure. The query key stays first, so invalidating a query by its key (`[query.key]`) reaches every scope's
 *           answer; an unscoped call keeps exactly the key it had before a scope option existed.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 3: the call's scope); R-59 (scope, not tenant).
 */
import { queryKeyOf } from "#core/functions/query-key-of.function";
import type { QueryRef } from "#core/types/query-ref.type";

/**
 * The cache key of `query` with `input`, apart per `scope`.
 *
 * @example
 * scopedQueryKeyOf(ListUnitsQuery, {}, "platform.acme"); // ["units.unit.list@1", {}, { scope: "platform.acme" }]
 */
export function scopedQueryKeyOf(
  query: QueryRef,
  input: unknown,
  scope: string | undefined,
): readonly unknown[] {
  const key = queryKeyOf(query, input);
  return scope === undefined ? key : [...key, { scope }];
}
