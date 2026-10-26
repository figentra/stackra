/**
 * Stackra file contract:
 * Purpose: the `CatalogueVersions` port: the stored versions of the plan-catalogue admin records, read by record key
 *          and written one version at a time.
 * Boundary: an abstract class that is its own token. The OS billing service implements it over its tables; the memory
 *           driver serves tests and local runs. It stores and lists; `PlanCatalogueService` decides states and numbers
 *           under a lock per record key.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 2); ADR 0263.
 */
import { Port } from "@stackra/contracts";

import type { CatalogueVersion } from "#contracts/types/catalogue-version.type";

/**
 * Keeps catalogue versions.
 *
 * @example
 * const versions = await store.list("price-list:commerce");
 */
export abstract class CatalogueVersions extends Port {
  /**
   * Every version of `key`, lowest version first; empty when the record has none.
   *
   * @throws Error when the store cannot be reached.
   */
  abstract list(key: string): Promise<readonly CatalogueVersion[]>;

  /**
   * Stores `version`, replacing the stored one with the same key and number.
   *
   * @throws Error when the store cannot be reached.
   */
  abstract save(version: CatalogueVersion): Promise<void>;
}
