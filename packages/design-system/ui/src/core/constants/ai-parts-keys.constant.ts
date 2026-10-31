/**
 * Stackra file contract:
 * Purpose: `AI_PARTS_KEYS`, the typed keys of the generic AI parts' own words in `assets/lang/<locale>/ui.json`
 *          (`ui::chat_message.*`, `ui::prompt_input.*`, `ui::reasoning.*`, `ui::sources.*`).
 * Boundary: internal: the web and native components import it by path. Kept apart from `UI_KEYS` so the gap wave
 *           lands without editing the shared key list; it folds into `UI_KEYS` when that is next touched.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages);
 *          STA-1371 (component gaps, owner approval 2026-10-31).
 */
import { keys } from "@stackra/i18n";

/** The AI parts' keys. */
export const AI_PARTS_KEYS = keys({
  ui: {
    chat_message: ["user", "assistant"],
    prompt_input: ["label", "placeholder", "send", "stop"],
    reasoning: ["summary", "steps"],
    sources: ["label", "count", "document"],
  },
});
