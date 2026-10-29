/**
 * Stackra file contract:
 * Purpose: `ReindexSemanticAction`, `data_maintenance.index.reindex_semantic`: the job that runs `reindexSemantic` of
 *          @stackra/search in the job's scope: it backfills the vector passages of one registered
 *          `@Searchable({ semantic: true })` model (every registered semantic model when none is named); with `since`,
 *          only rows updated since then.
 * Boundary: a job queued by `stackra search:reindex --semantic`; the only actor is the system. It is its own action so
 *           that a service without an embedder never builds one for a plain reindex. It records nothing in
 *           `search.indexes`: a stopped backfill starts again (embeddings are idempotent by passage id). Its permission
 *           is `IndexPermissions.reindexSemantic`, system-held.
 * Runtime: node
 * Governing contract: ADR 0404 (decision 3); ADR 0221 (decisions 1 and 7); ADR 0380 (the `ai: never` floor); ADR 0305
 *                     (rule 28); ADR 0327 (decisions 6 and 9); ADR 0462 (decision 1).
 */
import { Action } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import type { Search } from "@stackra/search";
import { reindexSemantic } from "@stackra/search/node";
import type { SemanticChangeService } from "@stackra/search/node";

import type { ReindexSearchInput } from "#node/schemas/reindex-search-input.schema";
import { ReindexSearchOutput } from "#node/schemas/reindex-search-output.schema";

/**
 * Backfills semantic passages as a job.
 *
 * @example
 * await queue.push(ReindexSemanticAction, { model: "CaseNote" }, { scope });
 */
export class ReindexSemanticAction extends Action({
  key: "index.reindex_semantic",
  actors: [ActorKind.System],
  job: { unique: true, timeout: "2h", retries: 5 },
}) {
  /** Reaches each model's index. */
  private readonly search: Search;

  /** Embeds and stores passages. */
  private readonly semantic: SemanticChangeService;

  /**
   * @param search - the search service whose rows are read in batches.
   * @param semantic - the service that embeds each batch.
   */
  constructor(search: Search, semantic: SemanticChangeService) {
    super();
    this.search = search;
    this.semantic = semantic;
  }

  /** Embeds the named semantic model's rows, or every semantic model's. */
  async handle(input: ReindexSearchInput): Promise<ReindexSearchOutput> {
    const indexed = await reindexSemantic(this.search, this.semantic, {
      ...(input.model === undefined ? {} : { model: input.model }),
      ...(input.since === undefined ? {} : { since: new Date(input.since) }),
    });
    return ReindexSearchOutput.create({ indexed });
  }
}
