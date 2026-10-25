/**
 * Stackra file contract:
 * Purpose: unit tests of `signAwsV4`: the date header, the credential scope and signed headers, a stable signature for
 *          the same request and a different one for a changed body; the secret never appears.
 * Boundary: test only. The keys are AWS's documented example keys, not credentials.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; AWS Signature Version 4.
 */
import { describe, expect, it } from "@stackra/testing";

import { signAwsV4 } from "#core/functions/sign-aws-v4.function";

const request = {
  method: "POST",
  url: new URL("https://email.me-central-1.amazonaws.com/v2/email/outbound-emails"),
  body: { FromEmailAddress: "orders@acme.example" },
  region: "me-central-1",
  service: "ses",
  accessKeyId: "AKIDEXAMPLE",
  secretAccessKey: "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
  now: new Date("2026-10-25T10:20:30.456Z"),
};

describe("signAwsV4", () => {
  it("signs the request", async () => {
    const headers = await signAwsV4(request);
    expect(headers["x-amz-date"]).toBe("20261025T102030Z");
    expect(headers["content-type"]).toBe("application/json");
    expect(headers["authorization"]).toMatch(
      /^AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE\/20261025\/me-central-1\/ses\/aws4_request, SignedHeaders=content-type;host;x-amz-date, Signature=[0-9a-f]{64}$/,
    );
    expect(JSON.stringify(headers)).not.toContain(request.secretAccessKey);
  });

  it("is stable for one request and changes with the body", async () => {
    const first = await signAwsV4(request);
    expect((await signAwsV4(request))["authorization"]).toBe(first["authorization"]);
    expect(
      (await signAwsV4({ ...request, body: { FromEmailAddress: "x@acme.example" } }))[
        "authorization"
      ],
    ).not.toBe(first["authorization"]);
  });
});
