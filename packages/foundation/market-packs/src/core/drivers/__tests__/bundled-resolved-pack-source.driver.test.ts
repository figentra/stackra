/**
 * Stackra file contract:
 * Purpose: unit tests of `BundledResolvedPackSourceDriver`, the interim source: a pinned live pack is served and an
 *          unpinned file never read; a pin with no bundled pack, a pack whose content no longer hashes to its pin and a
 *          pinned draft are refused; production without `allowBundledInProduction` refuses at construction; and
 *          `BUNDLED_PACK_HASHES` lists exactly the live bundled files under their content hash. The driver itself, not
 *          only the `with` helper: a host that pins nothing is served an empty set, the load is kept once, the production
 *          warning is written once per load and never elsewhere, a failed load is not kept so the next call tries again,
 *          and every bundled loader answers a well-formed pack of its own market.
 * Boundary: test only; made-up packs (market `xa`) through `with`, the real `assets/data/packs/` files for the index
 *           check and the loaders, and a recording logger. No bundled pack is live yet, so a pin on the real index is
 *           always refused as not stored; serving a live pack is shown through `with`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0386 (as amended 2026-11-09); ADR 0385 (decision 7).
 */
import { readdirSync, readFileSync } from "node:fs";

import { buildConfig } from "@stackra/config";
import { Logger } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { MarketPacksConfig } from "#config/market-packs.config";
import { BUNDLED_PACK_HASHES } from "#core/constants/bundled-pack-hashes.constant";
import { BUNDLED_PACK_LOADERS } from "#core/constants/bundled-pack-loaders.constant";
import { MARKET_PACK_SCHEMA } from "#core/constants/market-pack-schema.constant";
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

/** A logger that records the warnings it is given. */
class RecordingLogger extends Logger {
  readonly warnings: { event: string; fields?: Readonly<Record<string, unknown>> }[] = [];

  debug(): void {}

  info(): void {}

  warn(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.warnings.push({ event, ...(fields === undefined ? {} : { fields }) });
  }

  error(): void {}
}

/** A hash no bundled pack is indexed under. */
const NOT_BUNDLED = "0".repeat(64);
const ALSO_NOT_BUNDLED = "f".repeat(64);

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

describe("BundledResolvedPackSourceDriver#packs", () => {
  it("serves an empty set to a host that pins nothing", async () => {
    const source = new BundledResolvedPackSourceDriver(
      config({ environment: "dev", packHashes: [] }),
    );
    expect(await source.packs()).toEqual([]);
  });

  it("keeps the load: one promise while it is in flight, then the same set", async () => {
    const source = new BundledResolvedPackSourceDriver(
      config({ environment: "dev", packHashes: [] }),
    );
    const loading = source.packs();
    expect(source.packs()).toBe(loading);
    expect(await source.packs()).toBe(await loading);
  });

  it("warns once, with the number of pins, that unsigned packs are served in production", async () => {
    const logger = new RecordingLogger();
    const source = new BundledResolvedPackSourceDriver(
      config({ environment: "production", allowBundledInProduction: true, packHashes: [] }),
      logger,
    );
    await source.packs();
    await source.packs();
    expect(logger.warnings).toEqual([
      { event: "market_packs.bundled_source_in_production", fields: { packHashes: 0 } },
    ]);
  });

  it("does not warn outside production", async () => {
    const logger = new RecordingLogger();
    for (const environment of ["dev", "staging"])
      // oxlint-disable-next-line no-await-in-loop -- reason: two environments, loaded in turn
      await new BundledResolvedPackSourceDriver(
        config({ environment, packHashes: [] }),
        logger,
      ).packs();
    expect(logger.warnings).toEqual([]);
  });

  it("loads in production with no logger bound", async () => {
    const source = new BundledResolvedPackSourceDriver(
      config({ environment: "production", allowBundledInProduction: true, packHashes: [] }),
    );
    expect(await source.packs()).toEqual([]);
  });

  it("refuses a pin the bundled index does not hold, naming the refusal", async () => {
    const source = new BundledResolvedPackSourceDriver(
      config({ environment: "dev", packHashes: [NOT_BUNDLED] }),
    );
    expect(await rejection(source.packs())).toBe(PackRejection.NotStored);
  });

  it("does not keep a failed load: the next call loads again, and warns again", async () => {
    const logger = new RecordingLogger();
    const source = new BundledResolvedPackSourceDriver(
      config({
        environment: "production",
        allowBundledInProduction: true,
        packHashes: [NOT_BUNDLED, ALSO_NOT_BUNDLED],
      }),
      logger,
    );
    const failed = source.packs();
    expect(await rejection(failed)).toBe(PackRejection.NotStored);
    const again = source.packs();
    expect(again).not.toBe(failed);
    expect(await rejection(again)).toBe(PackRejection.NotStored);
    expect(logger.warnings).toEqual([
      { event: "market_packs.bundled_source_in_production", fields: { packHashes: 2 } },
      { event: "market_packs.bundled_source_in_production", fields: { packHashes: 2 } },
    ]);
  });

  it("has a loader for every bundled market, each answering a well-formed pack of that market", async () => {
    for (const [market, load] of Object.entries(BUNDLED_PACK_LOADERS)) {
      // oxlint-disable-next-line no-await-in-loop -- reason: a handful of files, loaded in turn so a failure names its market
      const parsed = MARKET_PACK_SCHEMA.safeParse((await load()).default);
      expect(parsed.success, market).toBe(true);
      expect(parsed.data?.market, market).toBe(market);
    }
  });
});
