/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/leave-confirmation` (Leave confirmation).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Leave confirmation. */
export const FREE_LEAVE_CONFIRMATION: ComponentEntry = {
  slug: "leave-confirmation",
  tier: "free",
  category: "overlays",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "LeaveConfirmation",
  parts: ["LeaveConfirmation"],
  hero: {},
  examples: [{ id: "draft", card: true }, { id: "answer" }],
  related: ["free/menu", "free/drawer", "free/modal"],
  tokens: ["color.overlay", "radius.base", "shadow.overlay"],
  keywords: ["unsaved", "leave", "guard"],
};
