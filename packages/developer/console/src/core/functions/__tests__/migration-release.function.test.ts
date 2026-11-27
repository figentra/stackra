/**
 * Stackra file contract:
 * Purpose: unit tests of `migrationRelease`: `--release` first, then `STACKRA_RELEASE`, then the checkout's commit read
 *          with `git rev-parse` in the folder given, and nothing outside a checkout, for an answer that is not a commit,
 *          or when git cannot run (STA-1406).
 * Boundary: test only; git is a scripted `MemoryProcessRunnerDriver`, so nothing runs. A real checkout is covered by
 *           @stackra/cli's `db-migrate.command.test.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (decision 3); STA-1406.
 */
import { describe, expect, it } from "vitest";

import { migrationRelease } from "#core/functions/migration-release.function";
import type { ConsoleProcess } from "#core/types/console-process.type";
import { MemoryProcessRunnerDriver } from "#testing/drivers/memory-process-runner.driver";

/** The commit a deploy's checkout is at. */
const HEAD = "4f1c2b0e9d8a7f6e5d4c3b2a1908f7e6d5c4b3a2";

/** The git line the chain runs. */
const REV_PARSE = "git rev-parse --verify --quiet HEAD";

/** A process runner over `driver`, as `io.process` runs one. */
const over = (driver: MemoryProcessRunnerDriver): ConsoleProcess => ({
  run: (command, args, options) => driver.run(command, args, { cwd: "/work", ...options }),
});

describe("migrationRelease", () => {
  it("names the checkout's commit, read in the folder given, when no release is named", async () => {
    const git = new MemoryProcessRunnerDriver().on(REV_PARSE, { output: `${HEAD}\n` });
    expect(await migrationRelease(undefined, { cwd: "apps/api", process: over(git) }, {})).toBe(
      HEAD,
    );
    expect(git.calls.map((call) => [call.line, call.cwd])).toEqual([[REV_PARSE, "apps/api"]]);
  });

  it("prefers --release, then STACKRA_RELEASE, and then runs no git", async () => {
    const git = new MemoryProcessRunnerDriver().on(REV_PARSE, { output: `${HEAD}\n` });
    const io = { cwd: "/work", process: over(git) };
    const env = { STACKRA_RELEASE: " 2026.11.27-1 " };
    expect(await migrationRelease("v1.4.0", io, env)).toBe("v1.4.0");
    expect(await migrationRelease("", io, env)).toBe("2026.11.27-1");
    expect(await migrationRelease(" ", io, { STACKRA_RELEASE: "" })).toBe(HEAD);
    expect(git.calls).toHaveLength(1);
  });

  it("names nothing outside a checkout, or when git answers something that is not a commit", async () => {
    const outside = new MemoryProcessRunnerDriver().on(REV_PARSE, { code: 128 });
    expect(await migrationRelease(undefined, { cwd: "/work", process: over(outside) }, {})).toBe(
      undefined,
    );
    const odd = new MemoryProcessRunnerDriver().on(REV_PARSE, { output: "HEAD\n" });
    expect(await migrationRelease(undefined, { cwd: "/work", process: over(odd) }, {})).toBe(
      undefined,
    );
  });

  it("names nothing when git cannot run", async () => {
    const broken: ConsoleProcess = {
      run: async () => {
        throw new Error("spawn git ENOENT");
      },
    };
    expect(await migrationRelease(undefined, { cwd: "/work", process: broken }, {})).toBe(
      undefined,
    );
  });
});
