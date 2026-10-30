/**
 * Stackra file contract:
 * Purpose: `ResizeHandleOptions`, what `useResizeHandle` needs to turn a strip into a window splitter: the width it
 *          moves, its bounds, which edge of the box the strip sits on, and what a drag, a press and extra keys do.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); WAI-ARIA window splitter pattern; owner request 2026-10-29 (STA-1371).
 */

/** The options of `useResizeHandle`. */
export interface ResizeHandleOptions {
  /** The box's width now, in pixels. */
  readonly width: number;
  /** The narrowest width, for Home. */
  readonly minWidth: number;
  /** The widest width, for End. */
  readonly maxWidth: number;
  /**
   * The logical edge of the box the strip sits on: `end` for a box at the start of the page (a sidebar), whose width
   * grows as the strip moves towards the end; `start` for a box at the end of the page (a side panel).
   */
  readonly edge: "start" | "end";
  /** A selector of the element that takes `data-resizing` while a drag runs (to turn its width transition off). */
  readonly resizing: string;
  /** Sets the width from the keyboard, and from a drag unless `onDrag` is given; the caller clamps. */
  readonly onResize: (width: number) => void;
  /** Called on each drag move past the slop with the unclamped width and the distance moved, instead of `onResize`. */
  readonly onDrag?: ((width: number, delta: number) => void) | undefined;
  /** Called when the strip is pressed and released without a drag. */
  readonly onPress?: (() => void) | undefined;
  /** Extra keys, by `KeyboardEvent.key`, on top of the arrows, Home and End. */
  readonly keys?: Readonly<Record<string, () => void>> | undefined;
}
