/**
 * Stackra file contract:
 * Purpose: `TipPrompt`, the tip choice a terminal shows before the card is read.
 * Boundary: a type in the leaf entry; the percentages and whether a custom amount is allowed come from the product's tip
 *           settings (data), never from this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 5: semi-integrated terminals); XP-6 (tips, switched on per product).
 */

/**
 * What the terminal offers.
 *
 * @example
 * const tipPrompt: TipPrompt = { percentages: settings.tips.presets, custom: settings.tips.custom };
 */
export interface TipPrompt {
  /** Whole percentages of the amount offered as buttons. */
  readonly percentages: readonly number[];

  /** Whether the customer may type their own amount. */
  readonly custom: boolean;
}
