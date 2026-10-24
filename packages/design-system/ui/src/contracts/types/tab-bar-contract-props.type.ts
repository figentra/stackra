/**
 * Stackra file contract:
 * Purpose: the props the phone `TabBar` takes: the places it lists and the spoken name of the bar. A tab shows the
 *          item's icon, label and badge; the bar shows the first five items, the most a phone's tab bar holds on Android.
 * Boundary: types only. There is no web form: the web shell lists the same items in the Sidebar (ADR 0317 decision 7),
 *           so this contract has one runtime, native. The bar never reads the router, so the selected tab is the item's
 *           `isCurrent`, and an item's `children` are left out: a phone tab is one level.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0303 (decisions 1 and 7); ADR 0317 (decisions 1, 3 and
 *          7); ADR 0060; WCAG 2.2 SC 1.3.1, 2.5.8 and 4.1.2.
 */
import type { LandmarkContractProps } from "#contracts/types/landmark-contract-props.type";
import type { NavigationItem } from "#contracts/types/navigation-item.type";

/** Props of the native `TabBar`. */
export interface TabBarContractProps extends LandmarkContractProps {
  /** The tabs, in order from the inline start; only the first five are drawn. */
  readonly items: readonly NavigationItem[];
}
