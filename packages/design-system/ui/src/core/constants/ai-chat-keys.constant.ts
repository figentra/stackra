/**
 * Stackra file contract:
 * Purpose: `AI_CHAT_KEYS`, the typed keys of the AI chat components' own words in `assets/lang/<locale>/ui.json`
 *          (`ui::conversation_list.*`, `ui::message_actions.*`, `ui::message_scroller.*`, `ui::prompt_suggestions.*`,
 *          `ui::shimmer.*`).
 * Boundary: internal: the web and native components import it by path. Kept apart from `UI_KEYS` so wave D lands
 *           without editing the shared key list; it folds into `UI_KEYS` when that is next touched.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { keys } from "@stackra/i18n";

/** The AI chat components' keys. */
export const AI_CHAT_KEYS = keys({
  ui: {
    conversation_list: [
      "label",
      "pinned",
      "today",
      "yesterday",
      "previous_7_days",
      "older",
      "actions",
      "pin",
      "unpin",
      "rename",
      "delete",
      "empty_title",
      "empty_description",
    ],
    message_actions: ["label", "copy", "retry", "edit", "good", "bad"],
    message_scroller: ["label", "new_messages", "new_messages_count"],
    prompt_suggestions: ["label"],
    shimmer: ["thinking"],
  },
});
