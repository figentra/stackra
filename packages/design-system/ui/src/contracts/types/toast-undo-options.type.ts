/**
 * Stackra file contract:
 * Purpose: `ToastUndoOptions`, the options of `toast.undo(message, options)`: what undoing does, and how long the
 *          countdown runs before the change is kept.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0312; WCAG 2.2 SC 2.2.1; STA-1371 (owner request 2026-10-29).
 */

/** The options of an undo toast. */
export interface ToastUndoOptions {
  /** Called when "Undo" is pressed, before the toast closes. */
  readonly onUndo: () => void;
  /** How long the countdown runs, in milliseconds. Defaults to 8000, the time an action needs to be reached. */
  readonly timeout?: number | undefined;
  /** The button's word; defaults to the catalogue's "Undo". */
  readonly undoLabel?: string | undefined;
  /** A second line under the message. */
  readonly description?: string | undefined;
  /** Called when the toast closes without an undo: timed out or dismissed. The change can be made final here. */
  readonly onCommit?: (() => void) | undefined;
}
