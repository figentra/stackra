/**
 * Stackra file contract:
 * Purpose: unit tests of `SearchStatusCommand` on the console: it draws each index with its scope, state, count,
 *          cursor and rebuild time, returns the indexes under `--json`, and refuses an argument with exit 2.
 * Boundary: test only; a fake runner, so no database is touched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0404 (decision 3); ADR 0221 (decision 7); ADR 0506; STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SearchStatusCommand } from "#node/commands/search-status.command";
import { loadSearchRunner } from "#node/functions/load-search-runner.function";

vi.mock("#node/functions/load-search-runner.function", () => ({ loadSearchRunner: vi.fn() }));

const searchStatus = vi.fn();
const INDEXES = [
  {
    model: "Product",
    scope: { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w2", path: "platform.acme" },
    state: "rebuilding",
    docCount: 500,
    cursor: "prd_500",
  },
  { model: "Customer", state: "valid", docCount: 12, rebuiltAt: new Date(Date.UTC(2026, 9, 28)) },
];

beforeEach(() => {
  searchStatus.mockReset();
  searchStatus.mockResolvedValue(INDEXES);
  vi.mocked(loadSearchRunner).mockReset();
  vi.mocked(loadSearchRunner).mockResolvedValue({ searchReindex: vi.fn(), searchStatus });
});

describe("SearchStatusCommand", () => {
  it("draws each index's scope, state, count, cursor and rebuild time", async () => {
    const result = await runCommandForTest([SearchStatusCommand], ["search:status"], {
      columns: 160,
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("search:status: 2 indexes");
    for (const cell of ["Product", "platform.acme", "rebuilding", "500", "prd_500"])
      expect(result.stdout).toContain(cell);
    for (const cell of ["Customer", "platform", "valid", "12", "2026-10-28T00:00:00.000Z"])
      expect(result.stdout).toContain(cell);
  });

  it("returns the indexes under --json", async () => {
    const result = await runCommandForTest([SearchStatusCommand], ["search:status", "--json"]);
    expect(result.json).toEqual({
      ok: true,
      // the rebuild time is written as its ISO string
      data: {
        indexes: [INDEXES[0], { ...INDEXES[1], rebuiltAt: "2026-10-28T00:00:00.000Z" }],
      },
    });
  });

  it("refuses an argument with exit 2", async () => {
    const result = await runCommandForTest([SearchStatusCommand], ["search:status", "Product"]);
    expect(result.exitCode).toBe(2);
    expect(searchStatus).not.toHaveBeenCalled();
  });
});
