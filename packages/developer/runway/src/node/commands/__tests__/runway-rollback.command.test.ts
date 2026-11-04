/**
 * Stackra file contract:
 * Purpose: unit tests of `RunwayRollbackCommand`: it refuses the head of origin/main with a usage error and ships
 *          nothing, and runs the promote path for an earlier commit, passing `--dry-run` through.
 * Boundary: test only; `runwayIo`, `repositoryRoot` and `runRunway` are fakes, so no git or gh runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352 (decision 3: rollback); STA-2100.
 */
import type { runCommandForTest as RunCommandForTest } from "@stackra/console/testing";
import { beforeAll, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type { RunwayRollbackCommand as RollbackCommand } from "#node/commands/runway-rollback.command";

const { runRunway, runwayIo } = vi.hoisted(() => ({ runRunway: vi.fn(), runwayIo: vi.fn() }));

vi.mock("#node/functions/repository-root.function", () => ({ repositoryRoot: () => "/repo" }));
vi.mock("#node/functions/runway-io.function", () => ({ runwayIo }));
vi.mock("#node/functions/run-runway.function", () => ({ runRunway }));

// The command and the console load after the mocks, in one fresh module graph: the generated test setup may have
// imported the real functions already.
let RunwayRollbackCommand: typeof RollbackCommand;
let runCommandForTest: typeof RunCommandForTest;
beforeAll(async () => {
  vi.resetModules();
  ({ runCommandForTest } = await import("@stackra/console/testing"));
  ({ RunwayRollbackCommand } = await import("#node/commands/runway-rollback.command"));
});

const HEAD = "a".repeat(40);
const EARLIER = "b".repeat(40);

/** A fake io whose `git rev-parse` answers HEAD for origin/main and the named commit for anything else. */
function fakeIo() {
  const git = vi.fn((args: readonly string[]) =>
    args[0] === "rev-parse"
      ? args[1] === "origin/main"
        ? HEAD
        : (args[1] ?? "").replace("^{commit}", "")
      : "",
  );
  const io = { root: "/repo", git, gh: vi.fn(), log: vi.fn() };
  runwayIo.mockReturnValue(io);
  return io;
}

beforeEach(() => {
  runRunway.mockReset();
});

describe("RunwayRollbackCommand", () => {
  it("runs the promote path for an earlier commit, with --dry-run passed through", async () => {
    const io = fakeIo();

    const result = await runCommandForTest(
      [RunwayRollbackCommand],
      ["rollback", EARLIER, "--dry-run"],
    );

    expect(result.exitCode, result.stderr).toBe(0);
    expect(io.git).toHaveBeenCalledWith(["fetch", "--quiet", "origin", "main"]);
    expect(runRunway).toHaveBeenCalledWith(["promote", EARLIER, "--dry-run"], io);
  });

  it("omits --dry-run when it is not asked", async () => {
    const io = fakeIo();

    expect((await runCommandForTest([RunwayRollbackCommand], ["rollback", EARLIER])).exitCode).toBe(
      0,
    );
    expect(runRunway).toHaveBeenCalledWith(["promote", EARLIER], io);
  });

  it("refuses the head of origin/main with a usage error and ships nothing", async () => {
    fakeIo();

    const result = await runCommandForTest([RunwayRollbackCommand], ["rollback", HEAD]);

    expect(result.exitCode).toBe(2);
    expect(result.stdout + result.stderr).toContain(`${HEAD} is the head of origin/main`);
    expect(runRunway).not.toHaveBeenCalled();
  });
});
