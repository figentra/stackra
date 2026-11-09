/**
 * Stackra file contract:
 * Purpose: unit tests of `CatalogueCompletenessCommand` on the console: a catalogue finding exits 1 with the findings
 *          as `--json` data; none exits 0.
 * Boundary: test only; the repository context and the catalogue check are replaced, so no file is read.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0506; STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { catalogueFindings } from "@stackra/repo-checks/node";

import { CatalogueCompletenessCommand } from "#node/commands/catalogue-completeness.command";

vi.mock("@stackra/repo-checks/node", () => ({
  catalogueFindings: vi.fn(),
  readRepoContext: () => ({ files: [] }),
}));

const finding = { rule: "catalogues", dir: "apps/console", text: "ar-SA lacks orders::title" };

describe("CatalogueCompletenessCommand", () => {
  it("exits 1 on a finding, the findings as --json data, and 0 on none", async () => {
    vi.mocked(catalogueFindings).mockReturnValue([finding]);
    const failed = await runCommandForTest(
      [CatalogueCompletenessCommand],
      ["catalogue-completeness", "--json"],
    );
    expect(failed.exitCode).toBe(1);
    expect(failed.json).toEqual({ ok: false, data: [finding] });
    vi.mocked(catalogueFindings).mockReturnValue([]);
    const clean = await runCommandForTest(
      [CatalogueCompletenessCommand],
      ["catalogue-completeness"],
    );
    expect(clean.exitCode).toBe(0);
  });
});
