/**
 * Stackra file contract:
 * Purpose: `DeviceUnauthorizedError`, the refusal the HTTP drivers throw when the hub answers 401 or 403: the device's
 *          credential was refused, expired or revoked.
 * Boundary: kind `Unauthenticated`, code `device_unauthorized`, not retryable: repeating the call with the same token
 *           never succeeds; the device gets a new credential from identity or stops. Its one detail is the status,
 *           never the token or the body.
 * Runtime: isomorphic
 * Governing contract: ADR 0235 (decision 1: revocable device credentials); ADR 0140 (envelope and kinds); ADR 0294
 *                     (decisions 16 and 20).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** Not retryable: only a new credential changes the answer. */
export class DeviceUnauthorizedError extends Refusal({ kind: ErrorKind.Unauthenticated }) {
  /** The hub's status, 401 or 403. */
  status!: number;
}
