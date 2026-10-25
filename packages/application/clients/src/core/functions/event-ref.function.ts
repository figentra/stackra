/**
 * Stackra file contract:
 * Purpose: `eventRef`, the base gen writes a consumed integration event class over
 *          (`class OrderPaid extends eventRef("orders.order.paid.v1", { payload }) {}`): the wire name, the payload
 *          schema and the producer's broadcast channel and audience, as statics.
 * Boundary: the class is passed, never a wire name: `useSubscription(OrderPaid, ...)`, a query's `invalidateOn`, a
 *           listener's parameter type. Its instances are typed as the payload; nothing here constructs one.
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (wire names); ADR 0225 (broadcast); ADR 0260 (decision 4).
 */
import type { ZodType } from "zod";

import { defineStatics } from "#core/functions/define-statics.function";
import type { EventRef } from "#core/types/event-ref.type";
import type { EventRefOptions } from "#core/types/event-ref-options.type";

/** `<module>.<name>.v<version>`, dotted snake_case. */
const EVENT_NAME = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+\.v\d+$/;

/**
 * A consumed integration event class.
 *
 * @throws RangeError when `name` is not a versioned event name.
 * @example
 * export class OrderPaid extends eventRef("orders.order.paid.v1", {
 *   payload: z.object({ orderId: publicId("ord"), totalMinor: z.number().int() }),
 * }) {}
 */
export function eventRef<S extends ZodType>(
  name: string,
  options: EventRefOptions<S>,
): EventRef<S> {
  if (!EVENT_NAME.test(name))
    throw new RangeError(`"${name}" is not an event name: <module>.<name>.v<version>`);
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: a ref is read by its statics only
  const Ref = class {};
  defineStatics(Ref, {
    eventName: name,
    payload: options.payload,
    channel: options.channel,
    audience: options.audience,
  });
  return Ref as unknown as EventRef<S>;
}
