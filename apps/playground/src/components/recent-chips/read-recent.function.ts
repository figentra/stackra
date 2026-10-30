/**
 * Stackra file contract:
 * Purpose: `readRecent`, the recently viewed component paths from this browser's localStorage, newest first; empty
 *          when storage is refused or holds nonsense.
 * Boundary: a guarded read; nothing else depends on storage working.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 5 (RecentChip).
 */
import { RECENT_KEY } from "#src/components/recent-chips/recent-key.constant";

/** The recent paths, newest first. */
export function readRecent(): readonly string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((path) => typeof path === "string") : [];
  } catch {
    return [];
  }
}
