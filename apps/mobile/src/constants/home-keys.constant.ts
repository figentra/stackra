/**
 * Stackra file contract:
 * Purpose: `HOME_KEYS`, the typed keys of the showcase home, the cards, the category pager, the Search tab and the
 *          component header menu in @stackra/showcase's `assets/lang/<locale>/showcase.json` (the subset the
 *          navigation and the home read). Entry and category keys are derived by the registry functions
 *          (`componentKeys`, `categoryKeys`); the doc screen's subset is `SHOWCASE_KEYS`.
 * Boundary: keys only; the words live in the package's catalogues. A stand-in for the `#stackra/i18n` keys gen
 *           writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) sections 3.3 and 7.4; ADR 0080 (typed i18n keys); ADR 0231.
 */
import { keys } from "@stackra/i18n";

/** The showcase namespace's keys the home, the cards and the navigation read. */
export const HOME_KEYS = keys({
  showcase: {
    ui: [
      "all",
      "components",
      "count_components",
      "view_all",
      "search_placeholder",
      "no_results",
      "menu",
      "open_hero_docs",
    ],
    platform_only: ["react", "native"],
    status: ["new", "updated", "preview", "planned", "beta", "stable"],
    pager: ["previous", "next"],
    search: { reason: ["title", "keyword", "description", "heading", "prop"] },
  },
});
