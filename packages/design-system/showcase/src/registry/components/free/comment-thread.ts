/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/comment-thread` (Comment thread).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave 3b: data and dashboard).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Comment thread entry of the component registry. */
export const FREE_COMMENT_THREAD: ComponentEntry = {
  slug: "comment-thread",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "CommentThread",
  parts: ["CommentThread"],
  hero: {},
  examples: [{ id: "discussion", card: true }],
  related: ["free/avatar", "free/text-area", "free/notifications-panel"],
  tokens: ["color.accent-soft", "color.success", "color.muted"],
  keywords: ["comments", "discussion", "mentions", "resolve", "thread", "reply"],
  status: "new",
};
