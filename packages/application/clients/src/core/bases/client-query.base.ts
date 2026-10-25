/**
 * Stackra file contract:
 * Purpose: `ClientQuery`, the kind factory form of `queryRef` that a public-area generated client uses
 *          (`class ResolveSiteQuery extends ClientQuery({ key: "sites.site.resolve", ... }) {}`), with the key inside
 *          the options.
 * Boundary: the same ref as `queryRef`; kept until gen writes one form in every target (STA-339).
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 3); ADR 0305 (kind factories take no `define` prefix).
 */
import { queryRef } from "#core/functions/query-ref.function";
import type { ClientQueryOptions } from "#core/types/client-query-options.type";
import type { QueryRef } from "#core/types/query-ref.type";
import type { RefSchema } from "#core/types/ref-schema.type";
import type { SchemaOf } from "#core/types/schema-of.type";

// shortcut: a second spelling of queryRef because two gen revisions emit both; drop one once gen settles (STA-339).
/**
 * A consumed query class.
 *
 * @throws RangeError when `key` is not a call key.
 * @example
 * export class ListPlansQuery extends ClientQuery({
 *   key: "billing.catalog.plan.list",
 *   input: ListPlansInput$,
 *   output: PlanLadder$,
 *   http: { method: HttpMethod.Get, path: "/public/plans" },
 * }) {}
 */
export function ClientQuery<I extends RefSchema, O extends RefSchema>(
  options: ClientQueryOptions<I, O>,
): QueryRef<SchemaOf<I>, SchemaOf<O>> {
  const { key, ...rest } = options;
  return queryRef(key, rest);
}
