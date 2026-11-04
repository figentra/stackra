/**
 * Stackra file contract:
 * Purpose: unit tests of `checkCommand` on the console: every check flag reaches `runCheck` with the command's presets,
 *          the exit code is `runCheck`'s, the text goes out byte-exact on standard output, `--json` writes the
 *          findings and phase rows as the data (the text moves to standard error), and an unknown `--format` exits 2
 *          before anything runs.
 * Boundary: test only; `runCheck` is replaced by a fake, so no phase runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 3); ADR 0506; STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { checkCommand } from "#node/functions/check-command.function";
import { runCheck } from "#node/functions/run-check.function";

vi.mock("#node/functions/run-check.function", () => ({ runCheck: vi.fn() }));

/** A check command made the way the real ones are. */
class SampleCommand extends checkCommand(
  {
    name: "sample",
    description: "Sample checks",
  },
  { only: ["lint"] },
) {}

const finding = { phase: "lint", path: "a.ts", severity: "error", message: "x" };
const row = { phase: "lint", status: "failed", findings: 1, fixable: 0, ms: 1 };

beforeEach(() => {
  vi.mocked(runCheck)
    .mockReset()
    .mockImplementation(async ({ io }) => {
      io.out("lint\n  a.ts x\n");
      return { code: 1, findings: [finding] as never, phases: [row] };
    });
});

describe("checkCommand", () => {
  it("passes every flag and the presets to runCheck, and exits with its code", async () => {
    const result = await runCommandForTest(
      [SampleCommand],
      [
        "sample",
        "--fix",
        "--affected",
        "--only",
        "format,lint",
        "--skip",
        "docs",
        "--format",
        "github",
        "--base",
        "main",
        "--with-tests",
        "--keep-going",
      ],
    );
    expect(result.exitCode).toBe(1);
    const [context, defaults] = vi.mocked(runCheck).mock.calls[0] ?? [];
    expect(context?.cwd).toBe("/work");
    expect(context?.values).toEqual({
      fix: true,
      affected: true,
      only: "format,lint",
      skip: "docs",
      format: "github",
      base: "main",
      "with-tests": true,
      "keep-going": true,
    });
    expect(defaults).toEqual({ only: ["lint"] });
    expect(result.stdout).toBe("lint\n  a.ts x\n");
  });

  it("leaves the flags at their defaults when none is given", async () => {
    await runCommandForTest([SampleCommand], ["sample"]);
    expect(vi.mocked(runCheck).mock.calls[0]?.[0].values).toEqual({
      fix: false,
      affected: false,
      only: undefined,
      skip: undefined,
      format: "text",
      base: undefined,
      "with-tests": false,
      "keep-going": false,
    });
  });

  it("writes the findings and the phase rows as the --json data, the text on standard error", async () => {
    const result = await runCommandForTest([SampleCommand], ["sample", "--json"]);
    expect(result.exitCode).toBe(1);
    expect(result.json).toEqual({ ok: false, data: { findings: [finding], phases: [row] } });
    expect(result.stderr).toContain("a.ts x");
  });

  it("exits 2 for an unknown --format before anything runs", async () => {
    const result = await runCommandForTest([SampleCommand], ["sample", "--format", "xml"]);
    expect(result.exitCode).toBe(2);
    expect(runCheck).not.toHaveBeenCalled();
  });
});
