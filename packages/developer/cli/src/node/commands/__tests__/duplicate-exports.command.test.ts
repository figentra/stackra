/**
 * Stackra file contract:
 * Purpose: unit tests of `DuplicateExportsCommand` on the console: a duplicated name exits 1 with its row and the
 *          findings are the `--json` data; a stale allow-list entry is a warning that never fails the run.
 * Boundary: test only; the finders are replaced, so no source is read.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0506; STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DuplicateExportsCommand } from "#node/commands/duplicate-exports.command";
import { duplicateExportFindings } from "#node/duplicate-exports/functions/duplicate-export-findings.function";
import { staleAllowListEntries } from "#node/duplicate-exports/functions/stale-allow-list-entries.function";

vi.mock("#node/duplicate-exports/functions/duplicate-export-findings.function", () => ({
  duplicateExportFindings: vi.fn(),
}));
vi.mock("#node/duplicate-exports/functions/stale-allow-list-entries.function", () => ({
  staleAllowListEntries: vi.fn(),
}));

const finding = {
  dir: "packages/data/model",
  text: "Money is also declared in packages/commerce/money",
};

beforeEach(() => {
  vi.mocked(duplicateExportFindings).mockReset();
  vi.mocked(staleAllowListEntries).mockReset();
});

describe("DuplicateExportsCommand", () => {
  it("exits 1 on a duplicate, the findings as --json data", async () => {
    vi.mocked(duplicateExportFindings).mockReturnValue([finding]);
    vi.mocked(staleAllowListEntries).mockReturnValue([]);
    const result = await runCommandForTest(
      [DuplicateExportsCommand],
      ["duplicate-exports", "--json"],
    );
    expect(result.exitCode).toBe(1);
    expect(result.json).toEqual({ ok: false, data: [finding] });
  });

  it("warns about a stale ALLOWED entry and exits 0 without a duplicate", async () => {
    vi.mocked(duplicateExportFindings).mockReturnValue([]);
    vi.mocked(staleAllowListEntries).mockReturnValue(["ApprovalBinding"]);
    const result = await runCommandForTest([DuplicateExportsCommand], ["duplicate-exports"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("remove from ALLOWED: ApprovalBinding");
  });
});
