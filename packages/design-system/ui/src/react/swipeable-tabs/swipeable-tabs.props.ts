/**
 * Stackra file contract:
 * Purpose: `SwipeableTabsProps`, the props of the web `SwipeableTabs` in `swipeable-tabs.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { TabsProps } from "#react/tabs/tabs.props";
import type { SwipeableTabsContractProps } from "#contracts/types/swipeable-tabs-contract-props.type";

/** Props of the web SwipeableTabs: the shared contract plus the root's own props, passed through. */
export type SwipeableTabsProps = SwipeableTabsContractProps &
  Omit<TabsProps, keyof SwipeableTabsContractProps | "orientation">;
