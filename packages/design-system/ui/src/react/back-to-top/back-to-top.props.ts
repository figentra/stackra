/**
 * Stackra file contract:
 * Purpose: `BackToTopProps`, the props of the web `BackToTop`: the shared contract, what scrolls, where focus lands
 *          and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import type { RefObject } from "react";

import type { BackToTopContractProps } from "#contracts/types/back-to-top-contract-props.type";

/** Props of the web BackToTop. */
export type BackToTopProps = BackToTopContractProps & {
  /** The scrolling element to watch and scroll; left out, the window. The button is then fixed to the viewport. */
  readonly scrollRef?: RefObject<HTMLElement | null> | undefined;
  /**
   * The id of the element that takes focus once at the top, for example the skip link's target or the page's `h1`.
   * Left out, the scrolling element (or the body) does.
   */
  readonly focusTargetId?: string | undefined;
  /** Styles the button's wrapper, for example to move it above a bottom bar. */
  readonly className?: string | undefined;
};
