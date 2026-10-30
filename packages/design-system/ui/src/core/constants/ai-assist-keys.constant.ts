/**
 * Stackra file contract:
 * Purpose: `AI_ASSIST_KEYS`, the typed keys of the QuestionnaireCard's, ModelPicker's and VoiceInput's own words in
 *          `assets/lang/<locale>/ui.json` (`ui::questionnaire_card.*`, `ui::model_picker.*`, `ui::voice_input.*`).
 * Boundary: internal: the web and native components import it by path. Kept apart from `UI_KEYS` so the wave D
 *           components land without editing the shared key list.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { keys } from "@stackra/i18n";

/** The AI assist components' keys. */
export const AI_ASSIST_KEYS = keys({
  ui: {
    questionnaire_card: [
      "from_assistant",
      "progress",
      "back",
      "next",
      "skip",
      "review",
      "submit",
      "summary",
      "edit",
      "edit_answer",
      "other",
      "other_label",
      "skipped",
    ],
    model_picker: ["label", "placeholder", "context", "new", "beta", "unavailable"],
    voice_input: [
      "start",
      "stop",
      "idle",
      "requesting",
      "listening",
      "cancel_hint",
      "processing",
      "denied",
      "error",
      "cancelled",
    ],
  },
});
