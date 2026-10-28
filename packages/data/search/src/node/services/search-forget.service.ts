/**
 * Stackra file contract:
 * Purpose: `SearchForgetService`, removes named rows of a model from search at once: their documents from the search
 *          index and, for a `@Searchable({ semantic: true })` model, every passage (every chunk) from the vector index. The search
 *          side of an erasure (gap gov6, stackra-275): @stackra/privacy hands it the rows of an erased subject that
 *          are still in the table (shredded or held), whose indexed copies would otherwise stay searchable in clear.
 * Boundary: a service over `Search` and the `VectorIndex` port, in the caller's transaction and scope session. A model
 *           that is not a registered `@Searchable` model is ignored, so a caller can pass every model it knows.
 *           Removing is idempotent. A row's next committed change indexes it again from what the table then holds
 *           (a shredded field loads as null), so nothing it forgot comes back.
 * Runtime: node
 * Governing contract: ADR 0221 (decision 7: erasure removes documents); ADR 0189 (decision 2: erasure reaches every
 *                     copy); ADR 0160 (pgvector); data-layer gap gov6;
 *                     stackra-301 (chunked passages).
 */
import { Service } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { Searchable } from "@stackra/model";

import type { VectorIndex } from "#contracts/index";
import type { Search } from "#core/index";
import { SEARCHABLE_MODELS } from "#node/constants/searchable-models.constant";
import { passageIdsOf } from "#node/functions/passage-ids-of.function";

/**
 * Forgets rows in every index.
 *
 * @example
 * await forget.forget(Customer, ["cus_1", "cus_2"]);
 */
export class SearchForgetService extends Service {
  /** The search indexes. */
  private readonly search: Search;

  /** The vector index semantic passages live in. */
  private readonly vectors: VectorIndex;

  /**
   * @param search - the search reader, whose `in(model)` gives the index.
   * @param vectors - the vector index of semantic passages.
   */
  constructor(search: Search, vectors: VectorIndex) {
    super();
    this.search = search;
    this.vectors = vectors;
  }

  /** Removes the documents, and the passages of a semantic model, of rows `ids` of `model`. */
  async forget(model: AnyClass, ids: readonly string[]): Promise<void> {
    if (ids.length === 0 || SEARCHABLE_MODELS.get(model.name) !== model) return;
    await this.search.in(model).remove(ids);
    if (Searchable.on(model)?.semantic === true)
      await this.vectors.remove(ids.flatMap((id) => passageIdsOf(model, id)));
  }
}
