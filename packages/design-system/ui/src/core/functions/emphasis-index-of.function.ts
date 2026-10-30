/**
 * Stackra file contract:
 * Purpose: `emphasisIndexOf`, the index of the mark that carries the accent: the pointed or pressed mark while there
 *          is one, else the one `emphasis` names (`latest` is the last), else none.
 * Boundary: pure; web and native read it. An index outside the marks means none.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { ChartEmphasis } from "#contracts/types/chart-emphasis.type";

/** The emphasised mark's index, or null when every mark is drawn alike. */
export function emphasisIndexOf(
  emphasis: ChartEmphasis,
  count: number,
  pointed?: number | null,
): number | null {
  if (emphasis === "none") return null;
  const index =
    typeof pointed === "number" && pointed >= 0
      ? pointed
      : emphasis === "latest"
        ? count - 1
        : emphasis;
  return Number.isInteger(index) && index >= 0 && index < count ? index : null;
}
