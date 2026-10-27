/**
 * Stackra file contract:
 * Purpose: `StoreResolvedPackSourceDriver`, the production `ResolvedPackSource` (driver name `store`): the content
 *          hashes the deployment names in `MarketPacksConfig`, fetched from the `PackStore` and verified against the
 *          configured trusted keys with `fetchPacks`, loaded once and served for the life of the process.
 * Boundary: the store is whatever `PackStore` driver the host binds (the filesystem driver over any disk). A load that
 *           fails (a hash not stored, a bad signature) rejects with `fetchPacks`' `PackRejectedError` and is not kept,
 *           so the next call tries again; a deployment with no hashes serves no packs. New pack versions reach a
 *           running process by a new deployment config, never by a reload here.
 * Runtime: isomorphic
 * Governing contract: ADR 0418; ADR 0385 (pack fetch by content hash); ADR 0370 (decision 2).
 */
import { Driver } from "@stackra/container";

import type { MarketPacksConfig } from "#config/market-packs.config";
import { fetchPacks } from "#core/functions/fetch-packs.function";
import type { PackStore } from "#core/ports/pack-store.port";
import { ResolvedPackSource } from "#core/ports/resolved-pack-source.port";
import type { MarketPack } from "#core/types/market-pack.type";

/**
 * Serves the deployment's packs from the pack store.
 *
 * @example
 * const source = new StoreResolvedPackSourceDriver(new FilesystemPackStoreDriver(files), config);
 * const packs = await source.packs();
 */
export class StoreResolvedPackSourceDriver extends Driver(ResolvedPackSource) {
  /** Where the signed packs are stored. */
  private readonly store: PackStore;

  /** The hashes and trusted keys. */
  private readonly config: MarketPacksConfig;

  /** The load in flight or done. */
  private loading: Promise<readonly MarketPack[]> | undefined;

  /**
   * @param store - the pack store.
   * @param config - the deployment's pack hashes and trusted keys.
   */
  constructor(store: PackStore, config: MarketPacksConfig) {
    super();
    this.store = store;
    this.config = config;
  }

  /** The verified packs, fetched on first use. */
  packs(): Promise<readonly MarketPack[]> {
    if (this.loading !== undefined) return this.loading;
    const loading = fetchPacks(this.store, this.config.packHashes, this.config.trustedKeys).then(
      (packs): readonly MarketPack[] => Object.freeze(packs),
    );
    this.loading = loading;
    loading.catch(() => {
      if (this.loading === loading) this.loading = undefined;
    });
    return loading;
  }
}
