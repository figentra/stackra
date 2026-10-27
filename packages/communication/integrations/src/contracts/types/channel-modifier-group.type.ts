/**
 * Stackra file contract:
 * Purpose: `ChannelModifierGroup`, a set of choices offered with a menu item (a size, extra toppings, a side): how
 *          many the buyer must and may pick, and each option with its added price.
 * Boundary: a type only. An option is a SKU of ours, so an imported order line names it like any other item.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 3); COM-301; STA-754.
 */
import type { Money } from "@stackra/money";

/** A modifier group on a channel menu. */
export interface ChannelModifierGroup {
  /** The group's id, which items name. */
  readonly id: string;

  /** The name in the menu's language. */
  readonly name: string;

  /** The fewest options the buyer must pick (0 when optional). */
  readonly min: number;

  /** The most options the buyer may pick. */
  readonly max: number;

  /** The options, in order. */
  readonly options: readonly {
    readonly sku: string;
    readonly name: string;
    readonly price: Money;
    readonly available: boolean;
  }[];
}
