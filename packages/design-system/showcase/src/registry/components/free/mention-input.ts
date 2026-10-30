/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/mention-input` (MentionInput).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave C, owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The MentionInput entry of the component registry. */
export const FREE_MENTION_INPUT: ComponentEntry = {
  slug: "mention-input",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "MentionInput",
  parts: ["MentionInput"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/comment-thread", "free/text-area", "free/tag-input"],
  tokens: ["color.field", "color.overlay"],
  haptics: [{ event: "select", style: "selection" }],
  keywords: ["mention", "at mention", "@", "tag people", "notify", "comment"],
  status: "new",
};
