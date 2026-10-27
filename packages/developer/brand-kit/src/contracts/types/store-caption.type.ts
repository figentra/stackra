/**
 * Stackra file contract:
 * Purpose: `StoreCaption`, one entry of `assets/store/<app>/<locale>/captions.json`: the screen a screenshot shows
 *          and the caption the generator draws into its device frame (D19).
 * Boundary: a type in the leaf entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: D19 store frames and captions from assets/store).
 */

/**
 * One screenshot caption.
 *
 * @example
 * const caption: StoreCaption = { screen: "stock", text: "Every size and colour, one scan away" };
 */
export interface StoreCaption {
  /** The screen id the screenshot job captures, also the screenshot's file name (`<screen>.png`). */
  readonly screen: string;

  /** The caption, in the folder's locale. */
  readonly text: string;
}
