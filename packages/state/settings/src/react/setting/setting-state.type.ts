/**
 * Stackra file contract:
 * Purpose: `SettingState`, what `useSetting` returns: one key's shown value, whether a holder above locks it, whether
 *          the stored value is still loading, the catalogue key of the last refusal, and the write.
 * Boundary: a type only, beside its hook (ADR 0305). The error is a catalogue key, never words.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 24); ADR 0305 (one declaration per file).
 */
import type { I18nKey } from "@stackra/i18n";

import type { SettingValue } from "#contracts/index";

/** One setting, read and written through the container's `SettingsReader`. */
export interface SettingState {
  /** The value shown: the key's default until the stored value loads, then the resolved one. */
  readonly value: SettingValue;
  /** True when a holder above the page's level locks the key; a write would be refused. */
  readonly isLocked: boolean;
  /** True until the first read settles. */
  readonly isLoading: boolean;
  /** The catalogue key of why the last write was not stored, or `undefined`. */
  readonly error: I18nKey | undefined;
  /**
   * Shows `value` and writes it at the page's level. A value that breaks its key is not written; a refused write
   * restores the previous value. Resolves true when the store took it.
   */
  readonly set: (value: unknown) => Promise<boolean>;
}
