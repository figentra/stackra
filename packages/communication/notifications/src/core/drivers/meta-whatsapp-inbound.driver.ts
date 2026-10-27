/**
 * Stackra file contract:
 * Purpose: the `meta` driver of the `WhatsAppInbound` port: reads the WhatsApp Cloud API webhook payload
 *          (`whatsapp_business_account`, `changes[].value.messages[]`) into `InboundWhatsApp` messages: `text`, `order`
 *          (a native cart), `interactive` button and list replies, and template quick-reply `button`s.
 * Boundary: decoding only, like `twiml`: no Connection, credential or HTTP call (those are the OS integrations Meta
 *           connector's, R3-8). Statuses and other message types (media, location, reactions) are left out, as is any
 *           message missing a field or with a price its currency cannot hold; it never throws for the body. The
 *           signature is checked before this runs, with `META_WHATSAPP_WEBHOOK_SIGNATURE`.
 * Runtime: isomorphic
 * Governing contract: ADR 0448 (decisions 1 and 2); ADR 0223 (decision 1); ADR 0220 (minor units); owner decision R3-8.
 */
import { Driver } from "@stackra/container";
import { Money } from "@stackra/money";

import { WhatsAppInbound } from "#contracts/ports/whatsapp-inbound.port";
import type { InboundWhatsApp } from "#contracts/types/inbound-whatsapp.type";
import type { InboundWhatsAppCartItem } from "#contracts/types/inbound-whatsapp-cart-item.type";

/** A JSON object, or undefined for anything else. */
function objectOf(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

/** A JSON array, or none. */
function arrayOf(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

/** A non-empty string, or undefined. */
function textOf(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

/** One cart line, or undefined when a field is missing or the price does not fit its currency. */
function itemOf(value: unknown): InboundWhatsAppCartItem | undefined {
  const item = objectOf(value);
  const productRef = textOf(item?.["product_retailer_id"]);
  const quantity = item?.["quantity"];
  const price = item?.["item_price"];
  const currency = textOf(item?.["currency"]);
  if (productRef === undefined || currency === undefined) return undefined;
  if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity <= 0)
    return undefined;
  if (typeof price !== "number" && typeof price !== "string") return undefined;
  try {
    const money = Money.of(String(price), currency);
    if (money.minor < 0) return undefined;
    return { productRef, quantity, unitPrice: { minor: money.minor, currency: money.currency } };
  } catch {
    return undefined;
  }
}

/** The kind-specific part of one message, or undefined for a type this driver does not read. */
function bodyOf(message: Record<string, unknown>) {
  switch (message["type"]) {
    case "text": {
      const text = textOf(objectOf(message["text"])?.["body"]);
      return text === undefined ? undefined : { kind: "text" as const, text };
    }
    case "order": {
      const order = objectOf(message["order"]);
      const catalogId = textOf(order?.["catalog_id"]);
      const lines = arrayOf(order?.["product_items"]);
      const items = lines.map(itemOf).filter((item) => item !== undefined);
      if (catalogId === undefined || items.length === 0 || items.length !== lines.length)
        return undefined;
      const note = textOf(order?.["text"]);
      return { kind: "cart" as const, catalogId, items, ...(note === undefined ? {} : { note }) };
    }
    case "interactive": {
      const interactive = objectOf(message["interactive"]);
      const answer = objectOf(interactive?.["button_reply"] ?? interactive?.["list_reply"]);
      const replyId = textOf(answer?.["id"]);
      const title = textOf(answer?.["title"]);
      return replyId === undefined || title === undefined
        ? undefined
        : { kind: "reply" as const, replyId, title };
    }
    case "button": {
      const button = objectOf(message["button"]);
      const replyId = textOf(button?.["payload"]);
      const title = textOf(button?.["text"]);
      return replyId === undefined || title === undefined
        ? undefined
        : { kind: "reply" as const, replyId, title };
    }
    default:
      return undefined;
  }
}

/**
 * Inbound WhatsApp messages from Meta's Cloud API.
 *
 * @example
 * const messages = await new MetaWhatsAppInboundDriver().read(request.body);
 */
export class MetaWhatsAppInboundDriver extends Driver(WhatsAppInbound) {
  /** Every text, cart and reply in the delivery, in order. */
  read(body: string): Promise<readonly InboundWhatsApp[]> {
    let payload: unknown;
    try {
      payload = JSON.parse(body);
    } catch {
      return Promise.resolve([]);
    }
    const messages: InboundWhatsApp[] = [];
    for (const entry of arrayOf(objectOf(payload)?.["entry"]))
      for (const change of arrayOf(objectOf(entry)?.["changes"])) {
        const value = objectOf(objectOf(change)?.["value"]);
        const channelId = textOf(objectOf(value?.["metadata"])?.["phone_number_id"]);
        if (channelId === undefined) continue;
        const names = new Map<string, string>();
        for (const contact of arrayOf(value?.["contacts"])) {
          const waId = textOf(objectOf(contact)?.["wa_id"]);
          const name = textOf(objectOf(objectOf(contact)?.["profile"])?.["name"]);
          if (waId !== undefined && name !== undefined) names.set(waId, name);
        }
        for (const raw of arrayOf(value?.["messages"])) {
          const message = objectOf(raw);
          if (message === undefined) continue;
          const id = textOf(message["id"]);
          const from = textOf(message["from"]);
          const timestamp = textOf(message["timestamp"]);
          const content = bodyOf(message);
          if (id === undefined || from === undefined || !/^\d{1,15}$/.test(from)) continue;
          if (timestamp === undefined || !/^\d{1,12}$/.test(timestamp) || content === undefined)
            continue;
          const replyTo = textOf(objectOf(message["context"])?.["id"]);
          const profileName = names.get(from);
          messages.push({
            id,
            from: `+${from}`,
            channelId,
            at: new Date(Number(timestamp) * 1000),
            ...(profileName === undefined ? {} : { profileName }),
            ...(replyTo === undefined ? {} : { replyTo }),
            ...content,
          });
        }
      }
    return Promise.resolve(messages);
  }
}
