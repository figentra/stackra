/**
 * Stackra file contract:
 * Purpose: `ErrorStateProps`, the props of the web `ErrorState` in `error-state.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, decision 5: adapted
 *          form); ADR 0303 (decision 7); ADR 0313 (decisions 1 and 6); ADR 0140 (error envelope); WCAG 2.2 SC 1.3.1 and
 *          4.1.3.
 */
import type { ErrorStateContractProps } from "#contracts/types/error-state-contract-props.type";
import type { StateLayoutProps } from "#react/state-layout/state-layout.props";

/**
 * Props of the web ErrorState: the shared contract plus the attributes of its root `div`, passed through. The role
 * and live region are the component's, never the caller's.
 */
export type ErrorStateProps = ErrorStateContractProps &
  Omit<
    StateLayoutProps,
    keyof ErrorStateContractProps | "defaultIcon" | "children" | "role" | "aria-live"
  >;
