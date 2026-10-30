/**
 * Stackra file contract:
 * Purpose: `FORM_SECTION_DEMO_KEYS`, the typed keys of the native form-section demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The form-section demos' keys. */
export const FORM_SECTION_DEMO_KEYS = keys({
  demo_free: {
    form_section: {
      live: [
        "address",
        "billing",
        "billing_hint",
        "disable",
        "display_name",
        "profile",
        "profile_hint",
        "vat_number",
      ],
      parts: ["company", "country", "hint", "name", "several", "title_only", "with_description"],
    },
  },
});
