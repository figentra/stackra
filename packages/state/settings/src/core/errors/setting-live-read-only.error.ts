/**
 * Stackra file contract:
 * Purpose: `SettingLiveReadOnlyError`, the refusal of a write on live to a setting that is not live-editable
 *          (`setting_live_read_only`): structural configuration changes in a sandbox and reaches live by promotion.
 * Boundary: raised by `SettingsResolver#write` before anything is recorded; kind `Conflict` (HTTP 409), not
 *           retryable. Its details are the refused paths, each with the field error `setting_live_read_only`. ADR 0359
 *           open question 5 proposes the code `live_read_only`; this code follows the class-name rule until it is set.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decisions 3 to 5); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable on live: make the change in the sandbox and promote it.
 *
 * @example
 * throw SettingLiveReadOnlyError.create({ paths }, { fieldErrors: { "checkout.guestCheckout": "setting_live_read_only" } });
 */
export class SettingLiveReadOnlyError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: false,
}) {
  /** The refused paths, relative to the group. */
  paths!: string[];
}
