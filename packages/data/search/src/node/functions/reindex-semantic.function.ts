/**
 * Stackra file contract:
 * Purpose: `reindexSemantic(search, semantic, options)`, the vector passage backfill of one registered
 *          `@Searchable({ semantic: true })` model (every registered semantic model when none is named), batch by
 *          batch, through `SemanticChangeService.index`; with `since`, only rows updated since then. Answers the rows
 *          read.
 * Boundary: each batch is read by the full-text reindex, so the text documents are rebuilt with it, then embedded; the
 *           `ai: never` floor applies as on every change. It records nothing in `search.indexes`: a stopped backfill
 *           starts again (embeddings are idempotent by passage id). The semantic reindex job of
 *           @stackra/data-maintenance calls it; this package declares no job.
 * Runtime: node
 * Governing contract: ADR 0404 (decision 3); ADR 0221 (decisions 1 and 7); ADR 0380 (the `ai: never` floor); ADR 0327
 *                     (decisions 6 and 9); ADR 0462 (decision 1: jobs live in an add-on above iam).
 */
import { Searchable } from "@stackra/model";

import type { Search } from "#core/services/search.service";
import { searchableModelsOf } from "#node/functions/searchable-models-of.function";
import type { SemanticChangeService } from "#node/services/semantic-change.service";

/**
 * Embeds every semantic model's rows in turn.
 *
 * @throws SearchModelUnknownError when `options.model` names no registered model.
 * @example
 * const indexed = await reindexSemantic(search, semantic, { model: "CaseNote" });
 */
export async function reindexSemantic(
  search: Search,
  semantic: SemanticChangeService,
  options: { readonly model?: string; readonly since?: Date },
): Promise<number> {
  let indexed = 0;
  for (const model of searchableModelsOf(options.model)) {
    if (Searchable.on(model)?.semantic !== true) continue;
    indexed += await search.in(model).reindex({
      ...(options.since === undefined ? {} : { since: options.since }),
      onBatch: async (rows) => {
        await semantic.index(model, rows);
      },
    });
  }
  return indexed;
}
