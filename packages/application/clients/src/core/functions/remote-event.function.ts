/**
 * Stackra file contract:
 * Purpose: `remoteEvent`, the base of a producer's integration event class in a service's generated client
 *          (`class PaymentCaptured extends remoteEvent("payments.payment.captured.v1", payload$) {}`), which a
 *          listener names as its parameter type.
 * Boundary: the service form of `eventRef`, taking the payload schema directly.
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (wire names); ADR 0260 (decision 4: events).
 */
import type { ZodType } from "zod";

import { eventRef } from "#core/functions/event-ref.function";
import type { EventRef } from "#core/types/event-ref.type";

/**
 * A producer's integration event class.
 *
 * @throws RangeError when `name` is not a versioned event name.
 * @example
 * export class PaymentFailed extends remoteEvent(
 *   "payments.payment.failed.v1",
 *   z.object({ paymentId: z.string(), reason: z.string() }),
 * ) {}
 */
export function remoteEvent<S extends ZodType>(name: string, payload: S): EventRef<S> {
  return eventRef(name, { payload });
}
