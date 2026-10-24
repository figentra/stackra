/**
 * Stackra file contract:
 * Purpose: the native `EmptyState`: what a list, a search or a screen shows when there is nothing to list: an icon
 *          for the `reason` (nothing yet, no results, permission denied), a title, a description and the next step as
 *          `actions`. It is what a Table (the native list form), List or Tabs takes as its `emptyState`.
 * Boundary: the adapted form on free HeroUI Native parts, laid out by the shared internal `StateLayout`. No copy of
 *           its own. Not a live region; the title carries the header role, which is how VoiceOver and TalkBack find
 *           it where the empty list used to be. `actions` are elements (a `Button`), never bare strings.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, decision 5: adapted form); ADR 0303 (decision 7); ADR 0313 (decisions 5
 *          and 6); WCAG 2.2 SC 1.3.1.
 */
import type { EmptyStateContractProps } from "#contracts/types/empty-state-contract-props.type";
import { STATE_ICON } from "#core/constants/state-icon.constant";
import { StateLayout, type StateLayoutProps } from "#native/state-layout/state-layout";

/**
 * Props of the native EmptyState: the shared contract plus the props of its root `View`, passed through. `variant` is
 * refused: an empty state has one look.
 */
export type EmptyStateProps = EmptyStateContractProps &
  Omit<StateLayoutProps, keyof EmptyStateContractProps | "defaultIcon" | "children">;

/** An icon, a title, a description and the next step, shown in place of nothing to list. */
export function EmptyState({ reason = "no-data", headingLevel = 2, ...rest }: EmptyStateProps) {
  return <StateLayout {...rest} defaultIcon={STATE_ICON[reason]} headingLevel={headingLevel} />;
}
