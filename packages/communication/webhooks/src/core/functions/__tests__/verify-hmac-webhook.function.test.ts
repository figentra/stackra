/**
 * Stackra file contract:
 * Purpose: unit tests of `verifyHmacWebhook`: a Stripe-shaped recipe (`t=…,v1=…`, hex SHA-256 over `<t>.<body>`, five
 *          minutes) verifies any of several signatures and refuses a stale timestamp, a tampered body and a wrong
 *          secret; a Checkout.com-shaped recipe (a hex digest of the body alone) verifies with no timestamp; a Base64
 *          recipe with a prefixed Base64 secret, a separate timestamp header and an id verifies; malformed headers
 *          answer false; an empty secret is a configuration error.
 * Boundary: test only; Web Crypto runs for real and every signature is made here, so no vendor value is quoted.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0308 (rule 15); stackra-223 (`tolerance` is a `Duration`, was `"5m"`).
 */
import { Duration } from "@stackra/contracts";
import type { WebhookSignature } from "@stackra/integrations";
import { describe, expect, it } from "@stackra/testing";

import { verifyHmacWebhook } from "#core/functions/verify-hmac-webhook.function";

const NOW = new Date("2026-10-26T09:00:00Z");
const T = String(NOW.getTime() / 1000);
const SECRET = "whsec_test_secret";
const BODY = '{"id":"evt_1","type":"payment_intent.succeeded"}';

const STRIPE: WebhookSignature = {
  header: "stripe-signature",
  parts: { separator: ",", assign: "=", signature: "v1", timestamp: "t" },
  algorithm: "SHA-256",
  encoding: "hex",
  payload: "{timestamp}.{body}",
  tolerance: Duration.minutes(5),
};

const CHECKOUT: WebhookSignature = {
  header: "cko-signature",
  algorithm: "SHA-256",
  encoding: "hex",
  payload: "{body}",
};

/** The HMAC of `text` with `key` bytes, as `encoding`. */
async function mac(
  key: Uint8Array<ArrayBuffer>,
  text: string,
  encoding: "hex" | "base64",
  hash = "SHA-256",
): Promise<string> {
  const imported = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash }, false, [
    "sign",
  ]);
  const bytes = new Uint8Array(
    await crypto.subtle.sign("HMAC", imported, new TextEncoder().encode(text)),
  );
  return encoding === "hex"
    ? Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
    : btoa(String.fromCodePoint(...bytes));
}

const utf8 = (text: string) => new TextEncoder().encode(text);

describe("verifyHmacWebhook", () => {
  it("verifies a Stripe-shaped header with several signatures", async () => {
    const good = await mac(utf8(SECRET), `${T}.${BODY}`, "hex");
    const header = `t=${T},v1=${"0".repeat(64)},v1=${good},v0=ignored`;
    await expect(
      verifyHmacWebhook({ "stripe-signature": header }, BODY, STRIPE, [SECRET], NOW),
    ).resolves.toBe(true);
  });

  it("refuses a stale timestamp, a tampered body and a wrong secret", async () => {
    const good = await mac(utf8(SECRET), `${T}.${BODY}`, "hex");
    const header = { "stripe-signature": `t=${T},v1=${good}` };
    const later = new Date(NOW.getTime() + 6 * 60_000);
    await expect(verifyHmacWebhook(header, BODY, STRIPE, [SECRET], later)).resolves.toBe(false);
    await expect(verifyHmacWebhook(header, `${BODY} `, STRIPE, [SECRET], NOW)).resolves.toBe(false);
    await expect(verifyHmacWebhook(header, BODY, STRIPE, ["other"], NOW)).resolves.toBe(false);
    await expect(verifyHmacWebhook(header, BODY, STRIPE, ["other", SECRET], NOW)).resolves.toBe(
      true,
    );
  });

  it("verifies a Checkout.com-shaped digest of the body alone", async () => {
    const good = await mac(utf8(SECRET), BODY, "hex");
    await expect(
      verifyHmacWebhook({ "cko-signature": good }, BODY, CHECKOUT, [SECRET], NOW),
    ).resolves.toBe(true);
  });

  it("verifies Base64 with a prefixed Base64 secret, a timestamp header and an id", async () => {
    const raw = utf8("raw-key-bytes");
    const recipe: WebhookSignature = {
      header: "x-signature",
      timestampHeader: "x-timestamp",
      idHeader: "x-id",
      algorithm: "SHA-512",
      encoding: "base64",
      secretEncoding: "base64",
      secretPrefix: "key_",
      payload: "{id}:{timestamp}:{body}",
      tolerance: Duration.minutes(1),
    };
    const signature = await mac(raw, `m1:${T}:${BODY}`, "base64", "SHA-512");
    const secret = `key_${btoa("raw-key-bytes")}`;
    await expect(
      verifyHmacWebhook(
        { "x-signature": signature, "x-timestamp": T, "x-id": "m1" },
        BODY,
        recipe,
        [secret],
        NOW,
      ),
    ).resolves.toBe(true);
    await expect(
      verifyHmacWebhook(
        { "x-signature": signature, "x-timestamp": T },
        BODY,
        recipe,
        [secret],
        NOW,
      ),
    ).resolves.toBe(false);
  });

  it("answers false for missing or malformed headers and throws for an empty secret", async () => {
    await expect(verifyHmacWebhook({}, BODY, STRIPE, [SECRET], NOW)).resolves.toBe(false);
    await expect(
      verifyHmacWebhook({ "stripe-signature": "v1=abc" }, BODY, STRIPE, [SECRET], NOW),
    ).resolves.toBe(false);
    await expect(
      verifyHmacWebhook({ "stripe-signature": `t=${T},v1=xyz` }, BODY, STRIPE, [SECRET], NOW),
    ).resolves.toBe(false);
    await expect(
      verifyHmacWebhook({ "cko-signature": "00" }, BODY, CHECKOUT, [""], NOW),
    ).rejects.toThrow(TypeError);
  });
});
