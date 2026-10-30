/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/message-scroller` (MessageScroller).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The MessageScroller entry of the component registry. */
export const FREE_MESSAGE_SCROLLER: ComponentEntry = {
  slug: "message-scroller",
  tier: "free",
  category: "ai",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "MessageScroller",
  parts: ["MessageScroller"],
  // HeroUI has no chat scroller; this one is a log region that sticks to the newest message.
  hero: {},
  examples: [
    { id: "streaming", card: true },
    { id: "new-count", platforms: ["react"] },
  ],
  related: ["free/scroll-area", "free/ai-mark"],
  tokens: ["color.surface", "color.focus", "motion.duration"],
  keywords: ["ai", "chat", "scroll", "stick to bottom", "new messages", "log"],
  status: "new",
};
