/**
 * Stackra file contract:
 * Purpose: `UndoCountdownProps`, the props of the web `UndoCountdown` in `undo-countdown.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */

/** Props of UndoCountdown. */
export interface UndoCountdownProps {
  /** How long the ring takes to empty, in milliseconds: the toast's timeout. */
  readonly duration: number;
}
