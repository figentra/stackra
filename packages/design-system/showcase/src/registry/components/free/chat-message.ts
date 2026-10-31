/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/chat-message` (ChatMessage).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (component gaps, owner approval
 *          2026-10-31).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The ChatMessage entry of the component registry. */
export const FREE_CHAT_MESSAGE: ComponentEntry = {
  slug: "chat-message",
  tier: "free",
  category: "ai",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ChatMessage",
  parts: ["ChatMessage"],
  // HeroUI has no chat message; this one is our Shimmer and the caller's Avatar, attachments and MessageActions.
  hero: {},
  examples: [{ id: "conversation", card: true }, { id: "loading" }],
  related: ["free/message-actions", "free/message-scroller", "free/prompt-input"],
  tokens: ["color.default", "color.foreground", "radius.container"],
  keywords: ["ai", "chat", "message", "bubble", "assistant", "turn", "conversation"],
  status: "new",
};
