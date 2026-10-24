/**
 * Stackra file contract:
 * Purpose: the categories the design-system review area lists its components in, in display order: Foundations,
 *          Actions, Inputs and forms, Selection, Date and time, Charts, Data display, Feedback and status, Navigation,
 *          Overlays, Layout and AI (the owner's catalogue taxonomy, shared with the web playground). A category with
 *          no component is not shown. Free and Pro components share a category: the tier is a badge, not a category.
 * Boundary: the values only; each row of `design-system-components.ts` names its category.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); ADR 0294 (decision 14).
 */

/** The component categories, in the order the review area shows them. */
// shortcut: a frozen tuple of English labels until @stackra/contracts ships Enum.of (ADR 0128) and @stackra/i18n
// reaches the mobile app; then `mobile::category.*` keys.
export const ComponentCategory = Object.freeze([
  "Foundations",
  "Actions",
  "Inputs and forms",
  "Selection",
  "Date and time",
  "Charts",
  "Data display",
  "Feedback and status",
  "Navigation",
  "Overlays",
  "Layout",
  "AI",
] as const);

/** One component category. */
export type ComponentCategory = (typeof ComponentCategory)[number];
