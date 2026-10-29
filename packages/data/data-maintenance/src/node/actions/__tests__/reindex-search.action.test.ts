/**
 * Stackra file contract:
 * Purpose: unit tests of `ReindexSearchAction` and `ReindexSemanticAction`: system-only queued jobs, unique per scope,
 *          which hand the model, the parsed `since`, the index `version` and (for the full-text one) the job's scope to
 *          `reindexSearch` and `reindexSemantic` of @stackra/search and report the rows indexed.
 * Boundary: test only; the two functions are spied on, so no index or embedder runs; their own tests are
 *           @stackra/search's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0404 (decision 3); ADR 0221 (decision 7); ADR 0462 (decision 1).
 */
import type { ActionContext } from "@stackra/actions";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import type { Search } from "@stackra/search";
// oxlint-disable-next-line no-restricted-imports -- the namespace object is what vi.spyOn replaces a member of
import * as searchNode from "@stackra/search/node";
import type { SearchIndexRegistry, SemanticChangeService } from "@stackra/search/node";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ReindexSearchAction } from "#node/actions/reindex-search.action";
import { ReindexSemanticAction } from "#node/actions/reindex-semantic.action";
import { ReindexSearchInput } from "#node/schemas/reindex-search-input.schema";

// A spy on the namespace, not vi.mock: the generated setup's registrations load these jobs before the test file, so
// each action already holds the real module and a vi.mock factory would never reach it.
const reindexSearch = vi.spyOn(searchNode, "reindexSearch").mockResolvedValue(4);
const reindexSemantic = vi.spyOn(searchNode, "reindexSemantic").mockResolvedValue(2);

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

  it("hands a versioned rebuild its index version", async () => {
    const registry = {} as SearchIndexRegistry;
    await new ReindexSearchAction(search, registry).handle(
      ReindexSearchInput.create({ model: "Product", version: 2 }),
      { scope } as unknown as ActionContext,
    );
    expect(reindexSearch).toHaveBeenLastCalledWith(search, registry, scope, {
      model: "Product",
      version: 2,
    });
  });

  it("reindexes every model when none is named, outside a scope", async () => {
    const registry = {} as SearchIndexRegistry;
    await new ReindexSearchAction(search, registry).handle(
      ReindexSearchInput.create({}),
      {} as unknown as ActionContext,
    );
    expect(reindexSearch).toHaveBeenLastCalledWith(search, registry, undefined, {});
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

  it("backfills the named model from the parsed since", async () => {
    const semantic = {} as SemanticChangeService;
    await new ReindexSemanticAction(search, semantic).handle(
      ReindexSearchInput.create({ model: "CaseNote", since: SINCE }),
    );
    expect(reindexSemantic).toHaveBeenLastCalledWith(search, semantic, {
      model: "CaseNote",
      since: new Date(SINCE),
    });
  });
});
