/**
 * Stackra file contract:
 * Purpose: `ReindexSearchAction`, `search.index.reindex`: the job that rebuilds the full-text index of one registered
 *          `@Searchable` model (every registered model when none is named) in the job's scope, in batches, recording
 *          each batch's cursor in `search.indexes` so a stopped run resumes where it stopped, and marking the index
 *          valid with its facet hash when it ends. With `since`, it indexes only rows updated since then (a partial
 *          reindex) and leaves the registry as it is.
 * Boundary: a job is an action run from a queue (`stackra search:reindex` queues it); the only actor is the system, so
 *           it gets no endpoint and no tool. It runs in the scope the job was queued with, under that scope's
 *           row-level security, so one scope's run never indexes another's rows. One run per scope at a time
 *           (`unique`), so two models of one scope are reindexed by one run naming neither. A refused model name is
 *           `search_model_unknown`.
 * Runtime: node
 * Governing contract: ADR 0404 (decision 3: the reindex plan runs as a job); ADR 0221 (decision 7); ADR 0305 (rule
 *                     28: the job surface); ADR 0148 (queue); ADR 0327 (decisions 6 and 9).
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { Searchable } from "@stackra/model";

import type { Search } from "#core/services/search.service";
import { searchFacetHashOf } from "#node/functions/search-facet-hash-of.function";
import { searchableModelsOf } from "#node/functions/searchable-models-of.function";
import type { ReindexSearchInput } from "#node/schemas/reindex-search-input.schema";
import { ReindexSearchOutput } from "#node/schemas/reindex-search-output.schema";
import type { SearchIndexRegistry } from "#node/services/search-index-registry.service";

/**
 * Rebuilds search indexes as a job.
 *
 * @example
 * await queue.push(ReindexSearchAction, { model: "Product" }, { scope });
 */
export class ReindexSearchAction extends Action({
  key: "index.reindex",
  actors: [ActorKind.System],
  job: { unique: true, timeout: "1h", retries: 5 },
}) {
  /** Reaches each model's index. */
  private readonly search: Search;

  /** Records each run in `search.indexes`. */
  private readonly registry: SearchIndexRegistry;

  /**
   * @param search - the search service whose indexes are rebuilt.
   * @param registry - the index registry each run records its cursor in.
   */
  constructor(search: Search, registry: SearchIndexRegistry) {
    super();
    this.search = search;
    this.registry = registry;
  }

  /** Reindexes each model in turn, resuming a stopped full rebuild from its cursor. */
  async handle(input: ReindexSearchInput, ctx: ActionContext): Promise<ReindexSearchOutput> {
    const since = input.since === undefined ? undefined : new Date(input.since);
    let indexed = 0;
    for (const model of searchableModelsOf(input.model)) {
      const index = this.search.in(model);
      if (since !== undefined) {
        indexed += await index.reindex({ since });
        continue;
      }
      const facet = Searchable.on(model);
      if (facet === undefined) continue;
      const { cursor, docCount } = await this.registry.begin(
        model.name,
        ctx.scope,
        searchFacetHashOf(facet),
      );
      let done = docCount;
      const count = await index.reindex({
        ...(cursor === undefined ? {} : { after: cursor }),
        onBatch: async (rows, next) => {
          done += rows.length;
          await this.registry.progress(model.name, ctx.scope, next, done);
        },
      });
      await this.registry.finish(model.name, ctx.scope, done);
      indexed += count;
    }
    return ReindexSearchOutput.create({ indexed });
  }
}
