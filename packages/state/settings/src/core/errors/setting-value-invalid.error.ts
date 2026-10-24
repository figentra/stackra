/**
 * Stackra file contract:
 * Purpose: `SettingValueInvalidError`, the refusal of a page write whose value breaks its key (`setting_value_invalid`):
 *          an unknown key, the wrong type, `null` for a key that is not nullable, or a number outside its bounds.
 * Boundary: raised by `SettingsReader#write` before the store is called, so nothing is written; kind `Validation`
 *           (HTTP 400), not retryable. Its details are the refused keys' full paths, each with the field error
 *           `setting_value_invalid`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 22); ADR 0140 (envelope and kinds); final review R-02 (typed `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: the same values are refused again.
 *
 * @example
 * throw SettingValueInvalidError.create({ keys }, { fieldErrors: { "orders.dailyRevenueTargetMinor": "setting_value_invalid" } });
 */
export class SettingValueInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The refused keys' full paths (`orders.dailyRevenueTargetMinor`). */
  keys!: string[];
}
