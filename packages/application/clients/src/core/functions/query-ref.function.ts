/**
 * Stackra file contract:
 * Purpose: `queryRef`, the base gen writes a consumed query class over in `#stackra/clients/<service>`
 *          (`class OrderKpisQuery extends queryRef("orders.order.kpis@1", {...}) {}`): the versioned key, the derived
 *          permission, the input and output schemas, the route and the events that invalidate its results.
 * Boundary: the ref describes the call; a transport makes it. A query with `invalidateOn` (top level or in `cache`) is
 *           live: the hooks watch it through `@stackra/query`'s `ServerStateCache`.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decisions 3 and 4); ADR 0305 (query `cache`); owner decision R-25 (live queries).
 */
import { CALL_REFS } from "#core/constants/call-refs.constant";
import { defineStatics } from "#core/functions/define-statics.function";
import { permissionOf } from "#core/functions/permission-of.function";
import { resolveSchema } from "#core/functions/resolve-schema.function";
import type { QueryRef } from "#core/types/query-ref.type";
import type { QueryRefOptions } from "#core/types/query-ref-options.type";
import type { RefSchema } from "#core/types/ref-schema.type";
import type { SchemaOf } from "#core/types/schema-of.type";

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
  });
  const ref = Ref as unknown as QueryRef<SchemaOf<I>, SchemaOf<O>>;
  CALL_REFS.set(key, ref);
  return ref;
}
