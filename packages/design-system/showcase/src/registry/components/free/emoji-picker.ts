/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/emoji-picker` (Emoji picker).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Emoji picker. */
export const FREE_EMOJI_PICKER: ComponentEntry = {
  slug: "emoji-picker",
  tier: "free",
  category: "selection",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "EmojiPicker",
  parts: ["EmojiPicker"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/reaction-button"],
  tokens: ["color.overlay"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["emoji", "reaction", "search"],
  status: "new",
};
