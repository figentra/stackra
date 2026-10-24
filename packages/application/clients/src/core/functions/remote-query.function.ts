/**
 * Stackra file contract:
 * Purpose: `remoteQuery`, the descriptor of a producer's query in a service's generated client
 *          (`export const QuotePriceQuery = remoteQuery("pricing.price.quote@1", {...})`), which a `ServiceClient`
 *          member wraps and a test fakes with `fake.on(QuotePriceQuery)`.
 * Boundary: the service form of `queryRef`: `endpoint` names the route that `queryRef` calls `http`.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decisions 3, 4 and 6).
 */
import { queryRef } from "#core/functions/query-ref.function";
import type { QueryRef } from "#core/types/query-ref.type";
import type { RefSchema } from "#core/types/ref-schema.type";
import type { RemoteCallOptions } from "#core/types/remote-call-options.type";
import type { SchemaOf } from "#core/types/schema-of.type";

/**
 * A producer's query descriptor.
 *
 * @throws RangeError when `key` is not a call key.
 * @example
 * export const QuotePriceQuery = remoteQuery("pricing.price.quote@1", {
 *   input: QuoteInput$,
 *   output: QuoteOutput$,
 *   endpoint: { method: HttpMethod.Post, path: "/prices/quote" },
 * });
 */
export function remoteQuery<I extends RefSchema, O extends RefSchema>(
  key: string,
  options: RemoteCallOptions<I, O>,
): QueryRef<SchemaOf<I>, SchemaOf<O>> {
  const { endpoint, ...schemas } = options;
  return queryRef(key, endpoint === undefined ? schemas : { ...schemas, http: endpoint });
}
