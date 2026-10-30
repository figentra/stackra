/**
 * Stackra file contract:
 * Purpose: `useCursorPaginationState(props)`, the state every runtime's CursorPagination shares: its words (the
 *          caller's, else the catalogue's), whether it is a pager, and the previous and next buttons. The button that
 *          was pressed shows the spinner while the page loads and the other waits disabled, so a double press never
 *          fetches twice; a load that no press started (an app's own end-reached call) counts as the next page.
 * Boundary: a React hook with no rendering; the runtimes draw the buttons and decide when the load-more form draws
 *           nothing. The web and native CursorPagination both use it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import { useState } from "react";

import type { CursorPaginationContractProps } from "#contracts/types/cursor-pagination-contract-props.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";

/** The words. */
const K = UI_KEYS.ui.cursor_pagination;

/** A pager button's state, ready to spread on a Button. */
interface PagerButton {
  readonly isDisabled: boolean;
  readonly isLoading: boolean;
  readonly onPress: () => void;
}

/**
 * The shared CursorPagination state.
 * @param props - the page state, the handlers, the form and the caller's words
 * @returns the words, the form and the two pager buttons
 */
export function useCursorPaginationState({
  hasMore,
  hasPrevious = false,
  onNext,
  onPrevious,
  mode = "pager",
  isLoading = false,
  label,
  previousLabel,
  nextLabel,
  loadMoreLabel,
  countLabel,
}: Omit<CursorPaginationContractProps, "count" | "size">): {
  readonly label: string;
  readonly previousLabel: string;
  readonly nextLabel: string;
  readonly loadMoreLabel: string;
  readonly countLabel: (count: number) => string;
  readonly isPager: boolean;
  readonly previous: PagerButton;
  readonly next: PagerButton;
} {
  const t = useUiText();
  const [pressed, setPressed] = useState<"previous" | "next">("next");
  const isPreviousLoading = isLoading && pressed === "previous";
  const isNextLoading = isLoading && pressed === "next";
  return {
    label: label ?? t(K.label),
    previousLabel: previousLabel ?? t(K.previous),
    nextLabel: nextLabel ?? t(K.next),
    loadMoreLabel: loadMoreLabel ?? t(K.load_more),
    countLabel: countLabel ?? ((total) => t(K.count, { count: total })),
    isPager: mode === "pager",
    previous: {
      isDisabled: !hasPrevious || isNextLoading,
      isLoading: isPreviousLoading,
      onPress: () => {
        setPressed("previous");
        onPrevious?.();
      },
    },
    next: {
      isDisabled: !hasMore || isPreviousLoading,
      isLoading: isNextLoading,
      onPress: () => {
        setPressed("next");
        onNext?.();
      },
    },
  };
}
