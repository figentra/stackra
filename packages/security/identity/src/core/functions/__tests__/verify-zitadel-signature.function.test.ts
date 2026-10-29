/**
 * Stackra file contract:
 * Purpose: unit tests of `verifyZitadelSignature`: a header made the way ZITADEL makes it (HMAC-SHA256 of
 *          `<t>.<body>`, hex) verifies, also as the second `v1` of a key rotation; a changed body, another key, an
 *          empty key, a missing or malformed header and a timestamp beyond five minutes do not.
 * Boundary: test only; the expected signatures come from `node:crypto`, independent of the Web Crypto code.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ZITADEL Actions v2 (target signing); STA-1579.
 */
import { createHmac } from "node:crypto";

import { describe, expect, it } from "@stackra/testing";

import { verifyZitadelSignature } from "#core/functions/verify-zitadel-signature.function";

const KEY = "zitadel-signing-key";
const BODY = '{"event_type":"user.locked"}';
const NOW = Date.UTC(2026, 9, 29, 12);
const T = NOW / 1000;

/** The `v1` ZITADEL computes for `body` at `t` under `key`. */
const v1 = (t: number, body: string, key: string) =>
  createHmac("sha256", key).update(`${t}.${body}`).digest("hex");

describe(verifyZitadelSignature, () => {
  it("accepts ZITADEL's signature, also as the second key of a rotation", async () => {
    await expect(
      verifyZitadelSignature(`t=${T},v1=${v1(T, BODY, KEY)}`, BODY, KEY, NOW),
    ).resolves.toBe(true);
    const rotated = `t=${T},v1=${v1(T, BODY, "old-key")},v1=${v1(T, BODY, KEY)}`;
    await expect(verifyZitadelSignature(rotated, BODY, KEY, NOW)).resolves.toBe(true);
  });

  it("refuses a changed body, another key and an empty key", async () => {
    const header = `t=${T},v1=${v1(T, BODY, KEY)}`;
    await expect(verifyZitadelSignature(header, `${BODY} `, KEY, NOW)).resolves.toBe(false);
    await expect(verifyZitadelSignature(header, BODY, "other", NOW)).resolves.toBe(false);
    await expect(verifyZitadelSignature(header, BODY, "", NOW)).resolves.toBe(false);
  });

  it("refuses a missing or malformed header", async () => {
    await expect(verifyZitadelSignature(null, BODY, KEY, NOW)).resolves.toBe(false);
    await expect(verifyZitadelSignature(`v1=${v1(T, BODY, KEY)}`, BODY, KEY, NOW)).resolves.toBe(
      false,
    );
    await expect(verifyZitadelSignature(`t=${T},v1=zz`, BODY, KEY, NOW)).resolves.toBe(false);
    await expect(
      verifyZitadelSignature(`t=abc,v1=${v1(T, BODY, KEY)}`, BODY, KEY, NOW),
    ).resolves.toBe(false);
  });

  it("refuses a timestamp more than five minutes off (replay)", async () => {
    const stale = T - 301;
    await expect(
      verifyZitadelSignature(`t=${stale},v1=${v1(stale, BODY, KEY)}`, BODY, KEY, NOW),
    ).resolves.toBe(false);
    const edge = T - 300;
    await expect(
      verifyZitadelSignature(`t=${edge},v1=${v1(edge, BODY, KEY)}`, BODY, KEY, NOW),
    ).resolves.toBe(true);
  });
});
