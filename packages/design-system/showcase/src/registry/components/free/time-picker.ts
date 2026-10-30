/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/time-picker` (Time picker).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Time picker. */
export const FREE_TIME_PICKER: ComponentEntry = {
  slug: "time-picker",
  tier: "free",
  category: "date_and_time",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TimePicker",
  parts: ["TimePicker"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/time-field", "free/wheel-picker"],
  tokens: ["radius.field", "color.overlay"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["time", "picker", "clock", "wheel"],
  status: "new",
};
