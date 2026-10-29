/**
 * Stackra file contract:
 * Purpose: unit tests of `QueuedSearchQueryLogDriver`: it is a `SearchQueryLog`, and `record` queues a
 *          `RecordSearchQueryAction` job in the entry's scope (none without one).
 * Boundary: test only; a stand-in queue records each push, so no database runs. `store`, `popular` and the reports are
 *           @stackra/search's and tested there.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0462 (decision 1); stackra-326.
 */
import type { PublicId } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import type { QueueService } from "@stackra/queue";
import { SearchQueryLog } from "@stackra/search/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RecordSearchQueryAction } from "#node/actions/record-search-query.action";
import { QueuedSearchQueryLogDriver } from "#node/drivers/queued-search-query-log.driver";

const SCOPE = { id: "scp_1" as PublicId<"scp">, path: "platform.shop" };

describe(QueuedSearchQueryLogDriver, () => {
  it("queues an entry as a job in its scope, and logs nothing without one", async () => {
    const pushes: unknown[][] = [];
    const queue = { push: async (...args: unknown[]) => void pushes.push(args) };
    const driver = new QueuedSearchQueryLogDriver({} as Database, queue as unknown as QueueService);
    expect(driver).toBeInstanceOf(SearchQueryLog);
    await driver.record({ model: "Product", phrase: null, hits: 0, latencyMs: 4, scope: SCOPE });
    await driver.record({ model: "Product", phrase: "linen" });
    expect(pushes).toEqual([
      [RecordSearchQueryAction, { model: "Product", hits: 0, latencyMs: 4 }, { scope: SCOPE }],
    ]);
  });

  it("queues a click with its phrase and clicked id, and no read counts", async () => {
    const pushes: unknown[][] = [];
    const queue = { push: async (...args: unknown[]) => void pushes.push(args) };
    await new QueuedSearchQueryLogDriver({} as Database, queue as unknown as QueueService).record({
      model: "Product",
      phrase: "linen",
      clicked: "prd_1",
      scope: SCOPE,
    });
    expect(pushes).toEqual([
      [
        RecordSearchQueryAction,
        { model: "Product", phrase: "linen", clicked: "prd_1" },
        { scope: SCOPE },
      ],
    ]);
  });
});
