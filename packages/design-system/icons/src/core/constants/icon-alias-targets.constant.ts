/**
 * Stackra file contract:
 * Purpose: the Lucide icon each Stackra semantic alias is drawn with, the one place a designer changes what `orders`
 *          or `customers` looks like on every screen.
 * Boundary: data only; typed over every alias, so a new alias fails to compile until it has a drawing, and the unit
 *          test fails when a target leaves the Lucide set.
 * Runtime: isomorphic
 * Governing contract: ADR 0303 (decision 10); ADR 0294 (decision 15).
 */
import type { IconAlias } from "#contracts/enums/icon-alias.enum";
import type { LucideIconName } from "#contracts/enums/lucide-icon-name.enum";

/** The Lucide name each semantic alias resolves to. */
export const ICON_ALIAS_TARGETS = Object.freeze({
  customers: "users",
  dashboard: "layout-dashboard",
  inventory: "warehouse",
  invoices: "receipt-text",
  orders: "shopping-cart",
  payments: "credit-card",
  products: "package",
  reports: "chart-column",
} as const satisfies Record<IconAlias, LucideIconName>);
