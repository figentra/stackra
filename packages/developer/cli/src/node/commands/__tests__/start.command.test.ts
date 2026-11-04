/**
 * Stackra file contract:
 * Purpose: unit tests of `StartCommand` on the console: at the workspace root it fans out through `turbo run start`
 *          streamed live, and its exit code is turbo's; a tool that cannot start exits 127 with the reason.
 * Boundary: test only; the processes are replaced by `MemoryProcessRunnerDriver`, so nothing runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); the task vocabulary rule; ADR 0506; STA-1966.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { MemoryProcessRunnerDriver, runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { StartCommand } from "#node/commands/start.command";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-start-command-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("StartCommand", () => {
  it("fans out through turbo at the root, streamed live, and exits with turbo's code", async () => {
    const process = new MemoryProcessRunnerDriver().on("turbo run start", { code: 4 });
    const result = await runCommandForTest([StartCommand], ["start"], { cwd: root, process });
    expect(result.exitCode).toBe(4);
    expect(process.calls.map((call) => [call.line, call.inherit])).toEqual([
      ["turbo run start", true],
    ]);
  });

  it("exits 127 naming the reason when the tool cannot start", async () => {
    // An unscripted line answers 127 with a reason, as a missing program does.
    const result = await runCommandForTest([StartCommand], ["start"], {
      cwd: root,
      process: new MemoryProcessRunnerDriver(),
    });
    expect(result.exitCode).toBe(127);
    expect(result.stderr).toContain("stackra: cannot start turbo: not scripted");
  });
});
