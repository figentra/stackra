/**
 * Stackra file contract:
 * Purpose: `InAppMessage`, one message for a person's in-app inbox as a notification hands it to the `InAppStore`: a
 *          product it belongs to, a kind and its label values.
 * Boundary: a type only. It carries no rendered text: the inbox renders `kind` in the reader's language when it shows
 *           it, from the lang files, so a change of language never leaves stale copies. The values are ids and
 *           amounts, never personal data (ADR 0134). The product is the deployment's product code (`pos`), so an inbox
 *           filters by product and an ethical wall can hide another product's entries.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1); ADR 0080 (text from the lang files); ADR 0134 (personal data); ADR 0422
 *                     (decision 2).
 */

/**
 * A message to append to an inbox.
 *
 * @example
 * const message: InAppMessage = { product: "pos", kind: "order_paid", data: { orderId: order.id, total: "120.00 SAR" } };
 */
export interface InAppMessage {
  /** The product code it belongs to (`pos`), which inbox queries filter by. */
  readonly product: string;

  /** The machine code of the message (`order_paid`), which the inbox renders. */
  readonly kind: string;

  /** The label values the inbox formats the message with. */
  readonly data: Readonly<Record<string, string | number>>;
}
