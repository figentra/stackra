/**
 * Stackra file contract:
 * Purpose: `reindexSearch(search, registry, scope, options)`, the full-text rebuild of one registered `@Searchable`
 *          model (every registered model when none is named) in `scope`, in batches, recording each batch's cursor in
 *          `search.indexes` so a stopped run resumes where it stopped, and marking the index valid with its facet hash
 *          when it ends. With `since`, it indexes only rows updated since then (a partial reindex) and leaves the
 *          registry as it is. With `version`, it readies that index version (fresh runs only), rebuilds into it while reads
 *          stay on the live index (every write meanwhile reaches both), then swaps it live (ADR 0221 d7; on Postgres the
 *          swap is the contract migration). Answers the rows indexed.
 * Boundary: runs under the caller's scope session, so row-level security keeps one scope's run to its rows. The
 *           reindex job of @stackra/data-maintenance calls it; this package declares no job. A refused model name is
 *           `search_model_unknown`.
 * Runtime: node
 * Governing contract: ADR 0404 (decision 3: the reindex plan runs as a job); ADR 0221 (decision 7); ADR 0327
 *                     (decisions 6 and 9); ADR 0462 (decision 1: jobs live in an add-on above iam); stackra-303 (versioned
 *                     rebuild).
 */
import type { ScopeRef } from "@stackra/contracts";
import { Searchable } from "@stackra/model";

import type { Search } from "#core/services/search.service";
import { searchFacetHashOf } from "#node/functions/search-facet-hash-of.function";
import { searchableModelsOf } from "#node/functions/searchable-models-of.function";
import type { SearchIndexRegistry } from "#node/services/search-index-registry.service";

/**
 * Reindexes each model in turn, resuming a stopped full rebuild from its cursor.
 *
 * @throws SearchModelUnknownError when `options.model` names no registered model.
 * @example
 * const indexed = await reindexSearch(search, registry, scope, { model: "Product" });
 */
export async function reindexSearch(
  search: Search,
  registry: SearchIndexRegistry,
  scope: ScopeRef | undefined,
  options: { readonly model?: string; readonly since?: Date; readonly version?: number },
): Promise<number> {
  let indexed = 0;
  for (const model of searchableModelsOf(options.model)) {
    const index = search.in(model);
    if (options.since !== undefined) {
      indexed += await index.reindex({ since: options.since });
      continue;
    }
    const facet = Searchable.on(model);
    if (facet === undefined) continue;
    const { version } = options;
    const { cursor, docCount } = await registry.begin(
      model.name,
      scope,
      searchFacetHashOf(facet),
      version,
    );
    // A fresh versioned rebuild starts an empty shadow; a resumed one keeps what it already wrote.
    if (version !== undefined && cursor === undefined) await index.prepare(version);
    let done = docCount;
    const count = await index.reindex({
      ...(cursor === undefined ? {} : { after: cursor }),
      ...(version === undefined ? {} : { version }),
      onBatch: async (rows, next) => {
        done += rows.length;
        await registry.progress(model.name, scope, next, done);
      },
    });
    if (version !== undefined) await index.swap(version);
    await registry.finish(model.name, scope, done);
    indexed += count;
  }
  return indexed;
}
