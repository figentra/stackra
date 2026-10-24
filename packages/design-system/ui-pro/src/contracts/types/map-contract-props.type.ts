/**
 * Stackra file contract:
 * Purpose: the props the web `Map` compound takes from the shared vocabulary: the accessible name of the map, and
 *          the press handler of a marker and of a route, which HeroUI Pro calls `onClick`.
 * Boundary: types only; web only (HeroUI Pro's Map has no native counterpart). `isLoading`, `isDisabled` and the
 *          control buttons' `label` and `onPress` already follow the vocabulary in HeroUI Pro. Every other prop is
 *          HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */

/** Props of the `Map` root that the Stackra vocabulary names. */
export interface MapContractProps {
  /** The accessible name of the map, announced by assistive technology; HeroUI Pro's `aria-label`. */
  readonly label?: string | undefined;
}

/** Props of `Map.Marker` that the Stackra vocabulary names. */
export interface MapMarkerContractProps {
  /** Called when the marker is pressed; HeroUI Pro's `onClick`, without the pointer event. */
  readonly onPress?: (() => void) | undefined;
}

/** Props of `Map.Route` that the Stackra vocabulary names. */
export interface MapRouteContractProps {
  /** Called when the route line is pressed; HeroUI Pro's `onClick`. Only fires while `interactive` is on. */
  readonly onPress?: (() => void) | undefined;
}
