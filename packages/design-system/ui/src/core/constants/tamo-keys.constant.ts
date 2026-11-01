/**
 * Stackra file contract:
 * Purpose: `TAMO_KEYS`, the typed keys of the Tamo parts' own words in `assets/lang/<locale>/ui.json` (`ui::tamo.*`):
 *          "Ask Tamo", the text actions, the review, ask-in-words, marker, status and panel words.
 * Boundary: internal: the web and native components import it by path. Kept apart from `UI_KEYS` so the AI layer
 *           lands without editing the shared key list.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages); ADR 0507.
 */
import { keys } from "@stackra/i18n";

/** The Tamo parts' keys. */
export const TAMO_KEYS = keys({
  ui: {
    tamo: [
      "summarise_none",
      "name",
      "ask",
      "actions",
      "working",
      "stop",
      "retry",
      "error",
      "rewrite",
      "shorten",
      "expand",
      "fix_grammar",
      "translate_ar",
      "translate_en",
      "formal",
      "friendly",
      "continue",
      "draft",
      "section_improve",
      "section_tone",
      "section_more",
      "before",
      "after",
      "accept",
      "edit",
      "discard",
      "apply",
      "undo",
      "keep",
      "suggestion",
      "ghost_hint",
      "made",
      "review",
      "ask_placeholder",
      "draft_placeholder",
      "proposal",
      "no_proposal",
      "filter_placeholder",
      "sort_by",
      "ascending",
      "descending",
      "date_placeholder",
      "date_range_placeholder",
      "collection",
      "ask_filter",
      "summarise",
      "summary",
      "fill_column",
      "fill_column_which",
      "fill_column_how",
      "fill_column_count",
      "fill_form",
      "fill_form_placeholder",
      "filled",
      "palette_ask",
      "palette_open",
      "panel_context",
      "panel_placeholder",
      "panel_empty",
      "shortcut",
      "you",
      "disclaimer",
      "close",
    ],
  },
});
