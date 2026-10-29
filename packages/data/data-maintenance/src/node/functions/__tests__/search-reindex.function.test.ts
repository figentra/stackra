/**
 * Stackra file contract:
 * Purpose: unit tests of `searchReindex`: the connection string is `directDatabaseUrl()` of @stackra/database/node,
 *          so it refuses before connecting when neither `DATABASE_DIRECT_URL` nor `DATABASE_URL` is set (STA-1409);
 *          it queues the full-text or the semantic reindex job with only the options given, in the scope when one is
 *          named, and closes the connection even when the push fails.
 * Boundary: test only; no database: `PostgresDatabaseDriver.connect` and `QueueService#push` are spied on.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0473 (decision 3: the direct URL).
 */
import type { PublicId } from "@stackra/contracts";
import { PostgresDatabaseDriver } from "@stackra/database/node";
import { QueueService } from "@stackra/queue";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ReindexSearchAction } from "#node/actions/reindex-search.action";
import { ReindexSemanticAction } from "#node/actions/reindex-semantic.action";
import { searchReindex } from "#node/functions/search-reindex.function";

const SCOPE = { id: "scp_1" as PublicId<"scp">, path: "platform.shop" };

/** Stands in for the connection and the queue, and returns the spies. */
function connect(push: () => Promise<unknown> = async () => "job_1") {
  vi.stubEnv("DATABASE_DIRECT_URL", "postgres://localhost/test");
  const close = vi.fn(async () => {});
  vi.spyOn(PostgresDatabaseDriver, "connect").mockResolvedValue({
    close,
  } as unknown as PostgresDatabaseDriver);
  return {
    close,
    push: vi.spyOn(QueueService.prototype, "push").mockImplementation(push as never),
  };
}

describe("searchReindex", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("refuses when neither direct nor pooled URL is set", async () => {
    vi.stubEnv("DATABASE_DIRECT_URL", "");
    vi.stubEnv("DATABASE_URL", "");
    await expect(searchReindex({})).rejects.toThrow(
      "DATABASE_DIRECT_URL (or DATABASE_URL) is not set",
    );
  });

  it("queues the full-text reindex with no options, outside a scope, and closes the connection", async () => {
    const { close, push } = connect();
    expect(await searchReindex({})).toEqual({ job: "job_1" });
    expect(push).toHaveBeenCalledWith(ReindexSearchAction, {}, {});
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("queues the semantic reindex with every option given, in the named scope", async () => {
    const { push } = connect();
    await searchReindex({
      model: "CaseNote",
      scope: SCOPE,
      since: "2026-10-27T00:00:00Z",
      semantic: true,
      version: 2,
    });
    expect(push).toHaveBeenCalledWith(
      ReindexSemanticAction,
      { model: "CaseNote", since: "2026-10-27T00:00:00Z", version: 2 },
      { scope: SCOPE },
    );
  });

  it("queues the full-text reindex in the named scope, and closes the connection when the push fails", async () => {
    const { close, push } = connect(async () => {
      throw new Error("queue down");
    });
    await expect(searchReindex({ model: "Product", scope: SCOPE })).rejects.toThrow("queue down");
    expect(push).toHaveBeenCalledWith(ReindexSearchAction, { model: "Product" }, { scope: SCOPE });
    expect(close).toHaveBeenCalledTimes(1);
  });
});
