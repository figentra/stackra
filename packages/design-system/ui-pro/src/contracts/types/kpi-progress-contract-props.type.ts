/**
 * Stackra file contract:
 * Purpose: `KpiProgressContractProps`, props of `Kpi.Progress` that the Stackra vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-007.
 */
import type { KpiTone } from "#contracts/types/kpi-tone.type";

/** Props of `Kpi.Progress` that the Stackra vocabulary names. */
export interface KpiProgressContractProps {
  /** The colour role of the bar; HeroUI Pro's `status`. Untinted when left out. */
  readonly tone?: KpiTone | undefined;
}
