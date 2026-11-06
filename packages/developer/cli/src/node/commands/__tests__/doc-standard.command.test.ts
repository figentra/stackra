/**
 * Stackra file contract:
 * Purpose: unit tests of `DocStandardCommand` on the console: a finding without a folder is a row named by its text and
 *          exits 1 with the findings as `--json` data; a clean tree prints the scoped file count and exits 0.
 * Boundary: test only; the repository context and the doc check are replaced, so no file is read.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0506; STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { docsFindings } from "@stackra/repo-checks/node";

import { DocStandardCommand } from "#node/commands/doc-standard.command";

vi.mock("@stackra/repo-checks/node", () => ({
  docsFindings: vi.fn(),
  isDocScoped: () => true,
  readRepoContext: () => ({ files: ["a.ts", "b.ts"] }),
}));

const finding = {
  rule: "doc-standard",
  dir: "",
  text: "src/a.ts: missing the Stackra file contract",
};

describe("DocStandardCommand", () => {
  it("exits 1 on a finding, drawn by its text, the findings as --json data", async () => {
    vi.mocked(docsFindings).mockReturnValue([finding]);
    const text = await runCommandForTest([DocStandardCommand], ["doc-standard"]);
    expect(text.exitCode).toBe(1);
    expect(text.stdout).toContain("src/a.ts: missing the Stackra file contract");
    const json = await runCommandForTest([DocStandardCommand], ["doc-standard", "--json"]);
    expect(json.json).toEqual({ ok: false, data: [finding] });
  });

  it("prints the clean line with the scoped file count", async () => {
    vi.mocked(docsFindings).mockReturnValue([]);
    const result = await runCommandForTest([DocStandardCommand], ["doc-standard"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("2 source file(s) clean");
  });
});
