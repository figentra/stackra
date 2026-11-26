/**
 * Stackra file contract:
 * Purpose: `PACKAGE_LIST_KEYS`, the typed keys of the web PackageList demos' words in
 *          `assets/lang/<locale>/package_list.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The package_list namespace's keys. */
export const PACKAGE_LIST_KEYS = keys({
  package_list: [
    "label",
    "actions",
    "money",
    "events",
    "panel",
    "notifications",
    "integrations",
    "ui",
  ],
});
