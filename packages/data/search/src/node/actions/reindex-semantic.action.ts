/**
 * Stackra file contract:
 * Purpose: `ReindexSemanticAction`, `search.index.reindex_semantic`: the job that backfills the vector passages of one
 *          registered `@Searchable({ semantic: true })` model (every registered semantic model when none is named) in
 *          the job's scope, batch by batch, through `SemanticChangeService.index`; with `since`, only rows updated
 *          since then.
 * Boundary: a job queued by `stackra search:reindex --semantic`; the only actor is the system. Each batch is read by
 *           the full-text reindex, so the text documents are rebuilt with it, then embedded; the `ai: never` floor
 *           applies as on every change. It is its own action so that a service without an embedder never builds one
 *           for a plain reindex. It records nothing in `search.indexes`: a stopped backfill starts again (embeddings
 *           are idempotent by passage id).
 * Runtime: node
 * Governing contract: ADR 0404 (decision 3); ADR 0221 (decisions 1 and 7); ADR 0380 (the `ai: never` floor); ADR 0305
 *                     (rule 28); ADR 0327 (decisions 6 and 9).
 */
import { Action } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { Searchable } from "@stackra/model";

import type { Search } from "#core/services/search.service";
import { searchableModelsOf } from "#node/functions/searchable-models-of.function";
import type { ReindexSearchInput } from "#node/schemas/reindex-search-input.schema";
import { ReindexSearchOutput } from "#node/schemas/reindex-search-output.schema";
import type { SemanticChangeService } from "#node/services/semantic-change.service";

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

  /** Embeds every semantic model's rows in turn. */
  async handle(input: ReindexSearchInput): Promise<ReindexSearchOutput> {
    const since = input.since === undefined ? undefined : new Date(input.since);
    let indexed = 0;
    for (const model of searchableModelsOf(input.model)) {
      if (Searchable.on(model)?.semantic !== true) continue;
      indexed += await this.search.in(model).reindex({
        ...(since === undefined ? {} : { since }),
        onBatch: async (rows) => {
          await this.semantic.index(model, rows);
        },
      });
    }
    return ReindexSearchOutput.create({ indexed });
  }
}
