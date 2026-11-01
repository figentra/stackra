/**
 * Stackra file contract:
 * Purpose: `TamoActionKind`, the built-in actions of Tamo's action menu on a text: rewrite, shorten, expand, fix the grammar,
 *          translate between English and Arabic, and two tones.
 * Boundary: the values only; a module adds its own actions as `TamoActionItem`s on the slot, never here.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0466 (decision 4: the same actions in the editor).
 */
/** The built-in Tamo text actions. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of here (ADR 0128); the words are the catalogue's.
export const TamoActionKind = Object.freeze([
  "rewrite",
  "shorten",
  "expand",
  "fix_grammar",
  "translate",
  "formal",
  "friendly",
] as const);

/** One built-in Tamo text action. */
export type TamoActionKind = (typeof TamoActionKind)[number];
