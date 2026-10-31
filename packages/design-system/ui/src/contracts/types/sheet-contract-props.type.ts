/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Sheet` root takes: a swipeable overlay from a screen edge, by default the
 *          bottom, that rests at snap points and stacks when one opens inside another. It is the open state and
 *          dismissal, the edge, the snap points, the backdrop look, the detached look, the parts inside it, an
 *          optional trigger and an accessible name for a sheet with no title.
 * Boundary: types only. The parts are `Sheet.Header`, `Sheet.Title`, `Sheet.Body`, `Sheet.Footer` and `Sheet.Close`.
 *           Sheet or Drawer: a Sheet is the gesture surface (a bottom or top sheet with snap points, swiped away,
 *           a quick pick or a peek); a Drawer is the task panel on the reading-end side (sizes, resize, expand,
 *           sub-header, back button and drill-down views). `isDismissable` covers a press outside, Escape and the
 *           swipe together, so there is no separate keyboard switch.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; ADR 0060 (right-to-left); owner
 *          approval 2026-10-31 (HeroUI 3.2.7 and Sheet, STA-1371); WCAG 2.2 SC 2.1.2, 2.4.3, 2.5.1 and 4.1.2.
 */
import type { ReactElement, ReactNode } from "react";

import type { Placement } from "#contracts/enums/placement.enum";
import type { SheetBackdrop } from "#contracts/enums/sheet-backdrop.enum";
import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";
import type { SnapPoint } from "#contracts/types/snap-point.type";

/** Props shared by the web and native `Sheet`. */
export interface SheetContractProps extends OpenStateContractProps {
  /** The sheet's parts, usually a header, a body and a footer; any element is allowed. */
  readonly children: ReactNode;
  /**
   * The element that opens the sheet when pressed: a Button, or any pressable element. Leave it out for a sheet the
   * app opens through `isOpen`. Focus returns to it when the sheet closes.
   */
  readonly trigger?: ReactElement | undefined;
  /** The edge it comes from: `bottom` (the default), `top`, or `start` and `end` by reading direction. */
  readonly placement?: Placement | undefined;
  /**
   * The partial sizes it rests at, smallest first: pixels (points on native) or a share as `"50%"`. It opens at the
   * first, a swipe moves through them (several in one swipe) and the full size is always the last stop, so it is not
   * listed.
   */
  readonly snapPoints?: readonly SnapPoint[] | undefined;
  /**
   * True, the default, to close on a press outside, Escape or a swipe away. False keeps it open until a close control
   * inside it is pressed.
   */
  readonly isDismissable?: boolean | undefined;
  /** The backdrop's look: `opaque` (the default), `blur` or `transparent`. */
  readonly backdrop?: SheetBackdrop | undefined;
  /**
   * True to float the sheet clear of the screen's edges with every corner rounded. Defaults to false on web and true
   * on native (every native sheet is inset, owner decision 2026-10-24).
   */
  readonly isDetached?: boolean | undefined;
  /** The accessible name for a sheet that has no `Sheet.Title`; with a title, the title names it. */
  readonly label?: string | undefined;
}
