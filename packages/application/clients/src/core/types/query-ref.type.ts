/**
 * Stackra file contract:
 * Purpose: `QueryRef<I, O>`, the class `queryRef`, `ClientQuery` and `remoteQuery` return: a consumed query read by its
 *          statics (versioned key, derived permission, input and output schemas, route, cache invalidation).
 * Boundary: a type only. It satisfies `@stackra/query`'s `LiveQueryRef` structurally (a static `key` and
 *           `invalidateOn`), so `ServerStateCache.watch(OrderKpisQuery)` takes it. Never instantiated.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decisions 3 and 4); ADR 0305 (query `cache`); owner decision R-25 (live queries).
 */
import type { EndpointOptions } from "@stackra/actions";
import type { ZodType } from "zod";

import type { EventRef } from "#core/types/event-ref.type";

/** A consumed query class. */
export type QueryRef<
  I extends ZodType = ZodType,
  O extends ZodType = ZodType,
> = (abstract new () => object) & {
  /** Tells a query ref from an action ref. */
  readonly kind: "query";

  /** The versioned key (`orders.order.kpis@1`); every cache key of the query starts with it. */
  readonly key: string;

  /** The permission derived from the key (`orders.order.kpis`). */
  readonly permission: string;

  /** The input schema. */
  readonly input: I;

  /** The output schema. */
  readonly output: O;

  /** The route, when the query has one. */
  readonly endpoint?: EndpointOptions;

  /** The events after which its cached results are stale; empty when it is not live. */
  readonly invalidateOn: readonly EventRef[];

  /** The producer's cache time (`5m`), when it declared one. */
  readonly ttl?: string;
};
