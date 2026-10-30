/**
 * Stackra file contract:
 * Purpose: `DeviceRevokedError` (`device_revoked`), the refusal of a call that carries device order from a device the
 *          bound `DeviceStatusReader` reports revoked.
 * Boundary: thrown before the device-order step, so the refused call never settles its sequence and nothing runs; the
 *           audit records the refusal. Forbidden (403), not retryable: a revoked device's queue is dead, the client
 *           drops it. Identity revoking the device's credential (401) still comes first; this is the second line.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (device order); ADR 0361 (decision 7: revocation); ADR 0140; final review R-02 (typed
 *                     `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A revoked device's call.
 *
 * @example
 * throw DeviceRevokedError.create();
 */
export class DeviceRevokedError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {}
