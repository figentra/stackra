/**
 * Stackra file contract:
 * Purpose: `TransportError`, the refusal a call rejects with when no readable answer came back: the network failed, the
 *          request timed out, or the producer answered without a refusal envelope or with a body its output schema
 *          refuses.
 * Boundary: kind `unavailable`, retryable. A refusal the producer sent is never a transport error; it is decoded into
 *           the producer's refusal class. The failure that caused it is the `cause`.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0142 (transport through drivers).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

import type { TransportFailure } from "#contracts/enums/transport-failure.enum";

/**
 * No readable answer.
 *
 * @example
 * fake.on(OrderKpisQuery).throws(TransportError.create({ reason: TransportFailure.Network }));
 */
export class TransportError extends Refusal({ kind: ErrorKind.Unavailable, retryable: true }) {
  /** Why no answer could be read. */
  reason!: TransportFailure;

  /** The HTTP status of an answer without an envelope, when there was one. */
  status?: number;
}
