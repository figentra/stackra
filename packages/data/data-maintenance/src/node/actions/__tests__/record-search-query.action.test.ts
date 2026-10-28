/**
 * Stackra file contract:
 * Purpose: unit tests of `RecordSearchQueryAction`: a system-only job that stores the entry in the job's scope, a
 *          withheld phrase as null, and writes nothing outside a scope.
 * Boundary: test only; a stand-in query log records each store.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0462 (decision 1); stackra-326.
 */
import type { ActionContext } from "@stackra/actions";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import type { PostgresSearchQueryLogDriver } from "@stackra/search/node";
import { describe, expect, it } from "@stackra/testing";

import { RecordSearchQueryAction } from "#node/actions/record-search-query.action";
import { RecordSearchQueryInput } from "#node/schemas/record-search-query-input.schema";

const SCOPE = { id: "scp_1" as PublicId<"scp">, path: "platform.shop" };

describe(RecordSearchQueryAction, () => {
  it("is a system-only queued job", () => {
    expect(kindOf(RecordSearchQueryAction)?.options).toMatchObject({
      key: "query.record",
      actors: [ActorKind.System],
      job: { timeout: "30s", retries: 3 },
    });
  });

  it("stores the entry in the job's scope, and nothing outside one", async () => {
    const stores: unknown[][] = [];
    const log = { store: async (...args: unknown[]) => void stores.push(args) };
    const action = new RecordSearchQueryAction(log as unknown as PostgresSearchQueryLogDriver);
    const input = RecordSearchQueryInput.create({ model: "Product", hits: 0, latencyMs: 3 });
    await action.handle(input, { scope: SCOPE } as unknown as ActionContext);
    await action.handle(input, {} as unknown as ActionContext);
    expect(stores).toEqual([[SCOPE, { model: "Product", phrase: null, hits: 0, latencyMs: 3 }]]);
  });
});
