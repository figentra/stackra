/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/use-confirmation` (useConfirmation).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The useConfirmation entry of the component registry. */
export const FREE_USE_CONFIRMATION: ComponentEntry = {
  slug: "use-confirmation",
  tier: "free",
  category: "overlays",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "useConfirmation",
  parts: ["useConfirmation"],
  hero: {},
  examples: [
    { id: "questions", platforms: ["react"], card: true },
    { id: "answer", platforms: ["react"] },
    { id: "live", platforms: ["native"] },
  ],
  related: ["free/tooltip", "free/route-overlay", "free/popover"],
  tokens: ["color.overlay", "radius.base", "shadow.overlay"],
  haptics: [{ event: "open", style: "impact" }],
  keywords: ["confirm", "hook", "dialog"],
};
