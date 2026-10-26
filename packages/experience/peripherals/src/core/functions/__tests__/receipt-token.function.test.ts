/**
 * Stackra file contract:
 * Purpose: proves a receipt token signed with `signReceiptToken` verifies with the matching public key (also through
 *          `importReceiptPublicKey` from its base64url text), and that a tampered, foreign-key or malformed token is
 *          refused with its reason; and that a key text that is not 32 bytes is refused.
 * Boundary: test only; real Web Crypto Ed25519 keys made in the test.
 * Runtime: node
 * Governing contract: ADR 0429 (decision 2); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { base64Url } from "#core/functions/base64-url.function";
import { importReceiptPublicKey } from "#core/functions/import-receipt-public-key.function";
import { signReceiptToken } from "#core/functions/sign-receipt-token.function";
import { verifyReceiptToken } from "#core/functions/verify-receipt-token.function";

const CLAIMS = { receiptId: "rct_1", nodeId: "nod_1", issuedAt: 1_760_000_000_000 };

/** A fresh Ed25519 key pair. */
const keyPair = () =>
  crypto.subtle.generateKey("Ed25519", true, ["sign", "verify"]) as Promise<CryptoKeyPair>;

describe("receipt tokens", () => {
  it("verify with the matching public key, also imported from its text", async () => {
    const keys = await keyPair();
    const token = await signReceiptToken(CLAIMS, keys.privateKey);
    expect(await verifyReceiptToken(token, keys.publicKey)).toEqual({ ok: true, claims: CLAIMS });
    const raw = new Uint8Array(await crypto.subtle.exportKey("raw", keys.publicKey));
    const imported = await importReceiptPublicKey(base64Url(raw));
    expect((await verifyReceiptToken(token, imported)).ok).toBe(true);
  });

  it("refuse a tampered token or another key's", async () => {
    const keys = await keyPair();
    const other = await keyPair();
    const token = await signReceiptToken(CLAIMS, keys.privateKey);
    const [, signature] = token.split(".");
    const forged = `${base64Url(new TextEncoder().encode(JSON.stringify({ ...CLAIMS, receiptId: "rct_2" })))}.${signature}`;
    expect(await verifyReceiptToken(forged, keys.publicKey)).toEqual({
      ok: false,
      reason: "signature",
    });
    expect(await verifyReceiptToken(token, other.publicKey)).toEqual({
      ok: false,
      reason: "signature",
    });
  });

  it("refuse what is not a token", async () => {
    const keys = await keyPair();
    for (const text of [
      "",
      "abc",
      "a.b.c",
      "!!.??",
      `${base64Url(new TextEncoder().encode("{}"))}.AAAA`,
    ])
      expect(await verifyReceiptToken(text, keys.publicKey)).toEqual({
        ok: false,
        reason: "malformed",
      });
  });

  it("refuse a key text that is not 32 bytes", async () => {
    await expect(importReceiptPublicKey("AAAA")).rejects.toThrow(RangeError);
  });
});
