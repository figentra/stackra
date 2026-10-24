/**
 * Stackra file contract:
 * Purpose: the props the web `ChatListView` takes from the shared vocabulary: the accessible name of the list of
 *          conversations.
 * Boundary: types only; web only. Every other prop (items, selection, density) is HeroUI Pro's own and passes
 *          through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */

/** Props of `ChatListView` that the Stackra vocabulary names. */
export interface ChatListViewContractProps {
  /** The accessible name of the list, announced by assistive technology; HeroUI Pro's `aria-label`. */
  readonly label: string;
}
