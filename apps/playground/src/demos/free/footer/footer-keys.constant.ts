/**
 * Stackra file contract:
 * Purpose: `FOOTER_KEYS`, the typed keys of the web Footer demos' words in `assets/lang/<locale>/footer.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const FOOTER_KEYS = keys({
  footer: {
    storefront: [
      "brand",
      "nav",
      "tagline",
      "shop",
      "new_in",
      "abayas",
      "home",
      "help",
      "shipping",
      "returns",
      "contact",
      "company",
      "about",
      "careers",
      "instagram",
      "copyright",
      "privacy",
      "terms",
      "locale",
    ],
    minimal: ["copyright", "privacy", "terms"],
  },
});
