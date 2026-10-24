/**
 * Stackra file contract:
 * Purpose: the props every runtime's `EmptyState` takes: the shared state props plus the `reason` it is shown for,
 *          which picks the default icon and is named on the element. It is what a Table, List or Tabs passes as its
 *          `emptyState`, and it replaces an empty collection for screen readers with a heading and a next step.
 * Boundary: types only; `variant` is deliberately absent, because it means emphasis and an empty state has one look.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (decisions 5 and 6); WCAG 2.2 SC 1.3.1.
 */
import type { EmptyReason } from "#contracts/enums/empty-reason.enum";
import type { StateContractProps } from "#contracts/types/state-contract-props.type";

/** Props shared by the web and native `EmptyState`. */
export interface EmptyStateContractProps extends StateContractProps {
  /** Why nothing is shown: `no-data`, `no-results` or `permission-denied`. Defaults to `no-data`. */
  readonly reason?: EmptyReason | undefined;
}
