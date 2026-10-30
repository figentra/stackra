/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/quantity-stepper` (Quantity stepper).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Quantity stepper entry of the component registry. */
export const FREE_QUANTITY_STEPPER: ComponentEntry = {
  slug: "quantity-stepper",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "QuantityStepper",
  parts: ["QuantityStepper"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/number-field", "free/button"],
  tokens: ["color.surface", "radius.full"],
  haptics: [{ event: "step", style: "impact" }],
  keywords: ["quantity", "stepper", "cart", "counter"],
  status: "new",
};
