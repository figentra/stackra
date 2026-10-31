/**
 * Stackra file contract:
 * Purpose: `WordCloudWord`, one word of a word cloud and its weight.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";

/** One word and how much it counts. */
export interface WordCloudWord {
  /** The word or short phrase. */
  readonly text: string;
  /** Its weight, such as how often it appears; zero and negative words are left out. */
  readonly value: number;
  /** Its theme colour; the palette's, by weight order, by default. */
  readonly color?: ChartColor | undefined;
}
