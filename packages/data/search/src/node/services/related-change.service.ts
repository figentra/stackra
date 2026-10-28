/**
 * Stackra file contract:
 * Purpose: `RelatedChangeService`, the outbox change consumer of every model a `@Searchable` facet's dotted path walks
 *          to (`Variant` for `variants.sku` on `Product`): a committed change of such a row re-indexes the parent rows
 *          that relate to it, so their documents never go stale.
 * Boundary: a `ChangeConsumer`, registered against each related model by `registerSearchableModels` and resolved by
 *           the relay, which calls it in the row's scope session. Parents are found through the ORM by the relation
 *           path (`{ variants: { $in: ids } }`), under row-level security, one query per relation and run, then
 *           indexed in one call. An update that writes none of the fields the parent reads is skipped. A deleted
 *           one-to-many child no longer joins to its parent, so that parent is refreshed only by its own next change
 *           or a reindex. Semantic passages of the parent are not re-embedded here.
 * Runtime: node
 * Governing contract: ADR 0221 (decision 5: indexing through the outbox); ADR 0078 (decision 4: idempotent consumers);
 *                     ADR 0327 (decision 9: isolation in the database); data-layer gap se4.
 */
import { Service } from "@stackra/container";
import type { Database } from "@stackra/database";
import type { ChangeConsumer, RowChange } from "@stackra/outbox/contracts";

import type { Search } from "#core/index";
import { SEARCH_RELATIONS } from "#node/constants/search-relations.constant";
import { changeTouches } from "#node/functions/change-touches.function";

/**
 * Keeps a parent's document current when a related row changes.
 *
 * @example
 * registerSearchableModels([Product]); // @Searchable({ text: ["title", "variants.sku"] })
 * // every committed Variant change now re-indexes the Products it belongs to
 */
export class RelatedChangeService extends Service implements ChangeConsumer {
  /** The search indexes. */
  private readonly search: Search;

  /** The connected database whose running context loads the parents. */
  private readonly database: Database;

  /**
   * @param search - the search reader, whose `in(model)` gives the parent's index.
   * @param database - the connected database.
   */
  constructor(search: Search, database: Database) {
    super();
    this.search = search;
    this.database = database;
  }

  /** Re-indexes the parents of one changed row. */
  async consume(change: RowChange): Promise<void> {
    await this.consumeMany([change]);
  }

  /** Re-indexes the parents of a run of one model's changes, one load and one index call per relation. */
  async consumeMany(changes: readonly RowChange[]): Promise<void> {
    for (const model of new Set(changes.map((change) => change.model)))
      for (const relation of SEARCH_RELATIONS.get(model) ?? []) {
        const ids = changes
          .filter((change) => change.model === model && changeTouches(change, relation.reads))
          .map((change) => change.id);
        if (ids.length === 0) continue;
        const where = relation.via.reduceRight<object>((inner, field) => ({ [field]: inner }), {
          $in: ids,
        });
        // reason: a relation path of a model named at run time, which MikroORM's filter types cannot follow
        const parents = await this.database.em().find(relation.parent, where as never);
        await this.search.in(relation.parent).index(parents);
      }
  }
}
