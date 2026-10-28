/**
 * Stackra file contract:
 * Purpose: unit tests of the reindex jobs: a full rebuild begins in the registry, resumes after a stopped run's cursor,
 *          records each batch and finishes with the total; `since` runs a partial reindex without touching the
 *          registry; no model name reindexes every registered one; an unknown name is `search_model_unknown`; the
 *          semantic job embeds each batch of semantic models only.
 * Boundary: test only; a stand-in `Search` whose index calls `onBatch` with fixed batches, a recording registry and a
 *           recording semantic service, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0404 (decision 3); ADR 0221 (decision 7).
 */
import type { ActionContext } from "@stackra/actions";
import { isRefusal } from "@stackra/errors";
import { Model, Searchable } from "@stackra/model";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { SearchModelUnknownError } from "#core/errors/search-model-unknown.error";
import type { Search } from "#core/services/search.service";
import type { SearchReindexOptions } from "#core/types/search-reindex-options.type";
import { ReindexSearchAction } from "#node/actions/reindex-search.action";
import { ReindexSemanticAction } from "#node/actions/reindex-semantic.action";
import { SEARCHABLE_MODELS } from "#node/constants/searchable-models.constant";
import { ReindexSearchInput } from "#node/schemas/reindex-search-input.schema";
import { searchFacetHashOf } from "#node/functions/search-facet-hash-of.function";
import type { SearchIndexRegistry } from "#node/services/search-index-registry.service";
import type { SemanticChangeService } from "#node/services/semantic-change.service";

@Searchable({ text: ["title"] })
class Product extends Model.with() {}

@Searchable({
  text: ["body"],
  semantic: true,
})
class CaseNote extends Model.with() {}

const scope = { id: "scp_1", path: "platform.acme" } as const;

const ctx = { scope } as unknown as ActionContext;

/** A search whose every index stores two batches of two rows, cursors `r2` and `r4`, recording its options. */
function searchOf() {
  const runs: { readonly model: string; readonly options: SearchReindexOptions<object> }[] = [];
  const search = {
    in: (model: { readonly name: string }) => ({
      reindex: async (options: SearchReindexOptions<object> = {}) => {
        runs.push({ model: model.name, options });
        await options.onBatch?.([{}, {}], "r2");
        await options.onBatch?.([{}, {}], "r4");
        return 4;
      },
    }),
  } as unknown as Search;
  return { search, runs };
}

/** A registry that answers `begun` and records every call. */
function registryOf(begun: { readonly cursor?: string; readonly docCount: number }) {
  const calls: unknown[][] = [];
  const registry = {
    begin: async (...args: unknown[]) => {
      calls.push(["begin", ...args]);
      return begun;
    },
    progress: async (...args: unknown[]) => {
      calls.push(["progress", ...args]);
    },
    finish: async (...args: unknown[]) => {
      calls.push(["finish", ...args]);
    },
  } as unknown as SearchIndexRegistry;
  return { registry, calls };
}

describe(ReindexSearchAction, () => {
  afterEach(() => {
    SEARCHABLE_MODELS.clear();
  });

  it("rebuilds a model, resuming after the stopped run's cursor and recording each batch", async () => {
    SEARCHABLE_MODELS.set("Product", Product);
    const { search, runs } = searchOf();
    const { registry, calls } = registryOf({ cursor: "r0", docCount: 10 });
    const output = await new ReindexSearchAction(search, registry).handle(
      ReindexSearchInput.create({ model: "Product" }),
      ctx,
    );
    expect(output.indexed).toBe(4);
    expect(runs[0]?.options.after).toBe("r0");
    expect(calls).toEqual([
      ["begin", "Product", scope, searchFacetHashOf({ text: ["title"] })],
      ["progress", "Product", scope, "r2", 12],
      ["progress", "Product", scope, "r4", 14],
      ["finish", "Product", scope, 14],
    ]);
  });

  it("runs a partial reindex since an instant without touching the registry", async () => {
    SEARCHABLE_MODELS.set("Product", Product);
    const { search, runs } = searchOf();
    const { registry, calls } = registryOf({ docCount: 0 });
    await new ReindexSearchAction(search, registry).handle(
      ReindexSearchInput.create({ since: "2026-10-27T00:00:00.000Z" }),
      ctx,
    );
    expect(runs[0]?.options.since).toEqual(new Date("2026-10-27T00:00:00.000Z"));
    expect(calls).toEqual([]);
  });

  it("reindexes every registered model when none is named, and refuses an unknown name", async () => {
    SEARCHABLE_MODELS.set("Product", Product);
    SEARCHABLE_MODELS.set("CaseNote", CaseNote);
    const { search, runs } = searchOf();
    const { registry } = registryOf({ docCount: 0 });
    const action = new ReindexSearchAction(search, registry);
    expect((await action.handle(ReindexSearchInput.create({}), ctx)).indexed).toBe(8);
    expect(runs.map((run) => run.model)).toEqual(["Product", "CaseNote"]);
    const refused = await action
      .handle(ReindexSearchInput.create({ model: "Prodct" }), ctx)
      .catch((error: unknown) => error);
    expect(isRefusal(refused, SearchModelUnknownError)).toBe(true);
  });
});

describe(ReindexSemanticAction, () => {
  afterEach(() => {
    SEARCHABLE_MODELS.clear();
  });

  it("embeds each batch of the semantic models only", async () => {
    SEARCHABLE_MODELS.set("Product", Product);
    SEARCHABLE_MODELS.set("CaseNote", CaseNote);
    const { search, runs } = searchOf();
    const embedded: unknown[] = [];
    const semantic = {
      index: async (model: unknown, rows: readonly object[]) => {
        embedded.push([model, rows.length]);
      },
    } as unknown as SemanticChangeService;
    const output = await new ReindexSemanticAction(search, semantic).handle(
      ReindexSearchInput.create({}),
    );
    expect(output.indexed).toBe(4);
    expect(runs.map((run) => run.model)).toEqual(["CaseNote"]);
    expect(embedded).toEqual([
      [CaseNote, 2],
      [CaseNote, 2],
    ]);
  });
});
