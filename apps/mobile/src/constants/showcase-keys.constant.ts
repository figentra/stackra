/**
 * Stackra file contract:
 * Purpose: `SHOWCASE_KEYS`, the typed keys of the component screen's words in @stackra/showcase's
 *          `assets/lang/<locale>/showcase.json` (the subset the mobile doc screen reads). Entry, example and category
 *          keys are derived by the registry functions (`componentKeys`, `categoryKeys`, `sectionKey`).
 * Boundary: keys only; the words live in the package's catalogues. A stand-in for the `#stackra/i18n` keys gen
 *           writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 7.4; ADR 0080 (typed i18n keys); ADR 0231.
 */
import { keys } from "@stackra/i18n";

/** The showcase namespace's keys the doc screen reads. */
export const SHOWCASE_KEYS = keys({
  showcase: {
    section: [
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
    doc_tab: ["preview", "usage", "api", "docs", "hooks"],
    platform_only: ["react", "native"],
    status: ["new", "updated", "preview", "planned", "beta", "stable"],
    ui: [
      "copy",
      "copied",
      "copy_import",
      "open_hero_docs",
      "show_code",
      "view_code",
      "preview_error",
      "planned_note",
      "menu",
    ],
    link: ["hero_docs", "source", "react_aria", "figma"],
    api: {
      _: [
        "default",
        "props_of",
        "render_props",
        "events",
        "animation",
        "return_value",
        "replaces",
        "required",
        "deprecated",
        "extends",
        "machine_translation",
      ],
      source: ["stackra", "heroui", "react_aria"],
    },
    stackra: ["rtl", "tokens", "haptics", "feel_it"],
    pager: ["previous", "next"],
    haptic: ["impact", "rigid", "selection", "success", "warning", "error"],
  },
});
