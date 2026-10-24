/**
 * Stackra file contract:
 * Purpose: the prop the web `PieChart` takes from the shared vocabulary: the accessible name (`label`). Every other
 *          prop is HeroUI Pro's own and passes through unchanged.
 * Boundary: types only; web only. The native PieChart is HeroUI Native Pro's own component, which takes no name.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-001.
 */

/** Props of the web `PieChart` that the Stackra vocabulary names. */
export interface PieChartContractProps {
  /**
   * The accessible name of the chart's container, read by screen readers; HeroUI Pro's `aria-label`. The container has
   * no role of its own, so pass a `role` with it where the name must be announced.
   */
  readonly label?: string | undefined;
}
