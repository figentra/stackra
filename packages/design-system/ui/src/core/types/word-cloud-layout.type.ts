/**
 * Stackra file contract:
 * Purpose: `WordCloudLayout`, a laid-out word cloud in pixels: each placed word's centre, size and palette position
 *          (`wordCloudLayoutOf`).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */
import type { WordCloudWord } from "#contracts/types/word-cloud-word.type";

/** The words that found room, heaviest first. */
export interface WordCloudLayout {
  readonly words: readonly {
    readonly word: WordCloudWord;
    /** Its place in weight order, which picks its colour. */
    readonly rank: number;
    /** The centre of its box. */
    readonly x: number;
    readonly y: number;
    readonly fontSize: number;
  }[];
  /** How many words had no room left; they are still read in the data table. */
  readonly dropped: number;
}
