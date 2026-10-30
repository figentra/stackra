/**
 * Stackra file contract:
 * Purpose: `gaugeAngleOf`, where a value sits on a gauge's arc, in degrees clockwise from the top, clamped to the arc.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import { GAUGE_SWEEP } from "#core/constants/gauge-sweep.constant";

/**
 * The angle of `value` between `min` and `max`.
 * @example gaugeAngleOf(50, 0, 100); // 0 (the top)
 */
export function gaugeAngleOf(value: number, min: number, max: number): number {
  const share = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
  return GAUGE_SWEEP.start + share * GAUGE_SWEEP.sweep;
}
