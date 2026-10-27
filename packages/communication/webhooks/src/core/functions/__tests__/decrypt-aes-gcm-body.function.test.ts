/**
 * Stackra file contract:
 * Purpose: unit tests of `decryptAesGcmBody` (the `aes_gcm_body` scheme): a HyperPay-shaped notification encrypted
 *          AES-256-GCM, hex body with the hex IV and tag in `x-initialization-vector` and `x-authentication-tag`,
 *          decrypts to its JSON under any of several keys; a changed byte, a wrong key, a missing or non-hex header
 *          answer `undefined`; a key that is not 16, 24 or 32 bytes of hex is a configuration error.
 * Boundary: test only; the header names and payload shape follow HyperPay's public webhook documentation and every
 *           ciphertext is made here (no captured delivery, no vendor value quoted): certification pending (owner
 *           decision D3). Web Crypto runs for real.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0308 (rule 15); NIST SP 800-38D; STA-1357.
 */
import type { WebhookSchemeRecipe } from "@stackra/integrations";
import { describe, expect, it } from "@stackra/testing";

import { decryptAesGcmBody } from "#core/functions/decrypt-aes-gcm-body.function";

const KEY = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
const OTHER_KEY = "1f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100";
const IV = "0a0b0c0d0e0f101112131415";
const RECIPE: WebhookSchemeRecipe = {
  ivHeader: "x-initialization-vector",
  tagHeader: "x-authentication-tag",
};
const PLAIN = JSON.stringify({
  type: "PAYMENT",
  payload: {
    id: "8ac7a4a0-0001",
    paymentType: "DB",
    amount: "100.00",
    currency: "SAR",
    result: { code: "000.100.110" },
  },
});

const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
const bytesOf = (text: string) =>
  new Uint8Array(text.match(/../g)?.map((pair) => Number.parseInt(pair, 16)) ?? []);

/** `PLAIN` encrypted under `KEY`: the hex body and the hex tag. */
async function sealed(): Promise<{ body: string; tag: string }> {
  const key = await crypto.subtle.importKey("raw", bytesOf(KEY), { name: "AES-GCM" }, false, [
    "encrypt",
  ]);
  const out = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: bytesOf(IV) },
      key,
      new TextEncoder().encode(PLAIN),
    ),
  );
  return { body: hex(out.slice(0, -16)), tag: hex(out.slice(-16)) };
}

/** The request HyperPay sends. */
const requestOf = (body: string, tag: string, iv = IV) => ({
  headers: { "x-initialization-vector": iv, "x-authentication-tag": tag },
  body,
});

describe(decryptAesGcmBody, () => {
  it("decrypts the body under any of several keys", async () => {
    const { body, tag } = await sealed();
    await expect(decryptAesGcmBody(requestOf(body, tag), RECIPE, [KEY])).resolves.toBe(PLAIN);
    await expect(
      decryptAesGcmBody(requestOf(`${body}\n`, tag), RECIPE, [OTHER_KEY, KEY]),
    ).resolves.toBe(PLAIN);
  });

  it("answers undefined for a changed byte, a wrong key and a missing or non-hex header", async () => {
    const { body, tag } = await sealed();
    const flipped = `${body.slice(0, -2)}${body.endsWith("00") ? "01" : "00"}`;
    await expect(
      decryptAesGcmBody(requestOf(flipped, tag), RECIPE, [KEY]),
    ).resolves.toBeUndefined();
    await expect(
      decryptAesGcmBody(requestOf(body, tag), RECIPE, [OTHER_KEY]),
    ).resolves.toBeUndefined();
    await expect(
      decryptAesGcmBody(requestOf(body, tag, "nothex"), RECIPE, [KEY]),
    ).resolves.toBeUndefined();
    await expect(decryptAesGcmBody({ headers: {}, body }, RECIPE, [KEY])).resolves.toBeUndefined();
    await expect(decryptAesGcmBody(requestOf(body, tag), {}, [KEY])).resolves.toBeUndefined();
  });

  it("refuses a key that is not 16, 24 or 32 bytes of hex", async () => {
    const { body, tag } = await sealed();
    await expect(decryptAesGcmBody(requestOf(body, tag), RECIPE, ["abcd"])).rejects.toThrow(
      TypeError,
    );
    await expect(decryptAesGcmBody(requestOf(body, tag), RECIPE, ["not a key"])).rejects.toThrow(
      TypeError,
    );
  });
});
