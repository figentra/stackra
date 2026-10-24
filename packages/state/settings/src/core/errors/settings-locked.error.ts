/**
 * Stackra file contract:
 * Purpose: `SettingsLockedError`, the refusal of a write to a setting that a holder above the target locked
 *          (`settings_locked`).
 * Boundary: raised by a `SettingValueStore` driver before it writes anything; kind `Conflict` (HTTP 409), not
 *           retryable. Its details are the refused paths, relative to the group, and each path's field error is
 *           `settings_locked`, so a form shows the lock on the field. It never names the holder that locked it.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 2: locks); ADR 0140 (envelope and kinds); final review R-02 (typed
 *                     `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: the same write is refused until the lock is lifted above.
 *
 * @example
 * throw SettingsLockedError.create({ paths }, { fieldErrors: { "cancellation.customersMayCancel": "settings_locked" } });
 */
export class SettingsLockedError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: false,
}) {
  /** The refused paths, relative to the group. */
  paths!: string[];
}
