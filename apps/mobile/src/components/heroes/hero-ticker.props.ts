/**
 * Stackra file contract:
 * Purpose: `HeroTickerProps`: props of `HeroTicker`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */

/** Props of {@link HeroTicker}. */
export interface HeroTickerProps {
  /** The words, in order, each with its language so it takes the right face. */
  words: readonly { text: string; lang: "en" | "ar" }[];
  /** True under Reduce Motion or while paused: the row stands still. */
  isStill: boolean;
}
