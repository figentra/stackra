/**
 * Stackra file contract:
 * Purpose: unit tests of `CHATWOOT_WEBHOOK_SIGNATURE` through `verifyHmacWebhook`: a delivery signed as Chatwoot signs
 *          (`sha256=<hex>` of `<timestamp>.<body>`) verifies; a tampered body, a wrong secret, a stale or missing
 *          timestamp and a missing signature do not.
 * Boundary: test only; Web Crypto runs for real and every signature is made here.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0308 (rule 15); ADR 0448 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { CHATWOOT_WEBHOOK_SIGNATURE } from "#core/constants/chatwoot-webhook-signature.constant";
import { verifyHmacWebhook } from "#core/functions/verify-hmac-webhook.function";

const NOW = new Date("2026-10-27T09:00:00Z");
const T = String(NOW.getTime() / 1000);
const SECRET = "chatwoot_test_secret";
const BODY = '{"event":"message_created","id":1}';

/** The hex HMAC-SHA256 of `text` with `secret`. */
async function sign(secret: string, text: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text)),
  );
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Chatwoot's headers for `body` signed at `timestamp`. */
async function headers(body: string, timestamp = T, secret = SECRET) {
  return {
    "x-chatwoot-signature": `sha256=${await sign(secret, `${timestamp}.${body}`)}`,
    "x-chatwoot-timestamp": timestamp,
  };
}

const verify = (h: Readonly<Record<string, string | undefined>>, body = BODY) =>
  verifyHmacWebhook(h, body, CHATWOOT_WEBHOOK_SIGNATURE, [SECRET], NOW);

describe("CHATWOOT_WEBHOOK_SIGNATURE", () => {
  it("verifies a signed delivery", async () => {
    expect(await verify(await headers(BODY))).toBe(true);
  });

  it("refuses a tampered body or a wrong secret", async () => {
    expect(await verify(await headers(BODY), `${BODY} `)).toBe(false);
    expect(await verify(await headers(BODY, T, "other"))).toBe(false);
  });

  it("refuses a stale or missing timestamp and a missing signature", async () => {
    expect(await verify(await headers(BODY, String(Number(T) - 301)))).toBe(false);
    const signed = await headers(BODY);
    expect(await verify({ "x-chatwoot-signature": signed["x-chatwoot-signature"] })).toBe(false);
    expect(await verify({ "x-chatwoot-timestamp": T })).toBe(false);
  });
});
