/**
 * Stackra file contract:
 * Purpose: `PairingCodeInvalidError`, the refusal of the registry when a code matches no pending pairing (unknown,
 *          used or expired), or a pairing is opened for a device that is already registered and active.
 * Boundary: kind `NotFound`, code `pairing_code_invalid`, not retryable: the device shows a new code. No detail: the
 *           answer never says whether a code exists, so codes cannot be probed.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7); ADR 0140 (envelope and kinds); ADR 0294 (decisions 16 and 20).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** Not retryable: only a new code pairs. */
export class PairingCodeInvalidError extends Refusal({ kind: ErrorKind.NotFound }) {}
