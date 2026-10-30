/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/reaction-button` (Reaction button).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Reaction button entry of the component registry. */
export const FREE_REACTION_BUTTON: ComponentEntry = {
  slug: "reaction-button",
  tier: "free",
  category: "actions",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ReactionButton",
  parts: ["ReactionButton"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/emoji-picker"],
  tokens: ["color.accent-soft"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["reaction", "emoji", "like", "count"],
  status: "new",
};
