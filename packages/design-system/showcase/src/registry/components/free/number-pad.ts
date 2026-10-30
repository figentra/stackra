/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/number-pad` (Number pad).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Number pad. */
export const FREE_NUMBER_PAD: ComponentEntry = {
  slug: "number-pad",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "NumberPad",
  parts: ["NumberPad"],
  hero: {},
  examples: [{ id: "amount", card: true }, { id: "pin" }],
  related: ["free/number-field", "free/money-field", "free/password-field"],
  tokens: ["color.surface", "radius.base"],
  haptics: [{ event: "key", style: "selection" }],
  keywords: ["keypad", "pos", "pin", "amount"],
  status: "new",
};
