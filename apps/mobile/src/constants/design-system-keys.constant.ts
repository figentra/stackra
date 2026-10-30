/**
 * Stackra file contract:
 * Purpose: `DESIGN_SYSTEM_KEYS`, the typed keys of the review area's landing in `assets/lang/<locale>/design_system.json`:
 *          the hero, the search, the section headings and the live showcase's three scenes.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The design_system namespace's keys. */
export const DESIGN_SYSTEM_KEYS = keys({
  design_system: {
    _: [
      "eyebrow",
      "product",
      "title",
      "intro",
      "browse",
      "search",
      "search_placeholder",
      "results",
      "empty",
    ],
    stats: ["pages", "categories", "schemes", "directions"],
    sections: ["showcase", "showcase_note", "components", "components_note"],
    showcase: {
      invite: [
        "title",
        "description",
        "email",
        "placeholder",
        "admin",
        "send",
        "sent",
        "sent_anyone",
      ],
      deploys: ["title", "description", "released", "live", "building", "failed"],
      filters: ["title", "description", "search", "paid", "shipped", "reset", "count"],
    },
  },
});
