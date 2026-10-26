/**
 * Stackra file contract:
 * Purpose: `MapRouteContractProps`, props of `Map.Route` that the Stackra vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */

/** Props of `Map.Route` that the Stackra vocabulary names. */
export interface MapRouteContractProps {
  /** Called when the route line is pressed; HeroUI Pro's `onClick`. Only fires while `interactive` is on. */
  readonly onPress?: (() => void) | undefined;
}
