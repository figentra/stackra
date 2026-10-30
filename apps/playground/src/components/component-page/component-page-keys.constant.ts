/**
 * Stackra file contract:
 * Purpose: `COMPONENT_PAGE_KEYS`, the typed keys of the static words a component page reads from `@stackra/showcase`'s
 *          `showcase` catalogue: section headings, chips, the links row, the API table words, the Stackra section and
 *          the pager. Per-entry keys are derived (`componentKeys`, `sectionKey`).
 * Boundary: keys only; the words live in `@stackra/showcase/assets/lang/<locale>/showcase.json`. A stand-in for the
 *           `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); showcase redesign spec (2026-10-27) section 7.4.
 */
import { keys } from "@stackra/i18n";

/** The showcase keys of a component page. */
export const COMPONENT_PAGE_KEYS = keys({
  showcase: {
    section: [
      "header",
      "links",
      "import",
      "usage",
      "anatomy",
      "guidance",
      "examples",
      "playground",
      "styling",
      "accessibility",
      "rtl",
      "api",
      "stackra",
      "related",
      "pager",
    ],
    platform: ["react", "native"],
    platform_only: ["react", "native"],
    ui: [
      "copy",
      "copied",
      "copy_import",
      "copy_markdown",
      "view_options",
      "open_hero_docs",
      "show_code",
      "hide_code",
      "preview_error",
      "planned_note",
      "direction",
      "scheme",
    ],
    link: ["hero_docs", "source", "react_aria", "figma", "contract"],
    api: {
      _: [
        "prop",
        "type",
        "default",
        "description",
        "props_of",
        "render_props",
        "events",
        "animation",
        "hooks",
        "return_value",
        "replaces",
        "required",
        "deprecated",
        "extends",
        "no_props",
      ],
      source: ["stackra", "heroui", "react_aria"],
    },
    stackra: ["rtl", "brands", "tokens", "haptics", "replaced_props"],
    pager: ["previous", "next"],
    haptic: ["impact", "rigid", "selection", "success", "warning", "error"],
  },
});
