/**
 * Stackra file contract:
 * Purpose: `LABEL_PURPOSE`, the purpose codes of the label templates fresh, shelf and counter teams print: a shelf
 *          label (price, unit price, barcode), a food label (ingredients, allergens, weight, dates, barcode) and a
 *          short-dated label (the reduced price over the struck-through one, the new date).
 * Boundary: codes only, set as a template's `purpose` so a studio or a till lists the templates of one purpose. The
 *           layout, the wording, the fields and the reduction rules are the template's and the caller's data; a new
 *           purpose is a new code, never a new renderer.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 1: labels are templates); ADR 0363 (configuration, not code).
 */

/** The purpose codes of the shipped label kinds. */
export const LABEL_PURPOSE = {
  /** A shelf-edge label. */
  Shelf: "label.shelf",
  /** A pre-packed or counter food label. */
  Food: "label.food",
  /** A reduction sticker for goods near their date. */
  ShortDated: "label.short-dated",
} as const;
