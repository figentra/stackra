/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Stat` takes: one headline figure of a dashboard tile or widget, its label, an
 *          optional badge beside the figure (a tier, a delta), and the KPI extras: a trend chip against the previous
 *          period, a sparkline, a target bar and a drill-down press (ADR 0307 decision 15).
 * Boundary: types only. A number is formatted in the provider's locale; a string is shown as given.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7).
 */
import type { ReactNode } from "react";

import type { TrendDirection } from "#contracts/enums/trend-direction.enum";

/** Props shared by the web and native `Stat`. */
export interface StatContractProps {
  /** What the figure counts, shown above it. */
  readonly label: ReactNode;
  /** The figure: a number, formatted in the locale, or text already formatted. */
  readonly value: number | string;
  /** A short tag beside the figure; nothing is drawn when it is empty. */
  readonly badge?: ReactNode;
  /** The change against the previous period as a fraction (0.12 is up 12%), drawn as a `TrendChip`. */
  readonly trend?: number | undefined;
  /**
   * The previous period's figure: a muted "Previous period" line under the figure, formatted like it, and, when
   * `trend` is left out and `value` is a number, the trend worked out from the two.
   */
  readonly previousValue?: number | undefined;
  /** The direction that is better for the trend's colour; `up` by default. */
  readonly better?: TrendDirection | undefined;
  /** What the trend compares with: "vs last month". */
  readonly comparison?: string | undefined;
  /** The recent values, oldest first, drawn as an area sparkline under the figure. */
  readonly sparkline?: readonly number[] | undefined;
  /** The goal for a numeric `value`: a bar shows how far along it is. */
  readonly target?: number | undefined;
  /** The drill-down: the whole tile becomes a button that opens the detail. */
  readonly onPress?: (() => void) | undefined;
  /** The drill-down button's description ("Open Revenue" by default); its name is what the tile shows. */
  readonly pressLabel?: string | undefined;
}
