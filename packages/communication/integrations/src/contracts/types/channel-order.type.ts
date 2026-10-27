/**
 * Stackra file contract:
 * Purpose: `ChannelOrder`, an order a sales channel (a marketplace or another shop) took for us, as its connector
 *          reports it.
 * Boundary: a type only. The buyer's contact and address arrive only when the channel shares them and our order needs
 *           them to ship; the connector passes them through without storing.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decisions 1 and 6); COM-301; ADR 0134 (personal data); ADR 0447 (decision 3: the
 *                     payment method).
 */
import type { Money } from "@stackra/money";
import type { Address } from "@stackra/validation";

import type { ChannelPaymentMethod } from "#contracts/enums/channel-payment-method.enum";
import type { ChannelOrderLine } from "#contracts/types/channel-order-line.type";

/** An imported order. */
export interface ChannelOrder {
  /** The channel's order id. */
  readonly externalId: string;

  /** When the buyer placed it. */
  readonly placedAt: Date;

  /** The channel's state, as the channel spells it; the importer maps it. */
  readonly status: string;

  /** The lines of the order. */
  readonly lines: readonly ChannelOrderLine[];

  /** The order total the channel charged. */
  readonly total: Money;

  /** Where to ship, when we ship it. */
  readonly shipTo?: Address;

  /** Whether the channel ships it itself (we only hand over stock). */
  readonly fulfilledByChannel: boolean;

  /** How the buyer pays; prepaid when the channel does not say. */
  readonly paymentMethod?: ChannelPaymentMethod;
}
