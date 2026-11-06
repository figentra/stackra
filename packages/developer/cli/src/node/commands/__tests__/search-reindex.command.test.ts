/**
 * Stackra file contract:
 * Purpose: unit tests of `SearchReindexCommand` on the console: it hands the model, the scope, the normalised instant
 *          and the semantic flag to the member's runner and says the queued job (or that one already waits), the job
 *          being the `--json` data; a half-given scope, a bad instant or an extra argument exits 2 and queues nothing.
 * Boundary: test only; a fake runner, so no database is touched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0404 (decision 3); ADR 0221 (decision 7); ADR 0506; STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SearchReindexCommand } from "#node/commands/search-reindex.command";
import { loadSearchRunner } from "#node/functions/load-search-runner.function";

vi.mock("#node/functions/load-search-runner.function", () => ({ loadSearchRunner: vi.fn() }));

const searchReindex = vi.fn();
const SCOPE = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w2", path: "platform.acme" };

beforeEach(() => {
  searchReindex.mockReset();
  vi.mocked(loadSearchRunner).mockReset();
  vi.mocked(loadSearchRunner).mockResolvedValue({ searchReindex, searchStatus: vi.fn() });
});

describe("SearchReindexCommand", () => {
  it("queues a scoped, partial, semantic reindex through the member's runner", async () => {
    searchReindex.mockResolvedValue({ job: "job_1" });
    const argv = ["search:reindex", "Product", "--scope-id", SCOPE.id, "--scope-path", SCOPE.path];
    const result = await runCommandForTest(
      [SearchReindexCommand],
      [...argv, "--since", "2026-10-27T00:00:00Z", "--semantic"],
      { cwd: "/m" },
    );
    expect(result.exitCode).toBe(0);
    expect(loadSearchRunner).toHaveBeenCalledWith("/m");
    expect(searchReindex).toHaveBeenCalledWith({
      model: "Product",
      scope: SCOPE,
      since: "2026-10-27T00:00:00.000Z",
      semantic: true,
    });
    expect(result.stdout).toContain("search:reindex Product in platform.acme: queued job_1");
    const json = await runCommandForTest([SearchReindexCommand], [...argv, "--json"]);
    expect(json.json).toEqual({ ok: true, data: { model: "Product", scope: SCOPE, job: "job_1" } });
  });

  it("queues a platform-wide reindex of every model, and says when one already waits", async () => {
    searchReindex.mockResolvedValue({ job: undefined });
    const result = await runCommandForTest([SearchReindexCommand], ["search:reindex"]);
    expect(result.exitCode).toBe(0);
    expect(searchReindex).toHaveBeenCalledWith({});
    expect(result.stdout).toContain(
      "every model in the platform: a reindex of this scope already waits",
    );
  });

  it("refuses a half-given scope, a bad instant and an extra argument with exit 2", async () => {
    for (const argv of [
      ["search:reindex", "--scope-id", SCOPE.id],
      ["search:reindex", "--since", "yesterday"],
      ["search:reindex", "A", "B"],
    ])
      expect((await runCommandForTest([SearchReindexCommand], argv)).exitCode).toBe(2);
    expect(searchReindex).not.toHaveBeenCalled();
  });
});
