/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/message-actions` (MessageActions).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The MessageActions entry of the component registry. */
export const FREE_MESSAGE_ACTIONS: ComponentEntry = {
  slug: "message-actions",
  tier: "free",
  category: "ai",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "MessageActions",
  parts: ["MessageActions"],
  // HeroUI has no message action row; this one is HeroUI's Toolbar, CopyButton and ToggleButtons.
  hero: {},
  examples: [{ id: "basics", card: true }, { id: "feedback" }],
  related: ["free/copy-button", "free/reaction-button", "free/ai-mark"],
  tokens: ["color.accent", "color.success", "color.focus"],
  keywords: ["ai", "chat", "copy", "retry", "feedback", "thumbs up", "toolbar"],
  status: "new",
};
