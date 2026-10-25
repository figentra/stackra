/**
 * Stackra file contract:
 * Purpose: unit tests of `verifyPack`: a signed pack loads, and a wrong shape, a changed value, an unknown key and another key's signature are refused with their reasons.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { PackRejection } from "#core/enums/pack-rejection.enum";
import { PackStatus } from "#core/enums/pack-status.enum";
import { PackRejectedError } from "#core/errors/pack-rejected.error";
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

/** A fresh key pair and its trusted-keys entry. */
async function keyPair(keyId: string) {
  const keys = await crypto.subtle.generateKey("Ed25519", true, ["sign", "verify"]);
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", keys.publicKey));
  return { privateKey: keys.privateKey, trusted: { [keyId]: btoa(String.fromCharCode(...raw)) } };
}

/** The rejection reason `promise` fails with. */
async function reasonOf(promise: Promise<unknown>): Promise<string | undefined> {
  const error: unknown = await promise.catch((caught: unknown) => caught);
  return isRefusal(error, PackRejectedError) ? error.reason : undefined;
}

describe("verifyPack", () => {
  it("returns the pack of a signed input", async () => {
    const { privateKey, trusted } = await keyPair("key_1");
    const shipped = JSON.parse(JSON.stringify(await signPack(pack, "key_1", privateKey)));
    expect(await verifyPack(shipped, trusted)).toEqual(pack);
  });

  it("refuses a wrong shape", async () => {
    const { trusted } = await keyPair("key_1");
    expect(await reasonOf(verifyPack({ pack }, trusted))).toBe(PackRejection.ShapeInvalid);
  });

  it("refuses a changed value", async () => {
    const { privateKey, trusted } = await keyPair("key_1");
    const shipped = JSON.parse(JSON.stringify(await signPack(pack, "key_1", privateKey)));
    shipped.pack.entries[0].value = 0;
    expect(await reasonOf(verifyPack(shipped, trusted))).toBe(PackRejection.HashMismatch);
  });

  it("refuses an unknown key", async () => {
    const { privateKey } = await keyPair("key_1");
    const { trusted } = await keyPair("key_2");
    const signed = await signPack(pack, "key_1", privateKey);
    expect(await reasonOf(verifyPack(signed, trusted))).toBe(PackRejection.KeyUnknown);
  });

  it("refuses a signature by another key under a trusted id", async () => {
    const { privateKey } = await keyPair("key_1");
    const { trusted } = await keyPair("key_1");
    const signed = await signPack(pack, "key_1", privateKey);
    expect(await reasonOf(verifyPack(signed, trusted))).toBe(PackRejection.SignatureInvalid);
  });
});
