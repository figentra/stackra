/**
 * Stackra file contract:
 * Purpose: `MemoryCatalogueVersionsDriver`, a `CatalogueVersions` over versions held in memory, for tests and local
 *          runs.
 * Boundary: process-local and unsynchronised; never a production store. It starts empty.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 2); ADR 0263 (a driver is named by its class: `memory`).
 */
import { Driver } from "@stackra/container";

import { CatalogueVersions } from "#contracts/ports/catalogue-versions.port";
import type { CatalogueVersion } from "#contracts/types/catalogue-version.type";

/**
 * Catalogue versions in memory.
 *
 * @example
 * const store = new MemoryCatalogueVersionsDriver();
 * await store.save(version);
 */
export class MemoryCatalogueVersionsDriver extends Driver(CatalogueVersions) {
  /** Record key to its versions by number. */
  private readonly records = new Map<string, Map<number, CatalogueVersion>>();

  /** Every version of `key`, lowest first. */
  list(key: string): Promise<readonly CatalogueVersion[]> {
    const versions = [...(this.records.get(key)?.values() ?? [])];
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    return Promise.resolve(versions.sort((a, b) => a.version - b.version));
  }

  /** Stores `version`, replacing any with the same key and number. */
  save(version: CatalogueVersion): Promise<void> {
    const versions = this.records.get(version.key) ?? new Map<number, CatalogueVersion>();
    versions.set(version.version, Object.freeze({ ...version }));
    this.records.set(version.key, versions);
    return Promise.resolve();
  }
}
