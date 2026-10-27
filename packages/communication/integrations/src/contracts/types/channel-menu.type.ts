/**
 * Stackra file contract:
 * Purpose: `ChannelMenu`, the whole menu a delivery app shows for one store: its sections in order, the items and the
 *          modifier groups the items share.
 * Boundary: a type only, pushed whole (`SalesChannelConnector#setMenu`), so a retried push is harmless. The menu is
 *           built from our catalogue and the store's settings; the connector maps it to the channel's own shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 3); ADR 0355 (decision 6); COM-301; STA-754.
 */
import type { ChannelMenuItem } from "#contracts/types/channel-menu-item.type";
import type { ChannelModifierGroup } from "#contracts/types/channel-modifier-group.type";

/** A store's menu on a channel. */
export interface ChannelMenu {
  /** The BCP 47 language the names and descriptions are in. */
  readonly locale: string;

  /** The sections in the order shown, each listing its items' SKUs in order. */
  readonly sections: readonly {
    readonly id: string;
    readonly name: string;
    readonly items: readonly string[];
  }[];

  /** Every item a section lists. */
  readonly items: readonly ChannelMenuItem[];

  /** Every modifier group an item names. */
  readonly modifierGroups: readonly ChannelModifierGroup[];
}
