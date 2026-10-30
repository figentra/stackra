/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/mode-switch` (Mode switch).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Mode switch entry of the component registry. */
export const FREE_MODE_SWITCH: ComponentEntry = {
  slug: "mode-switch",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ModeSwitch",
  parts: ["ModeSwitch"],
  hero: {},
  examples: [
    { id: "demo", platforms: ["react"], card: true },
    { id: "live", platforms: ["native"] },
    { id: "disabled", platforms: ["native"] },
  ],
  related: ["free/input-group", "free/number-field", "free/form-section"],
  tokens: ["color.field", "radius.field", "color.focus"],
  haptics: [{ event: "invalid", style: "error" }],
  keywords: ["segmented", "toggle", "mode"],
};
