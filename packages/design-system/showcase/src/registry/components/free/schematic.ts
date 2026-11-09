/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/schematic` (Schematic, SchematicNode).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-2041 (the Stackra landing, blueprint primitives).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Schematic entry of the component registry. */
export const FREE_SCHEMATIC: ComponentEntry = {
  slug: "schematic",
  tier: "free",
  category: "layout",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "Schematic",
  parts: ["Schematic", "SchematicNode"],
  // HeroUI has no diagram of joined parts; measured SVG pipes on the blueprint roles.
  hero: {},
  examples: [{ id: "split", card: true }, { id: "chain" }],
  related: ["free/frame", "free/blueprint-section", "free/tree-diagram"],
  tokens: ["blueprint.pipe", "blueprint.pipe-width", "blueprint.junction-size"],
  keywords: ["schematic", "pipeline", "pipes", "connectors", "diagram", "flow", "blueprint"],
  status: "new",
};
