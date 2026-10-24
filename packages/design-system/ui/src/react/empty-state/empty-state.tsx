/**
 * Stackra file contract:
 * Purpose: the web `EmptyState`: what a collection, a search or a page shows when there is nothing to list: an icon
 *          for the `reason` (nothing yet, no results, permission denied), a title, a description and the next step as
 *          `actions`. It is what a Table, List or Tabs takes as its `emptyState`.
 * Boundary: HeroUI v3 has no empty-state component (it is HeroUI Pro's), so this is the documented adapted form on
 *           free parts, laid out by the shared internal `StateLayout`. No copy of its own: every word is the
 *           caller's. It is not a live region, because an empty result is content the reader moves to, not an event;
 *           the title is a heading at `headingLevel` (default 2), which is how a screen reader finds it where the empty
 *           table used to be.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3, decision 5: adapted form); ADR 0303 (decision 7); ADR 0313 (decisions 5
 *          and 6); WCAG 2.2 SC 1.3.1.
 */
import type { EmptyStateContractProps } from "#contracts/types/empty-state-contract-props.type";
import { STATE_ICON } from "#core/constants/state-icon.constant";
import { StateLayout, type StateLayoutProps } from "#react/state-layout/state-layout";

/**
 * Props of the web EmptyState: the shared contract plus the attributes of its root `div`, passed through. HeroUI-style
 * `variant` is refused: an empty state has one look.
 */
export type EmptyStateProps = EmptyStateContractProps &
  Omit<StateLayoutProps, keyof EmptyStateContractProps | "defaultIcon" | "children">;

/** An icon, a title, a description and the next step, shown in place of nothing to list. */
export function EmptyState({ reason = "no-data", headingLevel = 2, ...rest }: EmptyStateProps) {
  return (
    <StateLayout
      {...rest}
      data-reason={reason}
      defaultIcon={STATE_ICON[reason]}
      headingLevel={headingLevel}
    />
  );
}
