/**
 * Stackra file contract:
 * Purpose: `axisOf`, the Recharts axis props of one series: `{ yAxisId: "secondary" }` when its key is among the
 *          chart's `secondaryKeys`, nothing otherwise, so it reads against the first value axis.
 * Boundary: pure.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); STA-1371.
 */
import { SECONDARY_AXIS } from "#react/chart/secondary-axis.constant";

/** The axis a series reads against, as props to spread on its Recharts mark. */
export function axisOf(
  key: string,
  secondaryKeys: readonly string[] | undefined,
): { readonly yAxisId?: string } {
  return secondaryKeys?.includes(key) ? { yAxisId: SECONDARY_AXIS } : {};
}
