/**
 * Stackra file contract:
 * Purpose: `SettingFourEyesError`, the refusal of an approval by the revision's own author (`setting_four_eyes`): a
 *          change to a key marked `approval` needs a second person.
 * Boundary: raised by `SettingsResolver#approve` before the revision moves; kind `Forbidden` (HTTP 403), not
 *           retryable. Whether the approver holds `<module>.settings.approve` is the calling action's check.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 5: four-eyes approval); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable by the same person.
 *
 * @example
 * throw SettingFourEyesError.create({ revision: id });
 */
export class SettingFourEyesError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {
  /** The revision whose author tried to approve it. */
  revision!: string;
}
