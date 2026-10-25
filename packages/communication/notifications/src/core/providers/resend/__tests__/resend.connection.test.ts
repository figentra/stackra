/**
 * Stackra file contract:
 * Purpose: unit tests of `ResendConnection`: check names the first domain; a send posts the mail and returns Resend's
 *          id.
 * Boundary: test only; the managed client is `fakeIntegrationApi`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0086 (decision 2).
 */
import { fakeIntegrationApi, makeConnection } from "@stackra/integrations/testing";
import { describe, expect, it } from "@stackra/testing";

import { ResendConnection } from "#core/providers/resend/resend.connection";
import { ResendIntegration } from "#core/providers/resend/resend.integration";

const mail = {
  to: "lina@example.com",
  from: "orders@acme.example",
  subject: "Receipt",
  html: "<p>Hi</p>",
  text: "Hi",
} as const;

describe("ResendConnection", () => {
  it("checks and sends with the idempotency key", async () => {
    let seen: { body?: unknown } = {};
    const resend = makeConnection(ResendConnection, {
      api: fakeIntegrationApi(ResendIntegration, (r) =>
        r
          .get("/domains")
          .returns(() => ({ data: [{ name: "acme.example" }] }))
          .post("/emails")
          .returns((_p, request) => {
            seen = { body: request.body };
            return { id: "em_1" };
          }),
      ),
      fields: { apiKey: "re_test" },
    });
    await expect(resend.check()).resolves.toMatchObject({ id: "acme.example" });
    await expect(resend.sendMail(mail, "key-1")).resolves.toBe("em_1");
    expect(seen.body).toEqual({
      from: mail.from,
      to: [mail.to],
      subject: "Receipt",
      html: "<p>Hi</p>",
      text: "Hi",
    });
  });
});
