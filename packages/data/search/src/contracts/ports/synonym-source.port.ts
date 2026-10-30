/**
 * Stackra file contract:
 * Purpose: the `SynonymSource` port: the synonym sets a tenant keeps as data, which `Search` adds to a phrase's
 *          alternatives beside the `search.synonyms` setting.
 * Boundary: an abstract class that is its own token. `DatabaseSynonymSourceDriver` (`./node`) reads the tenant-owned
 *           `search.synonym` rows under row-level security, so a call sees its own tenant's sets only;
 *           `MemorySynonymSourceDriver` (`.`) is the test double. Reading never writes. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 5: the per-tenant synonym list); ADR 0327 (decision 9); ADR 0294 (decisions 15
 *                     and 16).
 */
import { Port } from "@stackra/contracts";

import type { SynonymSet } from "#contracts/types/synonym-set.type";

/**
 * Where a tenant's synonym sets are read from.
 *
 * @example
 * const sets = await source.setsOf(["products", "catalogue.products"], "ar");
 */
export abstract class SynonymSource extends Port {
  /**
   * The sets of `indexes` (the names an index answers to) in `language`, or in every language when it is absent.
   */
  abstract setsOf(indexes: readonly string[], language?: string): Promise<readonly SynonymSet[]>;
}
