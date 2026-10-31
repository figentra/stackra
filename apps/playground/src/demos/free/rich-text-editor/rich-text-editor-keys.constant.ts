/**
 * Stackra file contract:
 * Purpose: `RICH_TEXT_EDITOR_KEYS`, the typed keys of the web RichTextEditor demos' words in
 *          `assets/lang/<locale>/rich_text_editor.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const RICH_TEXT_EDITOR_KEYS = keys({
  rich_text_editor: {
    basic: ["label", "placeholder", "description"],
    controlled: ["label", "heading", "body", "reset", "output"],
    read_only: ["label", "heading", "body", "item_1", "item_2"],
    arabic: ["label", "placeholder", "heading", "body"],
    contributions: ["label", "sample", "tidy", "words", "reading"],
  },
});
