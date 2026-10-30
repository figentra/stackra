/**
 * Stackra file contract:
 * Purpose: `SHELL_KEYS`, the typed keys of the playground shell's own words in `assets/lang/<locale>/shell.json`: the
 *          top bar, the Display popover and the command palette's quick actions.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The shell namespace's keys. */
export const SHELL_KEYS = keys({
  shell: {
    _: [
      "product",
      "title",
      "skip",
      "search",
      "studio",
      "settings",
      "show_settings",
      "color_scheme",
      "language",
      "material",
      "motion",
      "digits",
      "brand",
      "transition",
      "mode",
      "lang",
      "nav",
      "components",
      "docs",
      "display",
      "menu",
      "back_to_top",
      "reset",
    ],
    sections: ["appearance", "language", "motion", "showcase"],
    footer: ["copyright", "nav", "github", "changelog", "version"],
    scheme: ["light", "dark", "system"],
    materials: ["solid", "frosted", "glass", "liquid"],
    motions: ["full", "reduced", "none"],
    numerals: ["latn", "arab"],
    transitions: [
      "circle_origin",
      "slide_origin",
      "circle_center",
      "circle_top_right",
      "circle_top_left",
      "circle_bottom_right",
      "circle_bottom_left",
      "slide_rtl",
      "slide_ltr",
      "fade",
      "blur",
      "none",
    ],
    actions: ["scheme", "material", "home", "components", "components_detail", "studio_detail"],
  },
});
