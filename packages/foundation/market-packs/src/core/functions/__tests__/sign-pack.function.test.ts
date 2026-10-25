/**
 * Stackra file contract:
 * Purpose: unit tests of `signPack` and its round trip through `verifyPack`: the hash covers the canonical pack, the signature verifies, and a bad pack is refused before signing.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { describe, expect, it } from "@stackra/testing";

import { PackStatus } from "#core/enums/pack-status.enum";
import { contentHash } from "#core/functions/content-hash.function";
import { signPack } from "#core/functions/sign-pack.function";
import { verifyPack } from "#core/functions/verify-pack.function";
import type { MarketPack } from "#core/types/market-pack.type";

const pack: MarketPack = {
  market: "xa",
  version: "1.0.0",
  status: PackStatus.Live,
  entries: [{ key: "tax.rate", value: 7, from: "2026-01-01" }],
  reviews: [],
  checklist: [],
};

describe("signPack", () => {
  it("hashes the pack and signs the hash", async () => {
    const keys = await crypto.subtle.generateKey("Ed25519", true, ["sign", "verify"]);
    const signed = await signPack(pack, "key_1", keys.privateKey);
    expect(signed.hash).toBe(await contentHash(pack));
    expect(signed.signature.keyId).toBe("key_1");
    const publicKey = new Uint8Array(await crypto.subtle.exportKey("raw", keys.publicKey));
    const trusted = { key_1: btoa(String.fromCharCode(...publicKey)) };
    expect(await verifyPack(JSON.parse(JSON.stringify(signed)), trusted)).toEqual(pack);
  });

  it("refuses a pack of the wrong shape", async () => {
    const keys = await crypto.subtle.generateKey("Ed25519", false, ["sign", "verify"]);
    await expect(signPack({ ...pack, version: "1" }, "key_1", keys.privateKey)).rejects.toThrow();
  });
});
