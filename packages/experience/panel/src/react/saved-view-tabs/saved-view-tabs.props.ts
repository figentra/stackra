/**
 * Stackra file contract:
 * Purpose: `SavedViewTabsProps`, the props of the web saved view tabs: the shared contract.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0271 (decisions 1 and 7); ADR 0359 (decision 14); ADR 0305 (`<name>.props.ts`); ADR 0505.
 */
import type { SavedViewTabsContractProps } from "#core/types/saved-view-tabs-contract-props.type";

/** Props of the web `SavedViewTabs`: the shared contract, which has no element of its own to pass props to. */
export type SavedViewTabsProps = SavedViewTabsContractProps;
