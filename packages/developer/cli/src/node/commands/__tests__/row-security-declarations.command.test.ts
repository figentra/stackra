/**
 * Stackra file contract:
 * Purpose: unit tests of `RowSecurityDeclarationsCommand` on the console: it lists each declaration with its reason,
 *          exits 0 when every one is reviewed and 1 on a finding, and its `--json` data holds the declarations and the
 *          findings.
 * Boundary: test only; the scan and the findings are replaced, so no source is read.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0506; ADR 0239 (2026-11-07 amendment, group (c) table).
 */
import { runCommandForTest } from "@stackra/console/testing";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RowSecurityDeclarationsCommand } from "#node/commands/row-security-declarations.command";
import { rowSecurityDeclarationFindings } from "#node/row-security-declarations/functions/row-security-declaration-findings.function";
import { rowSecurityDeclarations } from "#node/row-security-declarations/functions/row-security-declarations.function";

vi.mock("#node/row-security-declarations/functions/row-security-declarations.function", () => ({
  rowSecurityDeclarations: vi.fn(),
}));
vi.mock(
  "#node/row-security-declarations/functions/row-security-declaration-findings.function",
  () => ({ rowSecurityDeclarationFindings: vi.fn() }),
);

const declaration = {
  file: "packages/runtime/relay/src/node/database/migrations/0003-declare-tables.migration.ts",
  table: "cursors",
  kind: "platformTable" as const,
  reason: "one row per consumer class",
  policies: [],
  columns: [],
};

const finding = { dir: declaration.file, text: "t.platformTable on cursors is not in the list" };

beforeEach(() => {
  vi.mocked(rowSecurityDeclarations).mockReset().mockReturnValue([declaration]);
  vi.mocked(rowSecurityDeclarationFindings).mockReset();
});

describe("RowSecurityDeclarationsCommand", () => {
  it("lists each declaration with its reason and exits 0 when all are reviewed", async () => {
    vi.mocked(rowSecurityDeclarationFindings).mockReturnValue([]);
    const result = await runCommandForTest(
      [RowSecurityDeclarationsCommand],
      ["row-security-declarations"],
    );
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("one row per consumer class");
  });

  it("exits 1 on a finding, the declarations and findings as --json data", async () => {
    vi.mocked(rowSecurityDeclarationFindings).mockReturnValue([finding]);
    const result = await runCommandForTest(
      [RowSecurityDeclarationsCommand],
      ["row-security-declarations", "--json"],
    );
    expect(result.exitCode).toBe(1);
    expect(result.json).toEqual({
      ok: false,
      data: { declarations: [declaration], findings: [finding] },
    });
  });
});
