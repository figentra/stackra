/**
 * Stackra file contract:
 * Purpose: `SoftPosUnavailableError` (`soft_pos_unavailable`), the refusal when this phone cannot be a tap-to-pay
 *          reader: an unsupported device, a missing entitlement, or the provider SDK refusing to connect.
 * Boundary: kind `FailedPrecondition`, not retryable as it stands. Carries the provider code and the driver's or the
 *           SDK's reason code only.
 * Runtime: isomorphic
 * Governing contract: ADR 0446; ADR 0378 (decision 5); ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The phone is not a reader.
 *
 * @example
 * throw SoftPosUnavailableError.create({ provider: "stripe", reason: "unsupported_device" });
 */
export class SoftPosUnavailableError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The provider code. */
  provider!: string;

  /** Why (`unsupported_device`, `no_entitlement`, or the SDK's code). */
  reason!: string;
}
