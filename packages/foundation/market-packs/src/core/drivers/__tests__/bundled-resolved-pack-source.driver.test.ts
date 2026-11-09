/**
 * Stackra file contract:
 * Purpose: unit tests of `BundledResolvedPackSourceDriver`, the interim source: a pinned live pack is served and an
 *          unpinned file never read; a pin with no bundled pack, a pack whose content no longer hashes to its pin and a
 *          pinned draft are refused; production without `allowBundledInProduction` refuses at construction; and
 *          `BUNDLED_PACK_HASHES` lists exactly the live bundled files under their content hash.
 * Boundary: test only; made-up packs (market `xa`) through `with`, and the real `assets/data/packs/` files for the
 *           index check.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0386 (as amended 2026-11-09); ADR 0385 (decision 7).
 */
import { readdirSync, readFileSync } from "node:fs";

import { buildConfig } from "@stackra/config";
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { MarketPacksConfig } from "#config/market-packs.config";
import { BUNDLED_PACK_HASHES } from "#core/constants/bundled-pack-hashes.constant";
import { BUNDLED_PACK_LOADERS } from "#core/constants/bundled-pack-loaders.constant";
import { BundledResolvedPackSourceDriver } from "#core/drivers/bundled-resolved-pack-source.driver";
import { PackRejection } from "#core/enums/pack-rejection.enum";
import { PackStatus } from "#core/enums/pack-status.enum";
import { BundledPackSourceRefusedError } from "#core/errors/bundled-pack-source-refused.error";
import { PackRejectedError } from "#core/errors/pack-rejected.error";
import { contentHash } from "#core/functions/content-hash.function";
import type { MarketPack } from "#core/types/market-pack.type";

/** A made-up pack of market `xa` with `status`. */
const pack = (status: PackStatus): MarketPack => ({
  market: "xa",
  version: "1.0.0",
  status,
  entries: [{ key: "billing.currency", value: "XAA", from: "2026-01-01" }],
  reviews: [],
  checklist: [],
});

/** A `with` source over one bundled `xa` file, pinned (or not) and indexed under `indexed`, counting its reads. */
async function setUp(file: MarketPack, options: { pinned?: boolean; indexed?: string } = {}) {
  const hash = await contentHash(file);
  let reads = 0;
  const source = BundledResolvedPackSourceDriver.with({
    config: {
      packHashes: options.pinned === false ? [] : [hash],
      environment: "dev",
      allowBundledInProduction: false,
    },
    index: { [options.indexed ?? hash]: "xa" },
    loaders: {
      xa: async () => {
        reads += 1;
        return { default: file };
      },
    },
  });
  return { hash, source, reads: () => reads };
}

/** The `PackRejection` a load refused with, or undefined. */
const rejection = async (load: Promise<unknown>) => {
  try {
    await load;
    return undefined;
  } catch (error) {
    return isRefusal(error, PackRejectedError) ? error.reason : undefined;
  }
};

/** The market-packs config with `values` over the defaults. */
const config = (values: Record<string, unknown>) => buildConfig(MarketPacksConfig, { values });

describe("BundledResolvedPackSourceDriver", () => {
  it("serves a pinned live pack, once", async () => {
    const { source, reads } = await setUp(pack(PackStatus.Live));

    const [first, second] = await Promise.all([source.packs(), source.packs()]);

    expect(first).toBe(second);
    expect(first.map((served) => served.market)).toEqual(["xa"]);
    expect(reads()).toBe(1);
    expect((await source.valueFor("xa", "billing.currency", { on: "2026-11-09" }))?.value).toBe(
      "XAA",
    );
  });

  /** The pin is the trust: a bundled file nobody pinned is never read. */
  it("never reads an unpinned file", async () => {
    const { source, reads } = await setUp(pack(PackStatus.Live), { pinned: false });

    expect(await source.packs()).toEqual([]);
    expect(reads()).toBe(0);
  });

  it("refuses a pin with no bundled pack, a changed file and a pinned draft", async () => {
    const missing = await setUp(pack(PackStatus.Live), { indexed: "0".repeat(64) });
    // the file's content no longer hashes to the hash the index and the pin name
    const changed = await setUp(pack(PackStatus.Live));
    const stale = BundledResolvedPackSourceDriver.with({
      config: { packHashes: [changed.hash], environment: "dev", allowBundledInProduction: false },
      index: { [changed.hash]: "xa" },
      loaders: { xa: async () => ({ default: { ...pack(PackStatus.Live), version: "1.0.1" } }) },
    });
    const draft = await setUp(pack(PackStatus.Draft));

    expect(await rejection(missing.source.packs())).toBe(PackRejection.NotStored);
    expect(await rejection(stale.packs())).toBe(PackRejection.HashMismatch);
    expect(await rejection(draft.source.packs())).toBe(PackRejection.NotLive);
  });

  /** Unsigned packs never reach production by accident: boot fails unless the host opted in. */
  it("refuses production at construction unless allowed", () => {
    expect(
      () => new BundledResolvedPackSourceDriver(config({ environment: "production" })),
    ).toThrow(BundledPackSourceRefusedError);
    expect(
      () =>
        new BundledResolvedPackSourceDriver(
          config({ environment: "production", allowBundledInProduction: true }),
        ),
    ).not.toThrow();
    expect(
      () => new BundledResolvedPackSourceDriver(config({ environment: "staging" })),
    ).not.toThrow();
  });

  /** A host copies its pins from BUNDLED_PACK_HASHES, so it must list every live file and nothing else. */
  it("indexes exactly the live bundled packs under their content hash", async () => {
    const folder = new URL("../../../../assets/data/packs/", import.meta.url);
    const live: Record<string, string> = {};
    for (const name of readdirSync(folder).filter((file) => file.endsWith(".json"))) {
      const shipped: unknown = JSON.parse(readFileSync(new URL(name, folder), "utf8"));
      const market = name.slice(0, -".json".length);
      expect(Object.keys(BUNDLED_PACK_LOADERS)).toContain(market);
      // oxlint-disable-next-line no-await-in-loop -- reason: a handful of files, hashed in turn
      if ((shipped as MarketPack).status === PackStatus.Live)
        live[await contentHash(shipped)] = market;
    }

    expect(BUNDLED_PACK_HASHES).toEqual(live);
  });
});
