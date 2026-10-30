/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/drop-zone` (Drop zone).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Drop zone entry of the component registry. */
export const FREE_DROP_ZONE: ComponentEntry = {
  slug: "drop-zone",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "DropZone",
  parts: ["DropZone"],
  hero: {},
  examples: [
    { id: "basics", card: true },
    { id: "paste", platforms: ["react"] },
    { id: "previews" },
  ],
  related: ["free/file-trigger", "free/attachment-card"],
  tokens: ["color.accent-soft", "radius.surface"],
  keywords: ["upload", "files", "drag", "drop", "paste", "camera", "preview"],
  status: "new",
};
