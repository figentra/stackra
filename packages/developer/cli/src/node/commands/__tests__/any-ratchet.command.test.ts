/**
 * Stackra file contract:
 * Purpose: unit tests of `AnyRatchetCommand` on the console: a package above its baseline exits 1 with its row, the
 *          lowered baselines are a warning that never fails the run, and the findings are the `--json` data.
 * Boundary: test only; the ratchet functions are replaced, so no source is read.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0506; STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { anyRatchetFindings } from "#node/any-ratchet/functions/any-ratchet-findings.function";
import { loweredBaselines } from "#node/any-ratchet/functions/lowered-baselines.function";
import { AnyRatchetCommand } from "#node/commands/any-ratchet.command";

vi.mock("#node/any-ratchet/functions/any-ratchet-findings.function", () => ({
  anyRatchetFindings: vi.fn(),
}));
vi.mock("#node/any-ratchet/functions/lowered-baselines.function", () => ({
  loweredBaselines: vi.fn(),
}));

const finding = { dir: "packages/data/model", text: "3 no-explicit-any disables, baseline 2" };

beforeEach(() => {
  vi.mocked(anyRatchetFindings).mockReset();
  vi.mocked(loweredBaselines).mockReset();
});

describe("AnyRatchetCommand", () => {
  it("exits 1 on a package above its baseline, the findings as --json data", async () => {
    vi.mocked(anyRatchetFindings).mockReturnValue([finding]);
    vi.mocked(loweredBaselines).mockReturnValue([]);
    const result = await runCommandForTest([AnyRatchetCommand], ["any-ratchet", "--json"]);
    expect(result.exitCode).toBe(1);
    expect(result.json).toEqual({ ok: false, data: [finding] });
  });

  it("warns about lowered baselines and still exits 0 without a finding", async () => {
    vi.mocked(anyRatchetFindings).mockReturnValue([]);
    vi.mocked(loweredBaselines).mockReturnValue(["packages/data/cache"]);
    const result = await runCommandForTest([AnyRatchetCommand], ["any-ratchet"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("packages/data/cache");
  });
});
