/**
 * Stackra file contract:
 * Purpose: `ReindexSearchAction`, `data_maintenance.index.reindex`: the job that runs `reindexSearch` of
 *          @stackra/search in the job's scope: it rebuilds the full-text index of one registered `@Searchable` model
 *          (every registered model when none is named), resuming a stopped run from its recorded cursor; with `since`,
 *          only rows updated since then; with `version`, a versioned rebuild into that index version and a swap.
 * Boundary: a job is an action run from a queue (`stackra search:reindex` queues it through `searchReindex`); the only
 *           actor is the system, so it gets no endpoint and no tool. It runs in the scope the job was queued with,
 *           under that scope's row-level security. One run per scope at a time (`unique`). A refused model name is
 *           `search_model_unknown`. Its permission is `IndexPermissions.reindex`, system-held.
 * Runtime: node
 * Governing contract: ADR 0404 (decision 3: the reindex plan runs as a job); ADR 0221 (decision 7); ADR 0305 (rule
 *                     28: the job surface); ADR 0148 (queue); ADR 0327 (decisions 6 and 9); ADR 0462 (decision 1);
 *                     stackra-303 (versioned rebuild).
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import type { Search } from "@stackra/search";
import { reindexSearch } from "@stackra/search/node";
import type { SearchIndexRegistry } from "@stackra/search/node";

import type { ReindexSearchInput } from "#node/schemas/reindex-search-input.schema";
import { ReindexSearchOutput } from "#node/schemas/reindex-search-output.schema";

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

  /** Reindexes the named model, or every registered one, in the job's scope. */
  async handle(input: ReindexSearchInput, ctx: ActionContext): Promise<ReindexSearchOutput> {
    const indexed = await reindexSearch(this.search, this.registry, ctx.scope, {
      ...(input.model === undefined ? {} : { model: input.model }),
      ...(input.since === undefined ? {} : { since: new Date(input.since) }),
      ...(input.version === undefined ? {} : { version: input.version }),
    });
    return ReindexSearchOutput.create({ indexed });
  }
}
