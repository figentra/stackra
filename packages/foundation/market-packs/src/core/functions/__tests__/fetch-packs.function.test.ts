/**
 * Stackra file contract:
 * Purpose: unit tests of `fetchPacks`: stored and signed packs load in the order asked, a missing hash is `not_stored`,
 *          a pack filed under another hash is `hash_mismatch`, and an untrusted signature is refused.
 * Boundary: test only; a map-backed store stands in. Pack data is a made-up fixture, not any market's values
 *           (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0385.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { PackRejection } from "#core/enums/pack-rejection.enum";
import { PackStatus } from "#core/enums/pack-status.enum";
import { PackRejectedError } from "#core/errors/pack-rejected.error";
import { fetchPacks } from "#core/functions/fetch-packs.function";
import { signPack } from "#core/functions/sign-pack.function";
import { PackStore } from "#core/ports/pack-store.port";
import type { MarketPack } from "#core/types/market-pack.type";
import type { SignedPack } from "#core/types/signed-pack.type";

/** A store over a map, filed by whatever key the test chooses. */
class MapStore extends PackStore {
  readonly stored = new Map<string, unknown>();

  async get(hash: string): Promise<unknown> {
    return this.stored.get(hash) ?? null;
  }

  async put(signed: SignedPack): Promise<void> {
    this.stored.set(signed.hash, signed);
  }

  async hashes(): Promise<readonly string[]> {
    return [...this.stored.keys()].sort();
  }
}

/** A pack version of `market`. */
function pack(market: string): MarketPack {
  return {
    market,
    version: "1.0.0",
    status: PackStatus.Live,
    entries: [],
    reviews: [],
    checklist: [],
  };
}

/** A key pair and its trusted-keys entry. */
async function keyPair() {
  const keys = await crypto.subtle.generateKey("Ed25519", true, ["sign", "verify"]);
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", keys.publicKey));
  return { privateKey: keys.privateKey, trusted: { key_1: btoa(String.fromCodePoint(...raw)) } };
}

/** The rejection reason `promise` fails with. */
async function reasonOf(promise: Promise<unknown>): Promise<string | undefined> {
  const error: unknown = await promise.catch((caught: unknown) => caught);
  return isRefusal(error, PackRejectedError) ? error.reason : undefined;
}

describe("fetchPacks", () => {
  it("loads verified packs in the order asked", async () => {
    const { privateKey, trusted } = await keyPair();
    const store = new MapStore();
    const one = await signPack(pack("xa"), "key_1", privateKey);
    const two = await signPack(pack("xb"), "key_1", privateKey);
    await store.put(one);
    await store.put(two);
    const packs = await fetchPacks(store, [two.hash, one.hash], trusted);
    expect(packs.map((loaded) => loaded.market)).toEqual(["xb", "xa"]);
  });

  it("refuses a hash the store lacks", async () => {
    const { trusted } = await keyPair();
    expect(await reasonOf(fetchPacks(new MapStore(), ["c".repeat(64)], trusted))).toBe(
      PackRejection.NotStored,
    );
  });

  it("refuses a pack filed under another hash", async () => {
    const { privateKey, trusted } = await keyPair();
    const store = new MapStore();
    store.stored.set("d".repeat(64), await signPack(pack("xa"), "key_1", privateKey));
    expect(await reasonOf(fetchPacks(store, ["d".repeat(64)], trusted))).toBe(
      PackRejection.HashMismatch,
    );
  });

  it("refuses an untrusted signature", async () => {
    const { privateKey } = await keyPair();
    const { trusted } = await keyPair();
    const store = new MapStore();
    const shipped = await signPack(pack("xa"), "key_1", privateKey);
    await store.put(shipped);
    expect(await reasonOf(fetchPacks(store, [shipped.hash], trusted))).toBe(
      PackRejection.SignatureInvalid,
    );
  });
});
