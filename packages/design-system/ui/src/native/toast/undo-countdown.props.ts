/**
 * Stackra file contract:
 * Purpose: `UndoCountdownProps`, the props of the native `UndoCountdown` in `undo-countdown.tsx`.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */

/** Props of UndoCountdown. */
export interface UndoCountdownProps {
  /** How long it counts down, in milliseconds: the toast's timeout. */
  readonly duration: number;
}
