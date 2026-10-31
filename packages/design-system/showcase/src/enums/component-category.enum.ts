/**
 * Stackra file contract:
 * Purpose: `ComponentCategory`, the thirteen showcase categories (machine codes), in navigation order. Web and mobile
 *          both list components under them; titles and descriptions are `showcase::category.<id>.*` keys. `blocks` holds
 *          the module kits' domain blocks (ADR 0503).
 * Boundary: the values only; `CATEGORIES` adds glyph and order.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2; ADR 0305 (one declaration per file).
 */

/** The showcase categories, in navigation order. */
export const ComponentCategory = Object.freeze([
  "foundations",
  "actions",
  "inputs_and_forms",
  "selection",
  "date_and_time",
  "charts",
  "data_display",
  "feedback_and_status",
  "navigation",
  "overlays",
  "layout",
  "blocks",
  "ai",
] as const);

/** One showcase category. */
export type ComponentCategory = (typeof ComponentCategory)[number];
