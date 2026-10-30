/**
 * Stackra file contract:
 * Purpose: `SwipeableTabsProps`, the props of the native `SwipeableTabs` in `swipeable-tabs.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { TabsProps } from "#native/tabs/tabs.props";
import type { SwipeableTabsContractProps } from "#contracts/types/swipeable-tabs-contract-props.type";

/** Props of the native SwipeableTabs: the shared contract plus the root's own props, passed through. */
export type SwipeableTabsProps = SwipeableTabsContractProps &
  Omit<TabsProps, keyof SwipeableTabsContractProps>;
