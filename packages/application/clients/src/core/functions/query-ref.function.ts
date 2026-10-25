/**
 * Stackra file contract:
 * Purpose: `queryRef`, the base gen writes a consumed query class over in `#stackra/clients/<service>`
 *          (`class OrderKpisQuery extends queryRef("orders.order.kpis@1", {...}) {}`): the versioned key, the derived
 *          permission, the input and output schemas, the route, the events that invalidate its results and its
 *          replica declaration.
 * Boundary: the ref describes the call; a transport makes it. A query with `invalidateOn` (top level or in `cache`) is
 *           live: the hooks watch it through `@stackra/query`'s `ServerStateCache`. A query with `replica` is recorded
 *           with `@stackra/query`'s `registerReplicas`, so `ReplicaStore` keeps it and `useReplica` reads it; its type
 *           then carries `replica`, which `useReplica` requires. Nothing is recorded for a ref that is refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decisions 3 and 4); ADR 0305 (query `cache`); owner decision R-25 (live queries); ADR
 *                     0338 (decision 3: replicas).
 */
import { registerReplicas } from "@stackra/query";
import type { ReplicaOptions } from "@stackra/query";

import { CALL_REFS } from "#core/constants/call-refs.constant";
import { defineStatics } from "#core/functions/define-statics.function";
import { permissionOf } from "#core/functions/permission-of.function";
import { resolveSchema } from "#core/functions/resolve-schema.function";
import type { QueryRef } from "#core/types/query-ref.type";
import type { QueryRefOptions } from "#core/types/query-ref-options.type";
import type { RefSchema } from "#core/types/ref-schema.type";
import type { SchemaOf } from "#core/types/schema-of.type";

/**
 * A consumed query class kept as a bounded replica.
 *
 * @throws RangeError when `key` is not a call key, or the replica's `window` or `limit` is malformed.
 * @throws TypeError when the input or output is neither a zod schema nor a remote shape class.
 * @example
 * export class RecentSalesQuery extends queryRef("sales.sale.recent@1", {
 *   input: RecentSalesInput,
 *   output: RecentSalesOutput,
 *   http: { method: HttpMethod.Get, path: "/sales/recent" },
 *   invalidateOn: [SaleRecorded],
 *   replica: { of: "sales.sale", window: "30d", limit: 5000, scope: "legalEntityId" },
 * }) {}
 */
export function queryRef<I extends RefSchema, O extends RefSchema>(
  key: string,
  options: QueryRefOptions<I, O> & { readonly replica: ReplicaOptions },
): QueryRef<SchemaOf<I>, SchemaOf<O>> & { readonly replica: ReplicaOptions };
/**
 * A consumed query class.
 *
 * @throws RangeError when `key` is not a call key.
 * @throws TypeError when the input or output is neither a zod schema nor a remote shape class.
 * @example
 * export class OrderKpisQuery extends queryRef("orders.order.kpis@1", {
 *   input: OrderKpisInput,
 *   output: OrderKpisOutput,
 *   http: { method: HttpMethod.Get, path: "/orders/kpis" },
 *   cache: { ttl: "5m", invalidateOn: [OrderPaid] },
 * }) {}
 */
export function queryRef<I extends RefSchema, O extends RefSchema>(
  key: string,
  options: QueryRefOptions<I, O>,
): QueryRef<SchemaOf<I>, SchemaOf<O>>;
export function queryRef<I extends RefSchema, O extends RefSchema>(
  key: string,
  options: QueryRefOptions<I, O>,
): QueryRef<SchemaOf<I>, SchemaOf<O>> {
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: a ref is read by its statics only
  const Ref = class {};
  defineStatics(Ref, {
    kind: "query",
    key,
    permission: permissionOf(key),
    input: resolveSchema(options.input),
    output: resolveSchema(options.output),
    endpoint: options.http,
    invalidateOn: Object.freeze([
      ...(options.invalidateOn ?? []),
      ...(options.cache?.invalidateOn ?? []),
    ]),
    ttl: options.cache?.ttl,
    replica: options.replica,
  });
  const ref = Ref as unknown as QueryRef<SchemaOf<I>, SchemaOf<O>>;
  if (options.replica !== undefined)
    registerReplicas([
      ref as QueryRef<SchemaOf<I>, SchemaOf<O>> & { readonly replica: ReplicaOptions },
    ]);
  CALL_REFS.set(key, ref);
  return ref;
}
