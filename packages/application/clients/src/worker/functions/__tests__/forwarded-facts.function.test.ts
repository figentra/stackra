/**
 * Stackra file contract:
 * Purpose: unit tests of `forwardedFacts`: the trace context and `Sec-Purpose` are forwarded as sent, the visitor's
 *          address is signed with HMAC-SHA256 under the key (verified here as the gateway would), a missing header is
 *          not forwarded, and an empty key is refused.
 * Boundary: test only; Web Crypto of the test runtime stands in for the Worker's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0237 (generated gateway).
 */
import { describe, expect, it } from "@stackra/testing";

import { forwardedFacts } from "#worker/functions/forwarded-facts.function";

/** Whether `signature` (base64url) is the HMAC-SHA256 of `message` under `secret`. */
async function verifies(secret: string, message: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const bytes = Uint8Array.from(atob(signature.replace(/-/g, "+").replace(/_/g, "/")), (char) =>
    // oxlint-disable-next-line unicorn/prefer-code-point -- a binary string: every character is one byte, so the code unit is the byte
    char.charCodeAt(0),
  );
  return crypto.subtle.verify("HMAC", key, bytes, encoder.encode(message));
}

describe("forwardedFacts", () => {
  it("forwards the trace context and the purpose, and signs the visitor's address", async () => {
    const request = new Request("https://acme.example/pricing", {
      headers: {
        traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
        "Sec-Purpose": "prefetch",
        "CF-Connecting-IP": "203.0.113.7",
      },
    });
    const facts = await forwardedFacts(request, { signingKey: "k3y" });
    expect(facts["traceparent"]).toBe("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01");
    expect(facts["Sec-Purpose"]).toBe("prefetch");
    const [address, time, signature] = (facts["Stackra-Visitor"] ?? "").split(";");
    expect(address).toBe("203.0.113.7");
    expect(Math.abs(Number(time) - Date.now() / 1000)).toBeLessThan(5);
    expect(await verifies("k3y", `${address};${time}`, signature ?? "")).toBe(true);
    expect(await verifies("other", `${address};${time}`, signature ?? "")).toBe(false);
  });

  it("forwards nothing the request lacks", async () => {
    const facts = await forwardedFacts(new Request("https://acme.example/"), { signingKey: "k3y" });
    expect(facts).toEqual({});
  });

  it("refuses an empty signing key", async () => {
    await expect(
      forwardedFacts(new Request("https://acme.example/"), { signingKey: "" }),
    ).rejects.toThrow(RangeError);
  });
});
