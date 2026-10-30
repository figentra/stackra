/**
 * Stackra file contract:
 * Purpose: `SHELL_KEYS`, the typed keys of the review area's shared chrome in `assets/lang/<locale>/shell.json`: the
 *          display switcher (the React sheet and the native iOS bar item) and the tab titles.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The shell namespace's keys. */
export const SHELL_KEYS = keys({
  shell: {
    _: ["open", "title", "description", "color_scheme", "language", "haptics", "brand", "digits"],
    scheme: ["light", "dark", "system"],
    numerals: ["latn", "arab"],
    tabs: ["home", "settings", "search"],
  },
});
