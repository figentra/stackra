/**
 * Stackra file contract:
 * Purpose: `EmptyStateProps`, the props of the web `EmptyState` in `empty-state.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, decision 5: adapted
 *          form); ADR 0303 (decision 7); ADR 0313 (decisions 5 and 6); WCAG 2.2 SC 1.3.1.
 */
import type { EmptyStateContractProps } from "#contracts/types/empty-state-contract-props.type";
import type { StateLayoutProps } from "#react/state-layout/state-layout.props";

/**
 * Props of the web EmptyState: the shared contract plus the attributes of its root `div`, passed through. HeroUI-style
 * `variant` is refused: an empty state has one look.
 */
export type EmptyStateProps = EmptyStateContractProps &
  Omit<StateLayoutProps, keyof EmptyStateContractProps | "defaultIcon" | "children">;
