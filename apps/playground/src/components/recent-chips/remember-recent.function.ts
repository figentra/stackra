/**
 * Stackra file contract:
 * Purpose: `rememberRecent`, which moves a component path to the front of the recent list in localStorage, keeping
 *          the newest `RECENT_SIZE`.
 * Boundary: a guarded write; a browser that refuses storage keeps no recent list.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 5 (RecentChip).
 */
import { readRecent } from "#src/components/recent-chips/read-recent.function";
import { RECENT_KEY } from "#src/components/recent-chips/recent-key.constant";
import { RECENT_SIZE } from "#src/components/recent-chips/recent-size.constant";

/** Puts `path` first in the recent list. */
export function rememberRecent(path: string): void {
  try {
    const next = [path, ...readRecent().filter((recent) => recent !== path)].slice(0, RECENT_SIZE);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // shortcut: a browser that refuses storage keeps no recent list; nothing else depends on it.
  }
}
