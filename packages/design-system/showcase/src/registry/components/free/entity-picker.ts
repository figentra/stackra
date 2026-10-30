/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/entity-picker` (Entity picker).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Entity picker entry of the component registry. */
export const FREE_ENTITY_PICKER: ComponentEntry = {
  slug: "entity-picker",
  tier: "free",
  category: "selection",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "EntityPicker",
  parts: ["EntityPicker"],
  hero: {},
  examples: [
    { id: "basics", platforms: ["react"], card: true },
    { id: "several" },
    { id: "server", platforms: ["react"] },
    { id: "create" },
    { id: "states" },
    { id: "live" },
    { id: "single", platforms: ["native"] },
    { id: "slow", platforms: ["native"] },
    { id: "failing", platforms: ["native"] },
  ],
  related: ["free/combo-box", "free/checkbox-group", "free/radio-group"],
  tokens: ["color.accent", "radius.field", "color.focus"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["lookup", "record", "search", "select"],
};
