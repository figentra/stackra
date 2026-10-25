/**
 * Stackra file contract:
 * Purpose: `Translation`, what `useTranslation()` returns: the `t` of the active locale.
 * Boundary: type only; `t` is a closure, so destructuring it (`const { t } = this.translation`) is safe.
 * Runtime: isomorphic
 * Governing contract: ADR 0268 (R15), ADR 0080.
 */
import type { I18nKey } from "#core/types/i18n-key.type";

/** The translator of the active locale. */
export interface Translation {
  /**
   * The message of `key` formatted with `values` (ICU arguments).
   *
   * @throws RangeError when the loaded catalogues hold no message for `key`.
   */
  readonly t: (key: I18nKey, values?: Readonly<Record<string, unknown>>) => string;
}
