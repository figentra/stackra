/**
 * Stackra file contract:
 * Purpose: unit tests of `UnifonicConnection`: a send is a form with the AppSid and the number without its plus; a
 *          `success: false` answer is a `ProviderRefusedError` with Unifonic's code.
 * Boundary: test only; the managed client is `fakeIntegrationApi`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0223 (decision 1).
 */
import { ProviderRefusedError } from "@stackra/integrations";
import { fakeIntegrationApi, makeConnection } from "@stackra/integrations/testing";
import { describe, expect, it } from "@stackra/testing";

import { UnifonicConnection } from "#core/providers/unifonic/unifonic.connection";
import { UnifonicIntegration } from "#core/providers/unifonic/unifonic.integration";

const sms = { to: "+966500000001", from: "ACME", text: "Your code is 1234" } as const;

describe("UnifonicConnection", () => {
  it("sends a form and reads the message id", async () => {
    let body: unknown;
    const unifonic = makeConnection(UnifonicConnection, {
      api: fakeIntegrationApi(UnifonicIntegration, (r) =>
        r.post("/SMS/messages").returns((_p, request) => {
          body = request.body;
          return { success: "true", data: { MessageID: 42 } };
        }),
      ),
      fields: { appSid: "app-sid" },
    });
    await expect(unifonic.sendSms(sms)).resolves.toBe("42");
    expect(body).toEqual({
      AppSid: "app-sid",
      responseType: "JSON",
      SenderID: "ACME",
      Recipient: "966500000001",
      Body: sms.text,
    });
  });

  it("refuses an unsuccessful answer", async () => {
    const unifonic = makeConnection(UnifonicConnection, {
      api: fakeIntegrationApi(UnifonicIntegration, (r) =>
        r.post("/SMS/messages").returns(() => ({ success: false, errorCode: "ER-31" })),
      ),
      fields: { appSid: "app-sid" },
    });
    await expect(unifonic.sendSms(sms)).rejects.toThrow(ProviderRefusedError);
  });
});
