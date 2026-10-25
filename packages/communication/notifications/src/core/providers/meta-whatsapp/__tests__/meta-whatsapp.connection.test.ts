/**
 * Stackra file contract:
 * Purpose: unit tests of `MetaWhatsAppConnection`: a template message with body parameters and a free-text message, each
 *          to the number without its plus, and the message id read back.
 * Boundary: test only; the managed client is `fakeIntegrationApi`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0355 (decision 4).
 */
import { fakeIntegrationApi, makeConnection } from "@stackra/integrations/testing";
import { describe, expect, it } from "@stackra/testing";

import { MetaWhatsAppConnection } from "#core/providers/meta-whatsapp/meta-whatsapp.connection";
import { MetaWhatsAppIntegration } from "#core/providers/meta-whatsapp/meta-whatsapp.integration";

describe("MetaWhatsAppConnection", () => {
  it("sends templates and text", async () => {
    const bodies: unknown[] = [];
    const whatsapp = makeConnection(MetaWhatsAppConnection, {
      api: fakeIntegrationApi(MetaWhatsAppIntegration, (r) =>
        r
          .post("/:phone/messages")
          .returns((_p, request) => (bodies.push(request.body), { messages: [{ id: "wamid.1" }] })),
      ),
      fields: { phoneNumberId: "1050", accessToken: "t" },
    });
    await expect(
      whatsapp.sendWhatsApp({
        to: "+966500000001",
        template: { name: "booking_reminder", language: "ar", parameters: ["10:00"] },
      }),
    ).resolves.toBe("wamid.1");
    await whatsapp.sendWhatsApp({ to: "+966500000001", text: "Thanks" });
    expect(bodies).toEqual([
      {
        messaging_product: "whatsapp",
        to: "966500000001",
        type: "template",
        template: {
          name: "booking_reminder",
          language: { code: "ar" },
          components: [{ type: "body", parameters: [{ type: "text", text: "10:00" }] }],
        },
      },
      { messaging_product: "whatsapp", to: "966500000001", type: "text", text: { body: "Thanks" } },
    ]);
  });
});
