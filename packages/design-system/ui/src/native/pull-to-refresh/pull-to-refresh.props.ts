/**
 * Stackra file contract:
 * Purpose: `PullToRefreshProps`, the props of the native `PullToRefresh` in `pull-to-refresh.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ScrollViewProps } from "react-native";
import type { PullToRefreshContractProps } from "#contracts/types/pull-to-refresh-contract-props.type";

/** Props of the native PullToRefresh: the shared contract plus the root's own props, passed through. */
export type PullToRefreshProps = PullToRefreshContractProps &
  Omit<ScrollViewProps, keyof PullToRefreshContractProps>;
