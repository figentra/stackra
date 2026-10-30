/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/native-select` (Native select).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Native select entry of the component registry. */
export const FREE_NATIVE_SELECT: ComponentEntry = {
  slug: "native-select",
  tier: "free",
  category: "selection",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "NativeSelect",
  parts: ["NativeSelect"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/select", "free/inline-select"],
  tokens: ["radius.field", "color.field"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["select", "native", "platform", "dropdown"],
  status: "new",
};
