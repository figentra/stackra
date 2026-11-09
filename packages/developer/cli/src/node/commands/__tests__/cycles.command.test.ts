/**
 * Stackra file contract:
 * Purpose: unit tests of `CyclesCommand` on the console, and through it of `reportFindings`: a cycle is a failed
 *          checklist row named by its folder and exits 1, the findings are the `--json` data unchanged, and a clean
 *          workspace prints the success line and exits 0.
 * Boundary: test only; the cycle finder is replaced, so no workspace is read.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0506; STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CyclesCommand } from "#node/commands/cycles.command";
import { packageCycleFindings } from "#node/cycles/functions/package-cycle-findings.function";

vi.mock("#node/cycles/functions/package-cycle-findings.function", () => ({
  packageCycleFindings: vi.fn(),
}));

const cycle = {
  dir: "pnpm-workspace.yaml",
  text: "package cycle: @stackra/a → @stackra/b → @stackra/a",
};

beforeEach(() => {
  vi.mocked(packageCycleFindings).mockReset();
});

describe("CyclesCommand", () => {
  it("draws each cycle as a failed row and exits 1", async () => {
    vi.mocked(packageCycleFindings).mockReturnValue([cycle]);
    const result = await runCommandForTest([CyclesCommand], ["cycles"]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("pnpm-workspace.yaml");
    expect(result.stdout).toContain("@stackra/a → @stackra/b");
    expect(packageCycleFindings).toHaveBeenCalledWith("/work");
  });

  it("emits the findings unchanged under --json", async () => {
    vi.mocked(packageCycleFindings).mockReturnValue([cycle]);
    const result = await runCommandForTest([CyclesCommand], ["cycles", "--json"]);
    expect(result.exitCode).toBe(1);
    expect(result.json).toEqual({ ok: false, data: [cycle] });
  });

  it("exits 0 with the clean line, and [] under --json", async () => {
    vi.mocked(packageCycleFindings).mockReturnValue([]);
    const result = await runCommandForTest([CyclesCommand], ["cycles"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("no package cycle");
    const json = await runCommandForTest([CyclesCommand], ["cycles", "--json"]);
    expect(json.json).toEqual({ ok: true, data: [] });
  });
});
