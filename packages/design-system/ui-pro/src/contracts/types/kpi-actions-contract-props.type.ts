/**
 * Stackra file contract:
 * Purpose: `KpiActionsContractProps`, props of `Kpi.Actions` that the Stackra vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-007.
 */

/** Props of `Kpi.Actions` that the Stackra vocabulary names. */
export interface KpiActionsContractProps {
  /** The accessible name of the icon-only actions button; HeroUI Pro's `aria-label`, which it has no default for. */
  readonly label: string;
}
