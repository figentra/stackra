/**
 * Stackra file contract:
 * Purpose: the props every runtime's `LocaleSwitcher` takes: the language of the app, each written in its own
 *          language ("العربية", "English").
 * Boundary: types only; the switch itself (direction, reload) is the app's.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0403.
 */

/** Props shared by the web and native `LocaleSwitcher`. */
export interface LocaleSwitcherContractProps {
  /** The locales offered, as BCP 47 tags. */
  readonly locales: readonly string[];
  /** The active locale. */
  readonly value: string;
  /** Called with the locale chosen. */
  readonly onChange?: ((locale: string) => void) | undefined;
  /** The visible label; defaults to the `ui` catalogue's "Language". */
  readonly label?: string | undefined;
}
