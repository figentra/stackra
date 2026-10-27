/**
 * Stackra file contract:
 * Purpose: `ChannelMenuItem`, one dish or product on a delivery app's menu: our SKU, its name, price and picture, the
 *          modifier groups it offers and whether it can be ordered now.
 * Boundary: a type only. Prices are what the channel shows (the channel's own price list is a pricing concern).
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 3); COM-301; STA-754.
 */
import type { Url } from "@stackra/contracts";
import type { Money } from "@stackra/money";

/** An item on a channel menu. */
export interface ChannelMenuItem {
  /** Our SKU for the menu item. */
  readonly sku: string;

  /** The name in the menu's language. */
  readonly name: string;

  /** The description in the menu's language. */
  readonly description?: string;

  /** The price shown. */
  readonly price: Money;

  /** The menu item's picture. */
  readonly image?: Url;

  /** The ids of the modifier groups offered with it, in order. */
  readonly modifierGroups: readonly string[];

  /** Whether it can be ordered now. */
  readonly available: boolean;
}
