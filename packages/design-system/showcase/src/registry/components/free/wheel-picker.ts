/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/wheel-picker` (Wheel picker).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Wheel picker entry of the component registry. */
export const FREE_WHEEL_PICKER: ComponentEntry = {
  slug: "wheel-picker",
  tier: "free",
  category: "date_and_time",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "WheelPicker",
  parts: ["WheelPicker", "WheelDatePicker", "WheelTimePicker"],
  hero: {},
  examples: [{ id: "basics", card: true }, { id: "date" }, { id: "time" }],
  related: ["free/time-picker", "free/date-picker"],
  tokens: ["color.default", "color.muted"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["wheel", "spinner", "picker", "scroll"],
  status: "new",
};
