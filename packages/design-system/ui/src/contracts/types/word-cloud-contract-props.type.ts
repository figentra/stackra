/**
 * Stackra file contract:
 * Purpose: `WordCloudContractProps`, the props of every runtime's `WordCloud`: the words, the name, the number format,
 *          the palette and the height.
 * Boundary: types only. Words are set flat (never turned), the heaviest in the middle, then outward on a spiral; a
 *           word with no room left is still read in the data table.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (gap wave, 2026-10-31).
 */
import type { ChartPalette } from "#contracts/enums/chart-palette.enum";
import type { WordCloudWord } from "#contracts/types/word-cloud-word.type";

/** Props shared by the web and native `WordCloud`. */
export interface WordCloudContractProps {
  /** The words with their weights. */
  readonly words: readonly WordCloudWord[];
  /** The chart's accessible name and the data table's caption, such as "What customers mention". */
  readonly label: string;
  /** How weights are written; plain numbers in the locale by default. */
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  /** `accent` steps (the default) or the `categorical` set, by weight order. */
  readonly palette?: ChartPalette | undefined;
  /** The plot's height in pixels; 260 by default. */
  readonly height?: number | undefined;
}
