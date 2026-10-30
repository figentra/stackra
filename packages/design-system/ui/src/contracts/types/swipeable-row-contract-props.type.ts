/**
 * Stackra file contract:
 * Purpose: the props of the native `SwipeableRow`: a list row that slides aside to reveal actions at its start and end, each also offered to VoiceOver and TalkBack as a custom action.
 * Boundary: types only. Start and end follow the reading direction.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile
 *          interactions (owner approval 2026-10-28).
 */
import type { ReactNode } from "react";

import type { SwipeAction } from "#contracts/types/swipe-action.type";

/** Props of the native `SwipeableRow`. */
export interface SwipeableRowContractProps {
  /** The row itself. */
  readonly children: ReactNode;
  /** The actions revealed at the reading start (a swipe toward the end). */
  readonly startActions?: readonly SwipeAction[] | undefined;
  /** The actions revealed at the reading end (a swipe toward the start), usually the destructive ones. */
  readonly endActions?: readonly SwipeAction[] | undefined;
  /** Called with the id of every action chosen, after the action's own `onPress`. */
  readonly onAction?: ((id: string) => void) | undefined;
  /** True to refuse swiping. */
  readonly isDisabled?: boolean | undefined;
}
