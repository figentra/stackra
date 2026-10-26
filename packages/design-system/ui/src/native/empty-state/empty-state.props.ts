/**
 * Stackra file contract:
 * Purpose: `EmptyStateProps`, the props of the native `EmptyState` in `empty-state.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, decision 5: adapted
 *          form); ADR 0303 (decision 7); ADR 0313 (decisions 5 and 6); WCAG 2.2 SC 1.3.1.
 */
import type { EmptyStateContractProps } from "#contracts/types/empty-state-contract-props.type";
import type { StateLayoutProps } from "#native/state-layout/state-layout.props";

/**
 * Props of the native EmptyState: the shared contract plus the props of its root `View`, passed through. `variant` is
 * refused: an empty state has one look.
 */
export type EmptyStateProps = EmptyStateContractProps &
  Omit<StateLayoutProps, keyof EmptyStateContractProps | "defaultIcon" | "children">;
