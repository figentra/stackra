/**
 * Stackra file contract:
 * Purpose: `MorphTabsProps`, the props of the native `MorphTabs` in `morph-tabs.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ViewProps } from "react-native";
import type { MorphTabsContractProps } from "#contracts/types/morph-tabs-contract-props.type";

/** Props of the native MorphTabs: the shared contract plus the root's own props, passed through. */
export type MorphTabsProps = MorphTabsContractProps & Omit<ViewProps, keyof MorphTabsContractProps>;
