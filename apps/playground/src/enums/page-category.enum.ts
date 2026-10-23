/**
 * Stackra file contract:
 * Purpose: the categories the playground groups its pages in, in navigation order: Foundations, Actions, Typography,
 *          Navigation, Surfaces, Status, Inputs, Selection and Forms. The shell's page navigation and the index page
 *          list pages under these headings; a category with no page yet is left out of both.
 * Boundary: the values only; each route class names its category, and a page with no category cannot be listed.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0294 (decision 14).
 */

/** The page categories, in the order the navigation shows them. */
// shortcut: a frozen tuple of English labels until @stackra/contracts ships Enum.of (ADR 0128) and @stackra/i18n
// ships; then `playground::category.*` keys.
export const PageCategory = Object.freeze([
  "Foundations",
  "Actions",
  "Typography",
  "Navigation",
  "Surfaces",
  "Status",
  "Inputs",
  "Selection",
  "Forms",
] as const);

/** One page category. */
export type PageCategory = (typeof PageCategory)[number];
