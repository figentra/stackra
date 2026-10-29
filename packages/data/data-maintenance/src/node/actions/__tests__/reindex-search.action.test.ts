/**
 * Stackra file contract:
 * Purpose: unit tests of `ReindexSearchAction` and `ReindexSemanticAction`: system-only queued jobs, unique per scope,
 *          which hand the model, the parsed `since` and (for the full-text one) the job's scope to `reindexSearch` and
 *          `reindexSemantic` of @stackra/search and report the rows indexed.
 * Boundary: test only; the two functions are mocked, so no index or embedder runs; their own tests are
 *           @stackra/search's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0404 (decision 3); ADR 0221 (decision 7); ADR 0462 (decision 1).
 */
import type { ActionContext } from "@stackra/actions";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import type { Search } from "@stackra/search";
import { reindexSearch, reindexSemantic } from "@stackra/search/node";
import type { SearchIndexRegistry, SemanticChangeService } from "@stackra/search/node";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ReindexSearchAction } from "#node/actions/reindex-search.action";
import { ReindexSemanticAction } from "#node/actions/reindex-semantic.action";
import { ReindexSearchInput } from "#node/schemas/reindex-search-input.schema";

vi.mock("@stackra/search/node", () => ({
  reindexSearch: vi.fn(async () => 4),
  reindexSemantic: vi.fn(async () => 2),
}));

const scope = { id: "scp_1", path: "platform.acme" } as const;
const search = {} as Search;
const SINCE = "2026-10-27T00:00:00.000Z";

describe(ReindexSearchAction, () => {
  it("is a system-only queued job, unique per scope", () => {
    expect(kindOf(ReindexSearchAction)?.options).toMatchObject({
      key: "index.reindex",
      actors: [ActorKind.System],
      job: { unique: true, timeout: "1h", retries: 5 },
    });
  });

  it("reindexes in the job's scope", async () => {
    const registry = {} as SearchIndexRegistry;
    const output = await new ReindexSearchAction(search, registry).handle(
      ReindexSearchInput.create({ model: "Product", since: SINCE }),
      { scope } as unknown as ActionContext,
    );
    expect(output.indexed).toBe(4);
    expect(reindexSearch).toHaveBeenCalledWith(search, registry, scope, {
      model: "Product",
      since: new Date(SINCE),
    });
  });
});

describe(ReindexSemanticAction, () => {
  it("is a system-only queued job, unique per scope", () => {
    expect(kindOf(ReindexSemanticAction)?.options).toMatchObject({
      key: "index.reindex_semantic",
      actors: [ActorKind.System],
      job: { unique: true, timeout: "2h", retries: 5 },
    });
  });

  it("backfills every semantic model when none is named", async () => {
    const semantic = {} as SemanticChangeService;
    const output = await new ReindexSemanticAction(search, semantic).handle(
      ReindexSearchInput.create({}),
    );
    expect(output.indexed).toBe(2);
    expect(reindexSemantic).toHaveBeenCalledWith(search, semantic, {});
  });
});
