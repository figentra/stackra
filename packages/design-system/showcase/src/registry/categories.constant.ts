/**
 * Stackra file contract:
 * Purpose: `CATEGORIES`, the twelve categories with the brand glyph each wears, in navigation order.
 * Boundary: data only; titles and descriptions are `showcase::category.<id>.*` keys.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.
 */
import type { CategoryEntry } from "#src/types/category-entry.type";

/** The categories, in navigation order. */
export const CATEGORIES: readonly CategoryEntry[] = Object.freeze([
  { id: "foundations", glyph: "token", order: 0 },
  { id: "actions", glyph: "pipeline", order: 1 },
  { id: "inputs_and_forms", glyph: "terminal", order: 2 },
  { id: "selection", glyph: "check", order: 3 },
  { id: "date_and_time", glyph: "schema", order: 4 },
  { id: "charts", glyph: "graph", order: 5 },
  { id: "data_display", glyph: "module", order: 6 },
  { id: "feedback_and_status", glyph: "alert", order: 7 },
  { id: "navigation", glyph: "link", order: 8 },
  { id: "overlays", glyph: "package", order: 9 },
  { id: "layout", glyph: "menu", order: 10 },
  { id: "ai", glyph: "provider", order: 11 },
]);
