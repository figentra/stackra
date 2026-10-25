/**
 * Stackra file contract:
 * Purpose: `DeviceSequenceOutOfOrderError` (`device_sequence_out_of_order`), the refusal of a call replayed from a
 *          device's offline queue whose sequence is at or below the device's last acknowledged one and is not a resend
 *          the server can replay; it names that last acknowledged sequence.
 * Boundary: never settles a sequence. Thrown by the idempotency step: the call was already applied or rejected (or a
 *           later one was), and this send carries no Idempotency-Key with a stored output to replay, so the client
 *           drops it. Sequences are not contiguous, so the server never refuses a sequence as too far ahead; the client
 *           sends one call at a time. A conflict (409), not retryable.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decisions 1 and 4: never a later call before an earlier one is applied or rejected;
 *                     the last acknowledged sequence); ADR 0140; final review R-02 (typed `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The device already moved past this sequence.
 *
 * @example
 * throw DeviceSequenceOutOfOrderError.create({ acknowledged: 1729760400000 });
 */
export class DeviceSequenceOutOfOrderError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: false,
}) {
  /** The device's last acknowledged (applied or rejected) sequence. */
  acknowledged!: number;
}
