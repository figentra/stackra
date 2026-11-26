/**
 * Stackra file contract:
 * Purpose: `BundledResolvedPackSourceDriver`, the interim `ResolvedPackSource` (driver name `bundled`): the packs this
 *          package bundles in `assets/data/packs/`, but only those the deployment pins by content hash in
 *          `MarketPacksConfig.packHashes` and only when `live`, loaded once (the pinned markets' files only, all on the
 *          first `packs()`) and served for the life of the process.
 * Boundary: the pin replaces the signature until the platform release service signs packs (ADR 0386 as amended
 *           2026-11-09): a pinned hash is looked up in `BUNDLED_PACK_HASHES`, its market's file loaded lazily,
 *           re-hashed as shipped with `contentHash` (as `verifyPack` does), parsed with `MarketPack$` and checked
 *           `live`; an unpinned file is never read. A pin
 *           with no bundled pack is `not_stored`, a file whose content no longer hashes to its pin `hash_mismatch`,
 *           a pinned draft `not_live` (each `PackRejectedError`, not kept, so the next call tries again). In
 *           production it refuses at construction unless `allowBundledInProduction` is set, and warns once, on first
 *           use, when it is.
 * Runtime: isomorphic
 * Governing contract: ADR 0386 (as amended 2026-11-09: the interim bundled source); ADR 0418; ADR 0385 (decision 7:
 *                     drafts are for authoring only); ADR 0370 (decision 2).
 */
import { Driver } from "@stackra/container";
import type { Logger } from "@stackra/contracts";

import type { MarketPacksConfig } from "#config/market-packs.config";
import { BUNDLED_PACK_HASHES } from "#core/constants/bundled-pack-hashes.constant";
import { BUNDLED_PACK_LOADERS } from "#core/constants/bundled-pack-loaders.constant";
import { MARKET_PACK_SCHEMA } from "#core/constants/market-pack-schema.constant";
import { PackEnvironment } from "#core/enums/pack-environment.enum";
import { PackRejection } from "#core/enums/pack-rejection.enum";
import { PackStatus } from "#core/enums/pack-status.enum";
import { BundledPackSourceRefusedError } from "#core/errors/bundled-pack-source-refused.error";
import { PackRejectedError } from "#core/errors/pack-rejected.error";
import { contentHash } from "#core/functions/content-hash.function";
import { packLabel } from "#core/functions/pack-label.function";
import { ResolvedPackSource } from "#core/ports/resolved-pack-source.port";
import type { BundledPacks } from "#core/types/bundled-packs.type";
import type { MarketPack } from "#core/types/market-pack.type";

/**
 * Serves the pinned, live packs this package bundles.
 *
 * @example
 * // a host's src/config/market-packs.config.ts, interim (ADR 0386 as amended 2026-11-09)
 * export class MarketPacksConfig extends BaseMarketPacksConfig {
 *   override source = "bundled" as const;
 *   override packHashes = ["9f2c…"]; // copied from BUNDLED_PACK_HASHES
 * }
 */
export class BundledResolvedPackSourceDriver extends Driver(ResolvedPackSource) {
  /** The pins, the index and the loaders. */
  private readonly bundled: BundledPacks;

  /** Where the production warning goes, when the host binds a logger. */
  private readonly logger: Logger | undefined;

  /** The load in flight or done. */
  private loading: Promise<readonly MarketPack[]> | undefined;

  /**
   * @param config - the deployment's pins, environment and production switch.
   * @param logger - the host's logger, for the one production warning.
   * @throws BundledPackSourceRefusedError in production without `allowBundledInProduction`.
   */
  constructor(config: MarketPacksConfig, logger?: Logger) {
    super();
    this.logger = logger;
    this.bundled = BundledResolvedPackSourceDriver.checked({
      config,
      index: BUNDLED_PACK_HASHES,
      loaders: BUNDLED_PACK_LOADERS,
    });
  }

  /**
   * A source over other bundled packs, for tests and tools.
   *
   * @throws BundledPackSourceRefusedError in production without `allowBundledInProduction`.
   */
  static with(bundled: BundledPacks): ResolvedPackSource {
    const checked = BundledResolvedPackSourceDriver.checked(bundled);
    return new (class extends ResolvedPackSource {
      /** The same load as the driver's. */
      private loading: Promise<readonly MarketPack[]> | undefined;

      /** The pinned, live packs. */
      packs(): Promise<readonly MarketPack[]> {
        this.loading ??= BundledResolvedPackSourceDriver.load(checked);
        return this.loading;
      }
    })();
  }

  /** `bundled`, unless it would serve unsigned packs in production without the switch. */
  private static checked(bundled: BundledPacks): BundledPacks {
    const { environment, allowBundledInProduction } = bundled.config;
    if (environment === PackEnvironment.Production && !allowBundledInProduction)
      throw BundledPackSourceRefusedError.create({ environment });
    return bundled;
  }

  /** Each pinned hash's pack: indexed, loaded, well-formed, hashing to its pin and live. */
  private static async load(bundled: BundledPacks): Promise<readonly MarketPack[]> {
    const packs: MarketPack[] = [];
    for (const hash of bundled.config.packHashes) {
      const market = bundled.index[hash];
      const loader = market === undefined ? undefined : bundled.loaders[market];
      if (loader === undefined)
        throw PackRejectedError.create({ reason: PackRejection.NotStored, pack: hash });
      // oxlint-disable-next-line no-await-in-loop -- reason: one pinned pack at a time keeps the first refusal exact
      const shipped = (await loader()).default;
      const parsed = MARKET_PACK_SCHEMA.safeParse(shipped);
      if (!parsed.success)
        throw PackRejectedError.create({ reason: PackRejection.ShapeInvalid, pack: hash });
      const pack = parsed.data;
      // the pin covers the pack as shipped, before the schema fills any default (as verifyPack's hash does)
      // oxlint-disable-next-line no-await-in-loop -- reason: as above
      if ((await contentHash(shipped)) !== hash)
        throw PackRejectedError.create({
          reason: PackRejection.HashMismatch,
          pack: packLabel(pack),
        });
      if (pack.status !== PackStatus.Live)
        throw PackRejectedError.create({ reason: PackRejection.NotLive, pack: packLabel(pack) });
      packs.push(pack);
    }
    return Object.freeze(packs);
  }

  /** The pinned, live packs, loaded on first use; in production the first use also warns that they are unsigned. */
  packs(): Promise<readonly MarketPack[]> {
    if (this.loading !== undefined) return this.loading;
    if (this.bundled.config.environment === PackEnvironment.Production)
      this.logger?.warn("market_packs.bundled_source_in_production", {
        packHashes: this.bundled.config.packHashes.length,
      });
    const loading = BundledResolvedPackSourceDriver.load(this.bundled);
    this.loading = loading;
    loading.catch(() => {
      if (this.loading === loading) this.loading = undefined;
    });
    return loading;
  }
}
