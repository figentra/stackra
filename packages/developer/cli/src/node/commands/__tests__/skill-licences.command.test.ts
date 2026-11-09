/**
 * Stackra file contract:
 * Purpose: unit tests of `SkillLicencesCommand` on the console: each licence finding is a row and exits 1, the
 *          findings are the `--json` data as `{ dir: "", text }`, and a clean tree prints the all-clear line.
 * Boundary: test only; the licence check is replaced, so no file is read.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0506; STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SkillLicencesCommand } from "#node/commands/skill-licences.command";
import { checkLicences } from "#node/skill-licences/functions/check-licences.function";

vi.mock("#node/skill-licences/functions/check-licences.function", () => ({
  checkLicences: vi.fn(),
}));

describe("SkillLicencesCommand", () => {
  it("exits 1 on a finding, the findings as --json data", async () => {
    vi.mocked(checkLicences).mockReturnValue(["skill archify has no record"]);
    const result = await runCommandForTest([SkillLicencesCommand], ["skill-licences", "--json"]);
    expect(result.exitCode).toBe(1);
    expect(result.json).toEqual({
      ok: false,
      data: [{ dir: "", text: "skill archify has no record" }],
    });
  });

  it("prints the all-clear line and exits 0", async () => {
    vi.mocked(checkLicences).mockReturnValue([]);
    const result = await runCommandForTest([SkillLicencesCommand], ["skill-licences"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("every skill and enabled plugin carries an allowed licence");
  });
});
