/**
 * Stackra file contract:
 * Purpose: `DOC_PAGE_KEYS`, the typed keys of the doc-page chrome words in `showcase::doc.ui.*` (hero, pillars, example
 *          tabs, knobs, keyboard, RTL, guidance, tokens, typography specimen, icon search). Per-entry words are derived
 *          (`docKeys`, `categoryDocKeys`).
 * Boundary: keys only; the words live in `@stackra/showcase/assets/lang/<locale>/showcase.json`.
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); STA-1371 (doc pages wave, 2026-10-28).
 */
import { keys } from "@stackra/i18n";

/** The doc-page chrome keys. */
export const DOC_PAGE_KEYS = keys({
  showcase: {
    doc: {
      ui: [
        "suggest",
        "pillar_what",
        "pillar_when",
        "pillar_how",
        "how_web",
        "how_native",
        "tokens_count",
        "status_stable",
        "tab_preview",
        "tab_code",
        "tab_install",
        "install_hint",
        "playground",
        "playground_note",
        "density",
        "density_compact",
        "density_comfortable",
        "density_spacious",
        "reset",
        "no_knobs",
        "keyboard",
        "keys",
        "action",
        "rtl_title",
        "rtl_mirrored",
        "rtl_preview_ar",
        "rtl_preview_en",
        "rtl_preview_brand",
        "rtl_preview_ltr",
        "rtl_preview_rtl",
        "rtl_preview_scoped",
        "guidance",
        "do",
        "dont",
        "when_not",
        "alternatives",
        "anatomy_parts",
        "token_table",
        "token",
        "css_var",
        "swatch",
        "specimen_title",
        "specimen_intro",
        "specimen_sample",
        "icons_search",
        "icons_count",
        "icons_copy_hint",
        "icons_title",
      ],
    },
  },
});
