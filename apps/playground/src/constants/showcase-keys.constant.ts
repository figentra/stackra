/**
 * Stackra file contract:
 * Purpose: `SHOWCASE_KEYS`, the typed keys of the static words of `@stackra/showcase`'s `showcase` catalogue the
 *          playground's shell, index and cards read: the UI words, statuses, platforms, the home page, the
 *          search groups and the section labels. Per-entry keys are derived (`componentKeys`, `categoryKeys`).
 * Boundary: keys only; the words live in `@stackra/showcase/assets/lang/<locale>/showcase.json`. A stand-in for the
 *           `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); showcase redesign spec section 7.4.
 */
import { keys } from "@stackra/i18n";

/** The showcase namespace's static keys. */
export const SHOWCASE_KEYS = keys({
  showcase: {
    section: [
      "header",
      "links",
      "import",
      "usage",
      "anatomy",
      "examples",
      "styling",
      "accessibility",
      "api",
      "stackra",
      "related",
      "pager",
    ],
    section_tab: ["overview", "examples", "styling", "api", "a11y", "stackra"],
    platform: ["react", "native"],
    platform_only: ["react", "native"],
    status: ["new", "updated", "preview", "planned", "beta", "stable"],
    ui: [
      "all",
      "components",
      "count_components",
      "view_all",
      "search_placeholder",
      "no_results",
      "filter",
      "recently_viewed",
      "on_this_page",
      "preview_error",
      "planned_note",
      "menu",
    ],
    home: ["title", "browse", "theme_studio", "categories"],
    search: {
      _: ["components", "sections", "categories"],
      reason: ["title", "keyword", "description", "heading", "prop"],
    },
  },
});
