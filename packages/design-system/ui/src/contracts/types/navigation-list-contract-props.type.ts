/**
 * Stackra file contract:
 * Purpose: the props every runtime's `NavigationList` takes: the places to list and the spoken name of the landmark.
 *          The list is the body of a Sidebar, and an app may also draw it alone, for example in a settings page's side
 *          menu. Each runtime's `NavigationListProps` is this plus its own base props, which pass through unchanged.
 * Boundary: types only. An entry with `children` and neither `href` nor `onPress` is a group heading for them; an
 *           entry with `href` or `onPress` is a link, and its `children` follow it, nested. The list never reads the
 *           router, so the current place is each item's `isCurrent`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 1 and 7); ADR 0317 (decisions 1, 3 and 5); WCAG 2.2
 *          SC 1.3.1, 2.4.5 and 4.1.2.
 */
import type { LandmarkContractProps } from "#contracts/types/landmark-contract-props.type";
import type { NavigationItem } from "#contracts/types/navigation-item.type";

/** Props shared by the web and native `NavigationList`. */
export interface NavigationListContractProps extends LandmarkContractProps {
  /** The places, in order; groups and nesting come from each item's `children`. */
  readonly items: readonly NavigationItem[];
}
