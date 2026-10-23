/**
 * Stackra file contract:
 * Purpose: the Stackra semantic icon names: a domain word (`orders`, `customers`) a declaration can use instead of
 *          naming the drawing, so a screen says what the icon means and the design can change the drawing in one place.
 * Boundary: the names only; the drawing each one resolves to is `ICON_ALIAS_TARGETS` in core. None of them is a
 *          Lucide name, so a name is never both.
 * Runtime: isomorphic
 * Governing contract: ADR 0303 (decision 10); ADR 0294 (decision 15, contracts are a leaf).
 */

/** The semantic icon names a declaration may use, each resolved to a Lucide icon by core. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the names carry no labels.
export const IconAlias = Object.freeze([
  "customers",
  "dashboard",
  "inventory",
  "invoices",
  "orders",
  "payments",
  "products",
  "reports",
] as const);

/** One semantic icon name. */
export type IconAlias = (typeof IconAlias)[number];
