/**
 * Stackra file contract:
 * Purpose: the props every runtime's `FullscreenBar` takes: the title and actions of a full-screen mode (POS, KDS, an
 *          editor, a kiosk), the exit, how long it stays before hiding, and whether only the manager gesture (a long
 *          press at the top edge) brings it back.
 * Boundary: types only. Entering and leaving the platform's full screen is the app's, in `onExit`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); GAPS.md row 32 (owner decision 2026-10-28); WCAG 2.2 SC 2.2.1 and
 *          2.1.1.
 */
import type { ReactNode } from "react";

/** Props shared by the web and native FullscreenBar. */
export interface FullscreenBarContractProps {
  /** What is on screen: the register's name, the station, the document. */
  readonly title?: ReactNode;
  /** Controls drawn before the exit button, such as a lock or a help button. */
  readonly actions?: ReactNode;
  /** Leaves the full-screen mode; the bar's exit button calls it (with a haptic on native). */
  readonly onExit: () => void;
  /** The exit button's accessible name; defaults to the catalogue's "Exit full screen". */
  readonly exitLabel?: string | undefined;
  /**
   * Milliseconds without a touch, pointer move or key before the bar slides away; `false` keeps it. Defaults to
   * 4000. The bar never hides while it holds focus or the pointer.
   */
  readonly autoHideMs?: number | false | undefined;
  /**
   * True on a customer-facing screen (kiosk, KDS, customer display): once hidden, the bar comes back only on a long
   * press at the top edge, the manager gesture, not on any tap or pointer move. A key press still brings it back on
   * web, since a keyboard is staff-only there.
   */
  readonly isLocked?: boolean | undefined;
}
