/**
 * Stackra file contract:
 * Purpose: `MapMarkerContractProps`, props of `Map.Marker` that the Stackra vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */

/** Props of `Map.Marker` that the Stackra vocabulary names. */
export interface MapMarkerContractProps {
  /** Called when the marker is pressed; HeroUI Pro's `onClick`, without the pointer event. */
  readonly onPress?: (() => void) | undefined;
}
