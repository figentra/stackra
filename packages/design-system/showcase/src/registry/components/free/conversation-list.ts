/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/conversation-list` (ConversationList).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The ConversationList entry of the component registry. */
export const FREE_CONVERSATION_LIST: ComponentEntry = {
  slug: "conversation-list",
  tier: "free",
  category: "ai",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ConversationList",
  parts: ["ConversationList"],
  // HeroUI has no conversation list; this one is a React Aria GridList with sections on web.
  hero: {},
  examples: [
    { id: "support-history", card: true },
    { id: "actions" },
    { id: "empty", platforms: ["react"] },
  ],
  related: ["free/listbox", "free/action-menu", "free/empty-state"],
  tokens: ["color.accent", "color.surface", "color.focus"],
  keywords: ["ai", "chat", "history", "conversations", "threads", "sidebar"],
  status: "new",
};
