/**
 * Stackra file contract:
 * Purpose: unit tests of `signEdgeRequest`: a base64url HMAC-SHA256 that matches Node's own HMAC over the documented
 *          field order, treats a null scope as empty, upper-cases the method, and changes with any covered field or
 *          the secret.
 * Boundary: test only; Node's `node:crypto` is the independent reference.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0437 (decision 4).
 */
import { createHmac } from "node:crypto";

import { describe, expect, it } from "@stackra/testing";

import type { EdgeSignatureInput } from "#contracts/types/edge-signature-input.type";
import { signEdgeRequest } from "#core/functions/sign-edge-request.function";

const input: EdgeSignatureInput = {
  scope: "scope-1",
  product: "commerce",
  surface: "console",
  realm: "staff",
  requestId: "req-1",
  timestamp: 1_800_000_000,
  method: "post",
  path: "/api/orders?x=1",
  bodyHash: "abc",
};

describe("signEdgeRequest", () => {
  it("is the base64url HMAC-SHA256 of the fields joined by newlines", async () => {
    const bytes =
      "scope-1\ncommerce\nconsole\nstaff\nreq-1\n1800000000\nPOST\n/api/orders?x=1\nabc";
    const reference = createHmac("sha256", "secret").update(bytes).digest("base64url");
    expect(await signEdgeRequest(input, "secret")).toBe(reference);
  });

  it("signs a platform host's null scope as empty", async () => {
    const bytes = "\ncommerce\nconsole\nstaff\nreq-1\n1800000000\nPOST\n/api/orders?x=1\nabc";
    const reference = createHmac("sha256", "secret").update(bytes).digest("base64url");
    expect(await signEdgeRequest({ ...input, scope: null }, "secret")).toBe(reference);
  });

  it("changes with any covered field or the secret", async () => {
    const base = await signEdgeRequest(input, "secret");
    expect(await signEdgeRequest({ ...input, path: "/api/other" }, "secret")).not.toBe(base);
    expect(await signEdgeRequest({ ...input, timestamp: input.timestamp + 1 }, "secret")).not.toBe(
      base,
    );
    expect(await signEdgeRequest(input, "other")).not.toBe(base);
  });
});
