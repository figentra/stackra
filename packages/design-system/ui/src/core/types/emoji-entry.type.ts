/**
 * Stackra file contract:
 * Purpose: `EmojiEntry`, one emoji of `EMOJI_SET` and its search words.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305 (rules 10 to 13).
 */

/** One emoji and its search words. */
export interface EmojiEntry {
  readonly emoji: string;
  readonly words: string;
}
