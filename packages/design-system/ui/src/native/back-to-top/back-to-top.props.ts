/**
 * Stackra file contract:
 * Purpose: `BackToTopProps`, the props of the native `BackToTop`: the shared contract, the scroll view to scroll and
 *          how far it is scrolled, and a class name.
 * Boundary: types only. The screen tracks `offsetY` from its scroll view's `onScroll`, which it owns anyway.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import type { RefObject } from "react";

import type { BackToTopContractProps } from "#contracts/types/back-to-top-contract-props.type";

/** Anything that scrolls to an offset: a ScrollView, or a FlatList through `scrollToOffset`. */
type Scrollable =
  | { scrollTo: (to: { y: number; animated?: boolean }) => void }
  | { scrollToOffset: (to: { offset: number; animated?: boolean }) => void };

/** Props of the native BackToTop. */
export type BackToTopProps = BackToTopContractProps & {
  /** The scroll view (or list) to take back to the top. */
  readonly scrollRef: RefObject<Scrollable | null>;
  /** How far it is scrolled now, from its `onScroll` (`contentOffset.y`). */
  readonly offsetY: number;
  /** Styles the button's wrapper, for example to move it above a tab bar. */
  readonly className?: string | undefined;
};
