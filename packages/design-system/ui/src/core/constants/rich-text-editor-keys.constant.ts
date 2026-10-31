/**
 * Stackra file contract:
 * Purpose: `RICH_TEXT_EDITOR_KEYS`, the typed keys of the RichTextEditor's own words in `assets/lang/<locale>/ui.json`
 *          (`ui::rich_text_editor.*`): the toolbar's name, each button's name, the link form and the character count.
 * Boundary: internal: the web and native components import it by path.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages).
 */
import { keys } from "@stackra/i18n";

/** The RichTextEditor's keys. */
export const RICH_TEXT_EDITOR_KEYS = keys({
  ui: {
    rich_text_editor: [
      "toolbar",
      "bold",
      "italic",
      "underline",
      "strike",
      "heading",
      "bullet_list",
      "ordered_list",
      "blockquote",
      "code",
      "link",
      "link_address",
      "link_apply",
      "link_remove",
      "undo",
      "redo",
      "count",
      "count_limit",
      "unsupported",
    ],
  },
});
