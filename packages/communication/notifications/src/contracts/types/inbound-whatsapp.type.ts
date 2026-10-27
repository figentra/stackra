/**
 * Stackra file contract:
 * Purpose: `InboundWhatsApp`, one WhatsApp message a customer sent, as a `WhatsAppInbound` driver reads it from a
 *          provider's webhook: free text, a cart sent from the business's catalogue (a native cart order), or a reply
 *          to a button or list the business sent.
 * Boundary: a type only. The customer's number and profile name are personal data: passed to the host's handler,
 *           never logged or stored here. `channelId` is the provider's id of the receiving business number; the host
 *           maps it to its scope. Prices are `MoneyAmount` (minor units), never the provider's float.
 * Runtime: isomorphic
 * Governing contract: ADR 0448 (decision 1); ADR 0223 (decision 1: WhatsApp Cloud API); ADR 0220; COM-297.
 */
import type { InboundWhatsAppCartItem } from "#contracts/types/inbound-whatsapp-cart-item.type";

/** What every inbound message carries. */
interface InboundWhatsAppEnvelope {
  /** The provider's message id (`wamid.…`): the dedupe key. */
  readonly id: string;

  /** The customer's number, E.164. */
  readonly from: `+${string}`;

  /** The customer's WhatsApp profile name, when the provider sends it. */
  readonly profileName?: string;

  /** The provider's id of the business number that received it. */
  readonly channelId: string;

  /** When the customer sent it. */
  readonly at: Date;

  /** The id of the business message this one answers or quotes, when there is one. */
  readonly replyTo?: string;
}

/**
 * A received WhatsApp message.
 *
 * @example
 * if (message.kind === "cart") await carts.fromWhatsApp(message.channelId, message.from, message.items);
 */
export type InboundWhatsApp = InboundWhatsAppEnvelope &
  (
    | {
        readonly kind: "text";
        readonly text: string;
      }
    | {
        readonly kind: "cart";
        /** The catalogue the cart was built from. */
        readonly catalogId: string;
        readonly items: readonly InboundWhatsAppCartItem[];
        /** The note the customer typed with the cart. */
        readonly note?: string;
      }
    | {
        readonly kind: "reply";
        /** The id or payload the business gave the button or list row. */
        readonly replyId: string;
        /** The label the customer tapped. */
        readonly title: string;
      }
  );
