/**
 * Stackra file contract:
 * Purpose: `refusedWriteMessage(error)`, the catalogue key that words a failed settings write: the package's own
 *          words for a refusal it names, `settings::form.not_saved` for anything else.
 * Boundary: pure; it returns a key, never words, so the host's catalogue translates it. Internal to the `./react`
 *           entry: `useSetting` and `useSettingsForm` (both `SettingsForm`s) share it, and it is not exported.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 24); ADR 0140 (refusal codes); ADR 0504 (decision 4: catalogue words).
 */
import { isRefusal } from "@stackra/errors";
import type { I18nKey } from "@stackra/i18n";

/** The refusals this package's catalogue words. */
const WORDED = new Set(["settings_locked", "setting_value_invalid"]);

/**
 * The message key of a failed write.
 *
 * @example
 * refusedWriteMessage(SettingsLockedError.create({ paths: ["marketing"] })); // "settings::refusals.settings_locked"
 */
export function refusedWriteMessage(error: unknown): I18nKey {
  return (
    isRefusal(error) && WORDED.has(error.code)
      ? `settings::refusals.${error.code}`
      : "settings::form.not_saved"
  ) as I18nKey;
}
