/**
 * Stackra file contract:
 * Purpose: unit tests of `RunwayRollbackCommand` on the console: it fetches origin/main first, refuses the head of
 *          origin/main as a usage error (exit 2, that is a promote) before dispatching anything, and hands an earlier
 *          commit to the promote path with `--dry-run` when asked.
 * Boundary: test only; the git and gh runner and the dispatcher are replaced through their fields, so no git, gh or
 *           workflow runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352 (decision 3: rollback); ADR 0506 (decision 8); STA-2104.
 */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";

import { RunwayRollbackCommand } from "#node/commands/runway-rollback.command";

/** The head of origin/main in the fake repository. */
const HEAD = "a".repeat(40);

/** An earlier commit of main. */
const EARLIER = "b".repeat(40);

/** The command over a fake origin/main whose head is HEAD; records each git call and each dispatch. */
async function run(argv: readonly string[]) {
  const cwd = mkdtempSync(join(tmpdir(), "runway-rollback-"));
  writeFileSync(join(cwd, "pnpm-workspace.yaml"), "packages: []\n");
  const git: (readonly string[])[] = [];
  const dispatched: (readonly string[])[] = [];
  class Rollback extends RunwayRollbackCommand {
    override connect = (root: string, log: (line: string) => void) => ({
      root,
      log,
      git: (args: readonly string[]) => {
        git.push(args);
        if (args[0] !== "rev-parse") return "";
        return args[1] === "origin/main" ? HEAD : (args[1] ?? "").replace("^{commit}", "");
      },
      gh: () => {},
    });

    override dispatch = (words: readonly string[]) => {
      dispatched.push(words);
    };
  }
  const result = await runCommandForTest([Rollback], ["rollback", ...argv], { cwd });
  return { result, git, dispatched };
}

describe(RunwayRollbackCommand, () => {
  /** An earlier commit goes down the promote path, after a fresh fetch of origin/main. */
  it("hands an earlier commit to the promote path, as a dry run when asked", async () => {
    const { result, git, dispatched } = await run([EARLIER, "--dry-run"]);

    expect(result.exitCode).toBe(0);
    expect(git[0]).toEqual(["fetch", "--quiet", "origin", "main"]);
    expect(dispatched).toEqual([["promote", EARLIER, "--dry-run"]]);
  });

  /** Shipping the head is a promote, so a rollback to it is refused and nothing is dispatched. */
  it("refuses the head of origin/main with exit 2", async () => {
    const { result, dispatched } = await run([HEAD]);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("is the head of origin/main");
    expect(dispatched).toEqual([]);
  });
});
