/**
 * Stackra file contract:
 * Purpose: `DOCS_KEYS`, the typed keys of the Docs home's words in `assets/lang/<locale>/docs.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The docs namespace's keys. */
export const DOCS_KEYS = keys({
  docs: {
    _: ["title", "eyebrow", "headline", "intro"],
    start: ["title", "install", "install_body", "provider", "provider_body", "use", "use_body"],
    sections: ["foundations", "foundations_body", "guides", "guides_body"],
    guides: [
      "components",
      "components_body",
      "studio",
      "studio_body",
      "overlays",
      "overlays_body",
      "rtl",
      "rtl_body",
      "llms",
      "llms_body",
    ],
  },
});
