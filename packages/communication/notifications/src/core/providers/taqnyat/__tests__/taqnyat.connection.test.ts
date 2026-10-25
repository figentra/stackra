/**
 * Stackra file contract:
 * Purpose: unit tests of `TaqnyatConnection` and `CequensConnection`: each send's body and the provider id read back;
 *          a Cequens non-zero reply code is refused.
 * Boundary: test only; the managed client is `fakeIntegrationApi`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0223 (decision 1).
 */
import { ProviderRefusedError } from "@stackra/integrations";
import { fakeIntegrationApi, makeConnection } from "@stackra/integrations/testing";
import { describe, expect, it } from "@stackra/testing";

import { CequensConnection } from "#core/providers/cequens/cequens.connection";
import { CequensIntegration } from "#core/providers/cequens/cequens.integration";
import { TaqnyatConnection } from "#core/providers/taqnyat/taqnyat.connection";
import { TaqnyatIntegration } from "#core/providers/taqnyat/taqnyat.integration";

const sms = { to: "+201012345678", from: "ACME", text: "Hi" } as const;

describe("SMS connections", () => {
  it("Taqnyat sends to the number without its plus", async () => {
    let body: unknown;
    const taqnyat = makeConnection(TaqnyatConnection, {
      api: fakeIntegrationApi(TaqnyatIntegration, (r) =>
        r.post("/v1/messages").returns((_p, request) => ((body = request.body), { messageId: 7 })),
      ),
      fields: { apiToken: "t" },
    });
    await expect(taqnyat.sendSms(sms)).resolves.toBe("7");
    expect(body).toEqual({ recipients: ["201012345678"], body: "Hi", sender: "ACME" });
  });

  it("Cequens sends and refuses a non-zero reply code", async () => {
    let body: unknown;
    const cequens = (answer: unknown) =>
      makeConnection(CequensConnection, {
        api: fakeIntegrationApi(CequensIntegration, (r) =>
          r.post("/sms/v1/messages").returns((_p, request) => ((body = request.body), answer)),
        ),
        fields: { apiToken: "t" },
      });
    await expect(
      cequens({ replyCode: 0, data: { SentSMSIDs: [{ SMSId: "c-1" }] } }).sendSms(sms),
    ).resolves.toBe("c-1");
    expect(body).toEqual({
      senderName: "ACME",
      messageType: "text",
      messageText: "Hi",
      recipients: "201012345678",
    });
    await expect(cequens({ replyCode: 3 }).sendSms(sms)).rejects.toThrow(ProviderRefusedError);
  });
});
