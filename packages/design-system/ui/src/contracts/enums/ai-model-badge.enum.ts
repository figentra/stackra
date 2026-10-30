/**
 * Stackra file contract:
 * Purpose: the badge a `ModelPicker` model may carry: newly added, or still in beta.
 * Boundary: the values only; the words are the catalogue's (`ui::model_picker.new`, `ui::model_picker.beta`).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */

/** The kinds of model badge. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of here (ADR 0128); the kinds carry no labels.
export const AiModelBadge = Object.freeze(["new", "beta"] as const);

/** One kind of model badge. */
export type AiModelBadge = (typeof AiModelBadge)[number];
