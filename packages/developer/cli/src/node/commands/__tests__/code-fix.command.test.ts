/**
 * Stackra file contract:
 * Purpose: unit tests of `CodeFixCommand`: it runs the format and lint phases with their fixes, and exits 1 when a
 *          phase still fails.
 * Boundary: test only; `runCheck` is replaced by a fake, so no phase runs and no file changes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 3); ADR 0506; STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CodeFixCommand } from "#node/commands/code-fix.command";
import { runCheck } from "#node/functions/run-check.function";

vi.mock("#node/functions/run-check.function", () => ({
  runCheck: vi.fn(async () => ({ code: 1, findings: [], phases: [] })),
}));

describe("CodeFixCommand", () => {
  it("presets the format and lint phases with fixes, and exits with runCheck's code", async () => {
    expect((await runCommandForTest([CodeFixCommand], ["code:fix"])).exitCode).toBe(1);
    expect(vi.mocked(runCheck).mock.calls[0]?.[1]).toEqual({ only: ["format", "lint"], fix: true });
  });
});
