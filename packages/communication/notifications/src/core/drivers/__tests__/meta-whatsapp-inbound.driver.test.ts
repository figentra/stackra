/**
 * Stackra file contract:
 * Purpose: unit tests of `MetaWhatsAppInboundDriver`: a Cloud API delivery with a text, a native cart, a button reply, a
 *          list reply and a template quick reply reads into five messages with the profile name, the replied message
 *          id and minor-unit prices; statuses, unknown types, malformed messages, a price finer than its currency and a
 *          body that is not JSON give nothing, never an exception.
 * Boundary: test only; every payload is written here in the published shape, no captured traffic is quoted.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0448 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { WhatsAppInbound } from "#contracts/ports/whatsapp-inbound.port";
import { MetaWhatsAppInboundDriver } from "#core/drivers/meta-whatsapp-inbound.driver";

const T = "1761555600";
const AT = new Date(Number(T) * 1000);

/** A delivery of `messages` to business number `pn_1`. */
function delivery(messages: unknown[], extra: Record<string, unknown> = {}): string {
  return JSON.stringify({
    object: "whatsapp_business_account",
    entry: [
      {
        id: "waba_1",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: { display_phone_number: "966110000000", phone_number_id: "pn_1" },
              contacts: [{ profile: { name: "Sara" }, wa_id: "966500000001" }],
              messages,
              ...extra,
            },
          },
        ],
      },
    ],
  });
}

const base = { from: "966500000001", timestamp: T };

describe("MetaWhatsAppInboundDriver", () => {
  const inbound = new MetaWhatsAppInboundDriver();

  it("is the port's driver", () => {
    expect(inbound).toBeInstanceOf(WhatsAppInbound);
  });

  it("reads text, carts and replies", async () => {
    const messages = await inbound.read(
      delivery([
        { ...base, id: "w1", type: "text", text: { body: "Is it in stock?" } },
        {
          ...base,
          id: "w2",
          type: "order",
          order: {
            catalog_id: "cat_1",
            text: "Deliver after 5",
            product_items: [
              { product_retailer_id: "SKU-1", quantity: 2, item_price: 49.5, currency: "SAR" },
              { product_retailer_id: "SKU-2", quantity: 1, item_price: 1.25, currency: "KWD" },
            ],
          },
        },
        {
          ...base,
          id: "w3",
          type: "interactive",
          context: { from: "966110000000", id: "wamid.out1" },
          interactive: { type: "button_reply", button_reply: { id: "cod_confirm", title: "Yes" } },
        },
        {
          ...base,
          id: "w4",
          type: "interactive",
          interactive: { type: "list_reply", list_reply: { id: "slot_2", title: "Tomorrow" } },
        },
        {
          ...base,
          id: "w5",
          type: "button",
          context: { id: "wamid.out2" },
          button: { payload: "track_order", text: "Track" },
        },
      ]),
    );
    const envelope = { from: "+966500000001", profileName: "Sara", channelId: "pn_1", at: AT };
    expect(messages).toEqual([
      { ...envelope, id: "w1", kind: "text", text: "Is it in stock?" },
      {
        ...envelope,
        id: "w2",
        kind: "cart",
        catalogId: "cat_1",
        note: "Deliver after 5",
        items: [
          { productRef: "SKU-1", quantity: 2, unitPrice: { minor: 4950, currency: "SAR" } },
          { productRef: "SKU-2", quantity: 1, unitPrice: { minor: 1250, currency: "KWD" } },
        ],
      },
      {
        ...envelope,
        id: "w3",
        kind: "reply",
        replyTo: "wamid.out1",
        replyId: "cod_confirm",
        title: "Yes",
      },
      { ...envelope, id: "w4", kind: "reply", replyId: "slot_2", title: "Tomorrow" },
      {
        ...envelope,
        id: "w5",
        kind: "reply",
        replyTo: "wamid.out2",
        replyId: "track_order",
        title: "Track",
      },
    ]);
  });

  it("leaves out statuses, other types and malformed messages", async () => {
    const messages = await inbound.read(
      delivery(
        [
          { ...base, id: "w1", type: "image", image: { id: "media_1" } },
          { ...base, id: "w2", type: "text", text: {} },
          { ...base, id: "w3", type: "text", from: "+9665", text: { body: "x" } },
          { ...base, id: "w4", type: "text", timestamp: "soon", text: { body: "x" } },
          {
            ...base,
            id: "w5",
            type: "order",
            order: {
              catalog_id: "cat_1",
              product_items: [
                { product_retailer_id: "SKU-1", quantity: 1, item_price: 1.005, currency: "SAR" },
              ],
            },
          },
          {
            ...base,
            id: "w6",
            type: "order",
            order: {
              catalog_id: "cat_1",
              product_items: [
                { product_retailer_id: "SKU-1", quantity: 0, item_price: 1, currency: "SAR" },
              ],
            },
          },
          "not a message",
        ],
        { statuses: [{ id: "wamid.out1", status: "read" }] },
      ),
    );
    expect(messages).toEqual([]);
  });

  it("answers nothing for a body that is not a delivery", async () => {
    expect(await inbound.read("not json")).toEqual([]);
    expect(await inbound.read("[]")).toEqual([]);
    expect(await inbound.read(JSON.stringify({ entry: [{ changes: [{ value: {} }] }] }))).toEqual(
      [],
    );
  });
});
