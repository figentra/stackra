/**
 * Stackra file contract:
 * Purpose: `FORM_SECTION_KEYS`, the typed keys of the web Form section demos' words in `assets/lang/<locale>/form_section.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The form_section namespace's keys. */
export const FORM_SECTION_KEYS = keys({
  form_section: [
    "title_only",
    "with_description",
    "description",
    "several",
    "name",
    "company",
    "country",
    "disabled_section",
    "kept",
    "live_name",
    "profile",
    "profile_description",
    "display_name",
    "billing",
    "billing_description",
    "address",
    "vat_number",
    "disable_billing",
  ],
});
