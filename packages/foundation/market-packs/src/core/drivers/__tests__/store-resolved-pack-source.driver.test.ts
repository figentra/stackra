/**
 * Stackra file contract:
 * Purpose: unit tests of `StoreResolvedPackSourceDriver`: it fetches and verifies the configured hashes once, serves
 *          them to every caller, refuses a hash the store lacks with `not_stored`, and tries again after a failed load.
 * Boundary: test only; a map-backed `PackStore` stands in and keys are generated per run. Pack data is made up.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0418; ADR 0385.
 */
import { buildConfig } from "@stackra/config";
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { MarketPacksConfig } from "#config/market-packs.config";
import { StoreResolvedPackSourceDriver } from "#core/drivers/store-resolved-pack-source.driver";
import { PackRejection } from "#core/enums/pack-rejection.enum";
import { PackStatus } from "#core/enums/pack-status.enum";
import { PackRejectedError } from "#core/errors/pack-rejected.error";
import { signPack } from "#core/functions/sign-pack.function";
import { PackStore } from "#core/ports/pack-store.port";
import type { MarketPack } from "#core/types/market-pack.type";
import type { SignedPack } from "#core/types/signed-pack.type";

/** A store over a map that counts reads. */
class MapStore extends PackStore {
  readonly stored = new Map<string, unknown>();

  reads = 0;

  async get(hash: string): Promise<unknown> {
    this.reads += 1;
    return this.stored.get(hash) ?? null;
  }

  async put(signed: SignedPack): Promise<void> {
    this.stored.set(signed.hash, signed);
  }

  async hashes(): Promise<readonly string[]> {
    return [...this.stored.keys()].sort();
  }
}

const PACK: MarketPack = {
  market: "xa",
  version: "1.0.0",
  status: PackStatus.Live,
  entries: [{ key: "billing.currency", value: "XAA", from: "2000-01-01" }],
  reviews: [],
  checklist: [],
};

/** A signed fixture pack, the store holding it, and a config that trusts its key. */
async function setUp(stored: boolean) {
  const keys = await crypto.subtle.generateKey("Ed25519", true, ["sign", "verify"]);
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", keys.publicKey));
  const signed = await signPack(PACK, "key_1", keys.privateKey);
  const store = new MapStore();
  if (stored) await store.put(signed);
  const config = buildConfig(MarketPacksConfig, {
    values: {
      packHashes: [signed.hash],
      trustedKeys: { key_1: btoa(String.fromCodePoint(...raw)) },
    },
  });
  return { signed, store, source: new StoreResolvedPackSourceDriver(store, config) };
}

describe("StoreResolvedPackSourceDriver", () => {
  it("loads the configured packs once and serves them", async () => {
    const { store, source } = await setUp(true);
    const [first, second] = await Promise.all([source.packs(), source.packs()]);
    expect(first).toBe(second);
    expect(first.map((pack) => pack.market)).toEqual(["xa"]);
    expect(store.reads).toBe(1);
    expect((await source.valueFor("xa", "billing.currency", { on: "2026-01-01" }))?.value).toBe(
      "XAA",
    );
  });

  it("refuses a hash the store lacks and tries again on the next call", async () => {
    const { signed, store, source } = await setUp(false);
    const error: unknown = await source.packs().catch((caught: unknown) => caught);
    expect(isRefusal(error, PackRejectedError) ? error.reason : undefined).toBe(
      PackRejection.NotStored,
    );
    await store.put(signed);
    await expect(source.packs()).resolves.toHaveLength(1);
  });
});
