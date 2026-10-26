/**
 * Stackra file contract:
 * Purpose: `MenuBoardView`, what one menu-board screen shows: titled sections of items with their formatted prices and
 *          whether each is available, and an optional message, all translated by the caller.
 * Boundary: a type only; plain text, so it crosses a window or device boundary as JSON. Layout and theme are the
 *           board app's.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decision 1: second screens); ADR 0253 (decision 4).
 */

/** One screen of a menu board. */
export interface MenuBoardView {
  /** The screen key the view is for (`drive_through_1`, `wall_left`). */
  readonly screen: string;

  /** The sections, in order. */
  readonly sections: readonly {
    readonly title: string;
    readonly items: readonly {
      readonly label: string;
      /** The price, formatted; null hides it. */
      readonly price: string | null;
      /** False shows the item as sold out. */
      readonly available: boolean;
    }[];
  }[];

  /** A message across the screen; null for none. */
  readonly message: string | null;
}
