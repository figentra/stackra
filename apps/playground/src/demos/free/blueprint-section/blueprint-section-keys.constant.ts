/**
 * Stackra file contract:
 * Purpose: `BLUEPRINT_SECTION_KEYS`, the typed keys of the web BlueprintSection demos' words in `assets/lang/<locale>/blueprint_section.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The blueprint_section namespace's keys. */
export const BLUEPRINT_SECTION_KEYS = keys({
  blueprint_section: {
    band: ["write", "write_title", "write_text", "expose", "expose_title", "expose_text"],
    plain: ["label", "title", "text"],
  },
});
