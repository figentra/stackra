/**
 * Stackra file contract:
 * Purpose: `UnknownEventError`, the refusal of a received event whose wire name names no integration event this
 *          process registered: an event of a newer or older release than the consumer.
 * Boundary: raised by the inbox before it claims the id, so the event stays unreceived and its redelivery runs once
 *           the right release is deployed. Kind `Internal`, retryable (the relay, or the transport, tries again), code
 *           `unknown_event`; the one detail is the wire name.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 (decision 4); ADR 0140 (envelope and kinds); ADR 0328 (built with `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A received event names a type this process does not know.
 *
 * @example
 * throw UnknownEventError.create({ type: "orders.order.paid.v2" });
 */
export class UnknownEventError extends Refusal({
  kind: ErrorKind.Internal,
  retryable: true,
}) {
  /** The wire name the event arrived with. */
  type!: string;
}
