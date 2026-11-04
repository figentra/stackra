/**
 * Stackra file contract:
 * Purpose: unit tests of `LintCommand` on the console: at the workspace root it fans out through `turbo run lint`
 *          streamed live, and its exit code is turbo's.
 * Boundary: test only; the processes are replaced by `MemoryProcessRunnerDriver`, so nothing runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); the task vocabulary rule; ADR 0506; STA-1966.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { MemoryProcessRunnerDriver, runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";

import { LintCommand } from "#node/commands/lint.command";

describe("LintCommand", () => {
  it("fans out through turbo at the root, streamed live, and exits with turbo's code", async () => {
    const root = mkdtempSync(join(tmpdir(), "stackra-lint-command-"));
    try {
      writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
      const process = new MemoryProcessRunnerDriver().on("turbo run lint", { code: 4 });
      const result = await runCommandForTest([LintCommand], ["lint"], { cwd: root, process });
      expect(result.exitCode).toBe(4);
      expect(process.calls.map((call) => [call.line, call.inherit])).toEqual([
        ["turbo run lint", true],
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
