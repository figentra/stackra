/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/blueprint-section` (BlueprintSection).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-2041 (the Stackra landing, blueprint primitives).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The BlueprintSection entry of the component registry. */
export const FREE_BLUEPRINT_SECTION: ComponentEntry = {
  slug: "blueprint-section",
  tier: "free",
  category: "layout",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "BlueprintSection",
  parts: ["BlueprintSection"],
  // HeroUI has no ruled page band; this is the blueprint direction on the blueprint roles.
  hero: {},
  examples: [{ id: "band", card: true }, { id: "plain" }],
  related: ["free/section-dock", "free/schematic", "free/frame"],
  tokens: ["blueprint.rule", "blueprint.rule-width", "blueprint.mark-size", "color.accent"],
  keywords: ["blueprint", "section", "band", "rule", "crosshair", "landing", "marketing"],
  status: "new",
};
