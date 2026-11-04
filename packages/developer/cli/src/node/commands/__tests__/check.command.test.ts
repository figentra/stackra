/**
 * Stackra file contract:
 * Purpose: unit tests of `CheckCommand`: `stackra check` runs the gate with no preset, so the phases are the flags'
 *          (`runCheck` picks every phase but `test` by default), and its exit code is `runCheck`'s.
 * Boundary: test only; `runCheck` is replaced by a fake, so no phase runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 3); ADR 0506; STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CheckCommand } from "#node/commands/check.command";
import { runCheck } from "#node/functions/run-check.function";

vi.mock("#node/functions/run-check.function", () => ({
  runCheck: vi.fn(async () => ({ code: 1, findings: [], phases: [] })),
}));

describe("CheckCommand", () => {
  it("runs the gate with no preset and exits with runCheck's code", async () => {
    const result = await runCommandForTest([CheckCommand], ["check", "--fix"]);
    expect(result.exitCode).toBe(1);
    expect(vi.mocked(runCheck).mock.calls[0]?.[1]).toEqual({});
    expect(vi.mocked(runCheck).mock.calls[0]?.[0].values["fix"]).toBe(true);
  });
});
