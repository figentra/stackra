/**
 * Stackra file contract:
 * Purpose: `EnvironmentDetail`, one environment-specific detail `findEnvironmentDetails` found in a runbook: its kind,
 *          its line and the text that matched.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0185 (decision 4); STA-27.
 */
import type { EnvironmentDetailKind } from "./environment-detail-kind";

/** One environment-specific detail found in a page. */
export interface EnvironmentDetail {
  /** What was found. */
  readonly kind: EnvironmentDetailKind;
  /** The 1-based line it is on. */
  readonly line: number;
  /** The text that matched. */
  readonly match: string;
}
