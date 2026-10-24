/**
 * Stackra file contract:
 * Purpose: `LocaleChoice`, what `useLocaleChoice()` returns: the visitor's remembered locale and the way to remember
 *          one.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0297 (decision 4: the choice is remembered, never read to redirect).
 */
import type { Locale } from "#core/enums/locale.enum";

/** The visitor's remembered locale choice. */
export interface LocaleChoice {
  /** The shipped locale the visitor last chose; `null` before any choice, on the server and on the first paint. */
  readonly chosen: Locale | null;

  /** Remembers `locale` as the visitor's choice (the switcher's pick, or an answer to the suggestion banner). */
  readonly choose: (locale: Locale) => void;
}
