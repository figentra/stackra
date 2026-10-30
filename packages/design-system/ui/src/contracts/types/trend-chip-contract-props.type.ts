/**
 * Stackra file contract:
 * Purpose: `TrendChipContractProps`, the props of every runtime's `TrendChip`: a change against the previous period
 *          with an arrow, coloured good or bad by the direction that is better.
 * Boundary: types only. The value is a fraction (0.12 is +12%) unless `format` says otherwise.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0307 (decision 15); STA-1371.
 */
import type { TrendDirection } from "#contracts/enums/trend-direction.enum";

/** Props shared by the web and native `TrendChip`. */
export interface TrendChipContractProps {
  /** The change, as a fraction by default: 0.12 is up 12%, -0.05 down 5%, 0 flat. */
  readonly value: number;
  /** The direction that is better; `up` by default. A rise in refunds is then bad. */
  readonly better?: TrendDirection | undefined;
  /** How the change is written; a signed percent with up to one decimal by default. */
  readonly format?: Intl.NumberFormatOptions | undefined;
  /** What it compares with, read after the change: "vs last month". */
  readonly comparison?: string | undefined;
}
