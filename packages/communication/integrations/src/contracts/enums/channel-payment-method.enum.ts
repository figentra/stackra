/**
 * Stackra file contract:
 * Purpose: `ChannelPaymentMethod`, how the buyer of an order a sales channel took pays: the channel collected it, or
 *          the buyer pays the courier in cash or by card on delivery.
 * Boundary: an `Enum.of` value plus the type of the same name. The connector maps the channel's own spelling to one of
 *           these; a cash or card on delivery order is collected by whoever delivers it, so the importer opens a
 *           receivable instead of a paid order.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 3); ADR 0355 (decision 6); COM-301; ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * The payment methods of an imported order.
 *
 * @example
 * if (order.paymentMethod === ChannelPaymentMethod.CashOnDelivery) openReceivable(order);
 */
export const ChannelPaymentMethod = Enum.of({
  /** The channel charged the buyer and settles with us. */
  Prepaid: "prepaid",
  /** The buyer pays cash to whoever delivers it. */
  CashOnDelivery: "cash_on_delivery",
  /** The buyer pays by card to whoever delivers it. */
  CardOnDelivery: "card_on_delivery",
});

/** One of the codes above. */
export type ChannelPaymentMethod = Enum.Value<typeof ChannelPaymentMethod>;
