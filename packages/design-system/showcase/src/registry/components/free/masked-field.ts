/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/masked-field` (MaskedField).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave C, owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The MaskedField entry of the component registry. */
export const FREE_MASKED_FIELD: ComponentEntry = {
  slug: "masked-field",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "MaskedField",
  parts: ["MaskedField"],
  hero: {},
  examples: [{ id: "patterns", card: true }, { id: "raw" }],
  related: ["free/text-field", "free/phone-field", "free/otp-input"],
  tokens: ["color.field", "radius.field"],
  keywords: ["mask", "input mask", "pattern", "iban", "card number", "phone", "format as you type"],
  status: "new",
};
