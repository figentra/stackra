/**
 * Stackra file contract:
 * Purpose: unit tests of `SesConnection`: a send posts SendEmail v2 with both parts and SigV4 headers for the
 *          connection's region, and returns the message id.
 * Boundary: test only; the managed client is `fakeIntegrationApi`; the keys are AWS's documented examples.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0308 (rule 8).
 */
import { fakeIntegrationApi, makeConnection } from "@stackra/integrations/testing";
import { describe, expect, it } from "@stackra/testing";

import { SesConnection } from "#core/providers/ses/ses.connection";
import { SesIntegration } from "#core/providers/ses/ses.integration";

describe("SesConnection", () => {
  it("sends a signed SendEmail", async () => {
    let seen: { body?: unknown; headers?: Readonly<Record<string, string>> } = {};
    const ses = makeConnection(SesConnection, {
      api: fakeIntegrationApi(SesIntegration, (r) =>
        r.post("/v2/email/outbound-emails").returns((_p, request) => {
          seen = { body: request.body, headers: request.headers };
          return { MessageId: "ses-1" };
        }),
      ),
      fields: {
        region: "me-central-1",
        accessKeyId: "AKIDEXAMPLE",
        secretAccessKey: "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
      },
    });
    await expect(
      ses.sendMail({
        to: "lina@example.com",
        from: "orders@acme.example",
        subject: "S",
        html: "<p>H</p>",
        text: "H",
      }),
    ).resolves.toBe("ses-1");
    expect(seen.body).toMatchObject({
      FromEmailAddress: "orders@acme.example",
      Destination: { ToAddresses: ["lina@example.com"] },
    });
    expect(seen.headers?.["authorization"]).toMatch(
      /Credential=AKIDEXAMPLE\/\d{8}\/me-central-1\/ses\/aws4_request/,
    );
  });
});
