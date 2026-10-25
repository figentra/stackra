/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Stat` takes: one headline figure of a dashboard tile or widget, its label, and
 *          an optional badge beside the figure (a tier, a delta).
 * Boundary: types only. A number is formatted in the provider's locale; a string is shown as given.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7).
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `Stat`. */
export interface StatContractProps {
  /** What the figure counts, shown above it. */
  readonly label: ReactNode;
  /** The figure: a number, formatted in the locale, or text already formatted. */
  readonly value: number | string;
  /** A short tag beside the figure; nothing is drawn when it is empty. */
  readonly badge?: ReactNode;
}
