/**
 * Stackra file contract:
 * Purpose: `emojiMatches(query)`, the emoji of `EMOJI_SET` whose words start with each word of `query`.
 * Boundary: pure; every emoji for an empty query; English words only for now (see `EMOJI_SET`).
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28).
 */
import { EMOJI_SET } from "#core/constants/emoji-set.constant";

/**
 * The emoji that match a query.
 * @param query - what was typed
 * @returns the matching emoji in set order
 */
export function emojiMatches(query: string): string[] {
  const wanted = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return Object.values(EMOJI_SET)
    .flat()
    .filter(({ words }) => {
      const own = words.split(" ");
      return wanted.every((word) => own.some((candidate) => candidate.startsWith(word)));
    })
    .map(({ emoji }) => emoji);
}
