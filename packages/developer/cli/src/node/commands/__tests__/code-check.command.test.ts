/**
 * Stackra file contract:
 * Purpose: unit tests of `CodeCheckCommand`: it runs the format and lint phases only, without fixes, and `--only`
 *          on the command line wins over that preset.
 * Boundary: test only; `runCheck` is replaced by a fake, so no phase runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 3); ADR 0506; STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CodeCheckCommand } from "#node/commands/code-check.command";
import { runCheck } from "#node/functions/run-check.function";

vi.mock("#node/functions/run-check.function", () => ({
  runCheck: vi.fn(async () => ({ code: 0, findings: [], phases: [] })),
}));

describe("CodeCheckCommand", () => {
  it("presets the format and lint phases, and passes --only on for runCheck to prefer", async () => {
    expect((await runCommandForTest([CodeCheckCommand], ["code:check"])).exitCode).toBe(0);
    expect(vi.mocked(runCheck).mock.calls[0]?.[1]).toEqual({ only: ["format", "lint"] });
    expect(vi.mocked(runCheck).mock.calls[0]?.[0].values["fix"]).toBe(false);
    await runCommandForTest([CodeCheckCommand], ["code:check", "--only", "lint"]);
    expect(vi.mocked(runCheck).mock.calls[1]?.[0].values["only"]).toBe("lint");
  });
});
