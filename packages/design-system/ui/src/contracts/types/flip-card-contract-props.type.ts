/**
 * Stackra file contract:
 * Purpose: the props every runtime's `FlipCard` takes: two faces of one card (a product and its details, a word and its meaning) that turn over on a press, controlled or not.
 * Boundary: types only. Only the face showing is read by assistive technology.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile
 *          interactions (owner approval 2026-10-28).
 */
import type { ReactNode } from "react";

import type { Orientation } from "#contracts/enums/orientation.enum";

/** Props shared by the web and native `FlipCard`. */
export interface FlipCardContractProps {
  /** The face shown first. */
  readonly front: ReactNode;
  /** The face shown after the turn. */
  readonly back: ReactNode;
  /** The side showing, for a controlled card: true for the back. Pair it with `onFlipChange`. */
  readonly isFlipped?: boolean | undefined;
  /** The side showing at the start, for an uncontrolled card. */
  readonly defaultFlipped?: boolean | undefined;
  /** Called with the new side each time the card turns. */
  readonly onFlipChange?: ((isFlipped: boolean) => void) | undefined;
  /** The accessible name of the card's turn action, for example "Show details". */
  readonly flipLabel: string;
  /** The axis it turns around: `horizontal` turns like a page (around the vertical axis). Defaults to `horizontal`. */
  readonly axis?: Orientation | undefined;
  /** True to show the card without letting it turn on a press (the app turns it). */
  readonly isDisabled?: boolean | undefined;
}
