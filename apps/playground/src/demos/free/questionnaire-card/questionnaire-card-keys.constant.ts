/**
 * Stackra file contract:
 * Purpose: `QUESTIONNAIRE_CARD_KEYS`, the typed keys of the web QuestionnaireCard demos' words in
 *          `assets/lang/<locale>/questionnaire_card.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const QUESTIONNAIRE_CARD_KEYS = keys({
  questionnaire_card: {
    offer_brief: [
      "title",
      "description",
      "goal",
      "goal_clear",
      "goal_return",
      "goal_launch",
      "branches",
      "branches_hint",
      "olaya",
      "tahlia",
      "online",
      "discount",
      "up_to_10",
      "up_to_20",
      "up_to_30",
      "avoid",
      "avoid_placeholder",
      "sent",
    ],
    edit_answers: [
      "title",
      "description",
      "period",
      "this_week",
      "last_week",
      "this_month",
      "metrics",
      "revenue",
      "orders",
      "returns",
      "basket",
      "format",
      "pdf",
      "excel",
      "submit",
      "built",
    ],
  },
});
