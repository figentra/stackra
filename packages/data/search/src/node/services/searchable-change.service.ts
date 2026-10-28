/**
 * Stackra file contract:
 * Purpose: `SearchableChangeService`, the outbox change consumer of every registered `@Searchable` model: a committed
 *          change of a row re-indexes that row, and a deleted row, or one the scope session no longer sees, leaves the
 *          index.
 * Boundary: a `ChangeConsumer`, registered against each model by `registerSearchableModels` and resolved by the relay,
 *           which calls it at least once per change in the row's scope session. The change names the row without its
 *           values, so the row is loaded here, under row-level security; indexing and removing are idempotent, so a
 *           redelivery changes nothing. A change of a model nobody registered is ignored. A run of changes
 *           (`consumeMany`) loads its rows in one `$in` query and indexes them in one call; an update that writes
 *           none of the fields the facet reads, nor a field deciding the row's presence, is skipped. A change of a
 *           related model that a dotted facet path reads (`variants.sku`) reaches the parent through
 *           `RelatedChangeService`.
 * Runtime: node
 * Governing contract: ADR 0221 (decision 5: indexing through the outbox, under five seconds of lag); ADR 0078
 *                     (decision 4: idempotent consumers); ADR 0327 (decision 9: isolation in the database); data-layer
 *                     gap se3 (batches and skipped changes).
 */
import { Service } from "@stackra/container";
import type { Database } from "@stackra/database";
import { Searchable } from "@stackra/model";
import { RowChangeKind } from "@stackra/outbox/contracts";
import type { ChangeConsumer, RowChange } from "@stackra/outbox/contracts";

import type { Search } from "#core/index";
import { SEARCHABLE_MODELS } from "#node/constants/searchable-models.constant";
import { changeTouches } from "#node/functions/change-touches.function";

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
    await this.consumeMany([change]);
  }

  /** Indexes a run of changed rows with one load and one index call, and removes the documents of rows gone. */
  async consumeMany(changes: readonly RowChange[]): Promise<void> {
    for (const name of new Set(changes.map((change) => change.model))) {
      const model = SEARCHABLE_MODELS.get(name);
      const facet = model === undefined ? undefined : Searchable.on(model);
      if (model === undefined || facet === undefined) continue;
      const read = new Set(
        [...facet.text, ...(facet.filters ?? [])].map((path) => path.split(".")[0] ?? ""),
      );
      const touched = changes.filter(
        (change) => change.model === name && changeTouches(change, read),
      );
      const live = touched
        .filter((change) => change.kind !== RowChangeKind.Deleted)
        .map((change) => change.id);
      const em = this.database.em();
      const key = em.getMetadata(model).primaryKeys[0] ?? "id";
      const rows =
        live.length === 0
          ? []
          : // reason: the serialised primary keys of a model named at run time, which MikroORM's types cannot follow
            await em.find(model, { [key]: { $in: live } } as never);
      const found = new Set(
        rows.map((row) => String((row as Readonly<Record<string, unknown>>)[key])),
      );
      const gone = touched.map((change) => change.id).filter((id) => !found.has(id));
      const index = this.search.in(model);
      if (gone.length > 0) await index.remove(gone);
      if (rows.length > 0) await index.index(rows);
    }
  }
}
