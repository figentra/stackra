/**
 * Stackra file contract:
 * Purpose: `EventRef<S>`, the class `eventRef` and `remoteEvent` return: a consumed integration event read by its static
 *          wire name and payload schema, typed by its instances, which are the payload.
 * Boundary: a type only. It satisfies `@stackra/realtime`'s `RealtimeEventRef` structurally (a static `eventName` and
 *           an object prototype), so `useSubscription(OrderPaid, ...)` and a query's `invalidateOn` take it.
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (wire names); ADR 0225 (broadcast); ADR 0260 (decision 4).
 */
import type { output, ZodType } from "zod";

import type { ShapeInstance } from "#core/types/shape-instance.type";

/** A consumed integration event class. */
export type EventRef<S extends ZodType = ZodType> = (abstract new () => ShapeInstance<
  output<S>
>) & {
  /** The versioned wire name (`orders.order.paid.v1`). */
  readonly eventName: string;

  /** The payload schema. */
  readonly payload: S;

  /** The broadcast channel pattern (`principal.{principalId}.messages`), when the producer declared one. */
  readonly channel?: string;

  /** Who receives the broadcast (`principal`), when the producer declared it. */
  readonly audience?: string;
};
