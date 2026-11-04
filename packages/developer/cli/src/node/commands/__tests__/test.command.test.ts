/**
 * Stackra file contract:
 * Purpose: unit tests of `TestCommand` on the console: at the workspace root it fans out through `turbo run test`
 *          (`test:e2e` for `--tier e2e`) streamed live with the member's `node_modules/.bin` first on `PATH`, and its
 *          exit code is the runner's; `--tier int` and `--target` at the root and an unknown tier exit 2; in a member
 *          a gen refusal stops before the runner.
 * Boundary: test only; gen is replaced by a fake and the processes by `MemoryProcessRunnerDriver`, so nothing runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182; ADR 0506 (amendment 2026-11-03); STA-1966.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { MemoryProcessRunnerDriver, runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { TestCommand } from "#node/commands/test.command";
import { runGen } from "#node/functions/run-gen.function";

vi.mock("#node/functions/run-gen.function", () => ({ runGen: vi.fn() }));

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-test-command-"));
  vi.mocked(runGen).mockReset().mockResolvedValue(true);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const workspace = () => writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");

describe("TestCommand", () => {
  it("fans out through turbo at the root, streamed live, and exits with turbo's code", async () => {
    workspace();
    const process = new MemoryProcessRunnerDriver().on("turbo run test", { code: 3 });
    const result = await runCommandForTest([TestCommand], ["test"], { cwd: root, process });
    expect(result.exitCode).toBe(3);
    expect(process.calls.map((call) => call.line)).toEqual(["turbo run test"]);
    expect(process.calls[0]?.inherit).toBe(true);
    expect(process.calls[0]?.cwd).toBe(root);
    expect(process.calls[0]?.env?.["PATH"]?.startsWith(join(root, "node_modules", ".bin"))).toBe(
      true,
    );
  });

  it("runs turbo's test:e2e for --tier e2e, on standard error under --json", async () => {
    workspace();
    const process = new MemoryProcessRunnerDriver().on("turbo run test:e2e");
    const result = await runCommandForTest([TestCommand], ["test", "--tier", "e2e", "--json"], {
      cwd: root,
      process,
    });
    expect(result.exitCode).toBe(0);
    expect(process.calls[0]?.inherit).toBe("stderr");
  });

  it("exits 2 for --tier int or --target at the root, and for an unknown tier", async () => {
    workspace();
    for (const argv of [
      ["test", "--tier", "int"],
      ["test", "--target", "ios"],
      ["test", "--tier", "load"],
    ]) {
      const process = new MemoryProcessRunnerDriver();
      const result = await runCommandForTest([TestCommand], argv, { cwd: root, process });
      expect(result.exitCode).toBe(2);
      expect(process.calls).toEqual([]);
    }
  });

  it("stops before the runner when gen refuses in a member", async () => {
    writeFileSync(join(root, "stackra.config.ts"), "export default definePackage({});\n");
    vi.mocked(runGen).mockResolvedValue(false);
    const process = new MemoryProcessRunnerDriver();
    const result = await runCommandForTest([TestCommand], ["test"], { cwd: root, process });
    expect(result.exitCode).toBe(1);
    expect(process.calls).toEqual([]);
  });
});
