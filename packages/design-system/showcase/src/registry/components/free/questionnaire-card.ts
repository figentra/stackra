/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/questionnaire-card` (QuestionnaireCard).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The QuestionnaireCard entry of the component registry. */
export const FREE_QUESTIONNAIRE_CARD: ComponentEntry = {
  slug: "questionnaire-card",
  tier: "free",
  category: "ai",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "QuestionnaireCard",
  parts: ["QuestionnaireCard"],
  // HeroUI has no questionnaire; this one is the house Card with RadioGroup, CheckboxGroup and TextArea.
  hero: {},
  examples: [{ id: "offer-brief", card: true }, { id: "edit-answers" }],
  related: ["free/ai-mark", "free/stepper", "free/radio-group"],
  tokens: ["color.surface", "color.accent", "color.focus"],
  keywords: ["ai", "assistant", "questions", "survey", "wizard", "clarify", "form"],
  status: "new",
};
