/**
 * Stackra file contract:
 * Purpose: `DatabaseSynonymSourceDriver`, the server's `SynonymSource`: the tenant's `Synonym` rows of an index and
 *          language, read on the running context.
 * Boundary: a read on the running context's entity manager, so it joins the caller's transaction and tenant session:
 *           the forced equality policy on `tenant_id` decides the rows, and no tenant filter is written here (ADR 0327
 *           decision 9). Sets come back oldest first so the expansion of a phrase is the same on every read.
 * Runtime: node
 * Governing contract: ADR 0492 (decision 5); ADR 0327 (decision 9); ADR 0239; ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import type { Database } from "@stackra/database";

import { SynonymSource } from "#contracts/ports/synonym-source.port";
import type { SynonymSet } from "#contracts/types/synonym-set.type";
import { Synonym } from "#node/models/synonym.model";

/**
 * Reads the tenant's synonym rows.
 *
 * @example
 * const sets = await database.withTenant(actor, () => source.setsOf(["products"], "ar"));
 */
export class DatabaseSynonymSourceDriver extends Driver(SynonymSource) {
  /** The connected database. */
  private readonly database: Database;

  /**
   * @param database - the connected database whose running context each read joins.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** The sets of `indexes` in `language`, or in every language when it is absent. */
  async setsOf(indexes: readonly string[], language?: string): Promise<readonly SynonymSet[]> {
    const rows = await this.database
      .em()
      .find(
        Synonym,
        { indexName: { $in: [...indexes] }, ...(language === undefined ? {} : { language }) },
        { orderBy: { createdAt: "asc", id: "asc" } },
      );
    return rows.map((row) => ({
      index: row.indexName,
      language: row.language,
      terms: [...row.terms],
    }));
  }
}
