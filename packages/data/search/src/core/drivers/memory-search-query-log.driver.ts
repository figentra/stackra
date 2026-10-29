/**
 * Stackra file contract:
 * Purpose: the in-memory `SearchQueryLog` for tests and `driver: "memory"`: logged reads and clicks held in an array
 *          for the life of the container, and popular phrases counted from them.
 * Boundary: the memory driver every capability ships first (ADR 0266); isomorphic, so it ships from `.`. It answers
 *           `popular` from the entries of every scope (it has no session to narrow by), so it is for a single-scope
 *           test or dev process only. Nothing survives a restart.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0294 (decision 16); data-layer gaps se12 and se13
 *                     (stackra-326).
 */
import { Driver } from "@stackra/container";

import { SearchQueryLog } from "#contracts/index";
import type { SearchQueryEntry } from "#contracts/index";

/**
 * Holds the query log in memory.
 *
 * @example
 * const search = new Search(new MemorySearchDriver(), database, settings, new MemorySearchQueryLogDriver());
 */
export class MemorySearchQueryLogDriver extends Driver(SearchQueryLog) {
  /** Every entry, in the order logged. */
  readonly entries: SearchQueryEntry[] = [];

  /** Keeps `entry` in `entries`. */
  async record(entry: SearchQueryEntry): Promise<void> {
    this.entries.push(entry);
  }

  /** The most frequent logged phrases of `model` that start with `prefix` and found rows, most frequent first. */
  async popular(model: string, prefix: string, limit: number): Promise<readonly string[]> {
    const counts = new Map<string, number>();
    for (const entry of this.entries)
      if (
        entry.model === model &&
        entry.phrase !== null &&
        entry.phrase.startsWith(prefix) &&
        (entry.hits ?? 0) > 0
      )
        counts.set(entry.phrase, (counts.get(entry.phrase) ?? 0) + 1);
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    const ranked = [...counts].sort(([a, x], [b, y]) => y - x || (a < b ? -1 : a > b ? 1 : 0));
    return ranked.slice(0, limit).map(([phrase]) => phrase);
  }
}
