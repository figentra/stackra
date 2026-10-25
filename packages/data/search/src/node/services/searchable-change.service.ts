/**
 * Stackra file contract:
 * Purpose: `SearchableChangeService`, the outbox change consumer of every registered `@Searchable` model: a committed
 *          change of a row re-indexes that row, and a deleted row, or one the scope session no longer sees, leaves the
 *          index.
 * Boundary: a `ChangeConsumer`, registered against each model by `registerSearchableModels` and resolved by the relay,
 *           which calls it at least once per change in the row's scope session. The change names the row without its
 *           values, so the row is loaded here, under row-level security; indexing and removing are idempotent, so a
 *           redelivery changes nothing. A change of a model nobody registered is ignored. A change of a related
 *           model that a dotted facet path reads (`variants.sku`) does not reach the parent's document.
 * Runtime: node
 * Governing contract: ADR 0221 (decision 5: indexing through the outbox, under five seconds of lag); ADR 0078
 *                     (decision 4: idempotent consumers); ADR 0327 (decision 9: isolation in the database).
 */
import { Service } from "@stackra/container";
import type { Database } from "@stackra/database";
import { RowChangeKind } from "@stackra/outbox/contracts";
import type { ChangeConsumer, RowChange } from "@stackra/outbox/contracts";

import type { Search } from "#core/index";
import { SEARCHABLE_MODELS } from "#node/constants/searchable-models.constant";

/**
 * Keeps a changed row's document current.
 *
 * @example
 * registerSearchableModels([Product]);
 * // every committed Product change now reaches consume(change)
 */
export class SearchableChangeService extends Service implements ChangeConsumer {
  /** The search indexes. */
  private readonly search: Search;

  /** The connected database whose running context loads the row. */
  private readonly database: Database;

  /**
   * @param search - the search reader, whose `in(model)` gives the index.
   * @param database - the connected database.
   */
  constructor(search: Search, database: Database) {
    super();
    this.search = search;
    this.database = database;
  }

  /** Indexes the changed row, or removes its document when the row is gone. */
  async consume(change: RowChange): Promise<void> {
    const model = SEARCHABLE_MODELS.get(change.model);
    if (model === undefined) return;
    const index = this.search.in(model);
    const row =
      change.kind === RowChangeKind.Deleted
        ? null
        : // reason: the serialised primary key of a model named at run time, which MikroORM's types cannot follow
          await this.database.em().findOne(model, change.id as never);
    await (row === null ? index.remove([change.id]) : index.index([row]));
  }
}
