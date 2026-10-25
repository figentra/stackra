/**
 * Stackra file contract:
 * Purpose: `DeviceSequenceOutOfOrderError` (`device_sequence_out_of_order`), the refusal of a call replayed from a
 *          device's offline queue whose sequence is not the device's next one; it names the sequence the server
 *          expects.
 * Boundary: never settles a sequence. `expected` below the sequence sent means an earlier call has not arrived: send it
 *           first and retry this one, hence retryable (thrown before any step). `expected` above means that call was
 *           already applied or rejected and this resend is not a replay of it (a resend with its own Idempotency-Key
 *           replays the stored output instead): drop it (thrown by the idempotency step). A conflict (409).
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 1: never a later call before an earlier one is applied or rejected); ADR
 *                     0140; final review R-02 (typed `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Retryable once the expected call has been sent.
 *
 * @example
 * throw DeviceSequenceOutOfOrderError.create({ expected: 42 });
 */
export class DeviceSequenceOutOfOrderError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: true,
}) {
  /** The device's next sequence. */
  expected!: number;
}
