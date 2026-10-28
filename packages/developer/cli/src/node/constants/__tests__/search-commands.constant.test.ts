/**
 * Stackra file contract:
 * Purpose: unit tests of `SEARCH_REINDEX_COMMAND` and `SEARCH_STATUS_COMMAND`: reindex hands the model, the scope, the
 *          normalised instant and the semantic flag to the member's runner and prints the queued job (or that one
 *          already waits); a half-given scope, a bad instant or an extra argument is a usage error; status prints each
 *          index with its state, count, cursor and rebuild time.
 * Boundary: test only; a fake runner, so no database is touched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0404 (decision 3); ADR 0221 (decision 7).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SEARCH_REINDEX_COMMAND } from "#node/constants/search-reindex-command.constant";
import { SEARCH_STATUS_COMMAND } from "#node/constants/search-status-command.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import { loadSearchRunner } from "#node/functions/load-search-runner.function";
import type { CliCommand } from "#node/types/cli-command.type";
import type { CliContext } from "#node/types/cli-context.type";

vi.mock("#node/functions/load-search-runner.function", () => ({ loadSearchRunner: vi.fn() }));

const searchReindex = vi.fn();
const searchStatus = vi.fn();
const NODE = {
  "scope-id": "scp_01j9z3k4m5n6p7q8r9s0t1v2w2",
  "scope-path": "platform.acme",
};

beforeEach(() => {
  searchReindex.mockReset();
  searchStatus.mockReset();
  vi.mocked(loadSearchRunner).mockReset();
  vi.mocked(loadSearchRunner).mockResolvedValue({ searchReindex, searchStatus });
});

const run = (
  command: CliCommand,
  positionals: readonly string[],
  values: CliContext["values"] = {},
) => {
  const { io, output } = captureIo();
  const code = command.run({ cwd: "/m", io, values, positionals, rest: [], cli: async () => 0 });
  return { code, output };
};

describe("search commands", () => {
  it("queues a scoped, partial, semantic reindex through the member's runner", async () => {
    searchReindex.mockResolvedValue({ job: "job_1" });
    const { code, output } = run(SEARCH_REINDEX_COMMAND, ["Product"], {
      ...NODE,
      since: "2026-10-27T00:00:00Z",
      semantic: true,
    });
    expect(await code).toBe(0);
    expect(searchReindex).toHaveBeenCalledWith({
      model: "Product",
      scope: { id: NODE["scope-id"], path: NODE["scope-path"] },
      since: "2026-10-27T00:00:00.000Z",
      semantic: true,
    });
    expect(output()).toContain("search:reindex Product in platform.acme: queued job_1");
  });

  it("queues a platform-wide reindex of every model, and says when one already waits", async () => {
    searchReindex.mockResolvedValue({ job: undefined });
    const { code, output } = run(SEARCH_REINDEX_COMMAND, []);
    expect(await code).toBe(0);
    expect(searchReindex).toHaveBeenCalledWith({});
    expect(output()).toContain(
      "every model in the platform: a reindex of this scope already waits",
    );
  });

  it("refuses a half-given scope, a bad instant and an extra argument", async () => {
    await expect(
      run(SEARCH_REINDEX_COMMAND, [], { "scope-id": NODE["scope-id"] }).code,
    ).rejects.toThrow(CliUsageError);
    await expect(run(SEARCH_REINDEX_COMMAND, [], { since: "yesterday" }).code).rejects.toThrow(
      CliUsageError,
    );
    await expect(run(SEARCH_REINDEX_COMMAND, ["A", "B"]).code).rejects.toThrow(CliUsageError);
    expect(searchReindex).not.toHaveBeenCalled();
  });

  it("prints each index's state, count, cursor and rebuild time", async () => {
    searchStatus.mockResolvedValue([
      {
        model: "Product",
        scope: { id: NODE["scope-id"], path: "platform.acme" },
        state: "rebuilding",
        docCount: 500,
        cursor: "prd_500",
      },
      {
        model: "Customer",
        state: "valid",
        docCount: 12,
        rebuiltAt: new Date(Date.UTC(2026, 9, 28)),
      },
    ]);
    const { code, output } = run(SEARCH_STATUS_COMMAND, []);
    expect(await code).toBe(0);
    expect(output()).toContain("search:status: 2 indexes");
    expect(output()).toContain(
      "  Product platform.acme: rebuilding, 500 documents, resumes after prd_500",
    );
    expect(output()).toContain(
      "  Customer platform: valid, 12 documents, rebuilt 2026-10-28T00:00:00.000Z",
    );
  });
});
