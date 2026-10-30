/**
 * Stackra file contract:
 * Purpose: `FunnelRow`, one funnel step with its share of the first step and its conversion (`funnelRowsOf`).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */
import type { FunnelStage } from "#contracts/types/funnel-stage.type";

/** One step with its share and conversion. */
export interface FunnelRow {
  /** The step as the caller gave it. */
  readonly stage: FunnelStage;
  /** Its value over the first step's. */
  readonly share: number;
  /** Its value over the step before's; null for the first step or after an empty one. */
  readonly conversion: number | null;
}
