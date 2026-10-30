/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SwipeableTabs` takes: the Tabs props, whose panels also change with a horizontal swipe toward the next or the previous tab in reading order.
 * Boundary: types only. Tabs stay the accessible path; the swipe is an extra.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile
 *          interactions (owner approval 2026-10-28).
 */
import type { TabsContractProps } from "#contracts/types/tabs-contract-props.type";

/** Props shared by the web and native `SwipeableTabs`: horizontal Tabs whose panels swipe. */
export type SwipeableTabsContractProps = Omit<TabsContractProps, "orientation">;
