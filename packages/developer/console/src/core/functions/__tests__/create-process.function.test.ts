/**
 * Stackra file contract:
 * Purpose: proves `createProcess` runs children in the run's working directory, throws a `CommandError` with the
 *          output as its detail on a non-zero exit (not with `check: false`), refuses an interactive child without a
 *          terminal before starting it, echoes output only under `--verbose`, redacts secret values, and refuses
 *          every run when no runner is bound; and that a failed task shows the tail of its step's output.
 * Boundary: unit test with the memory runner.
 * Runtime: node
 * Governing contract: STA-1966 spec FR-007, FR-028, FR-029 and AC-007; ADR 0022 (test placement).
 */
// @covers sta-1966:FR-007 sta-1966:FR-028 sta-1966:FR-029 sta-1966:AC-007
import { Command } from "#core/bases/command.base";
import { CommandError } from "#core/errors/command-error.error";
import { createProcess } from "#core/functions/create-process.function";
import type { CommandIo } from "#core/types/command-io.type";
import type { ConsoleMode } from "#core/types/console-mode.type";
import { MemoryProcessRunnerDriver } from "#testing/drivers/memory-process-runner.driver";
import { runCommandForTest } from "#testing/functions/run-command-for-test.function";

const MODE: ConsoleMode = {
  bidi: "logical",
  depth: 0,
  unicode: true,
  interactive: false,
  json: false,
  quiet: false,
  verbose: false,
  animate: false,
  tty: false,
  columns: 80,
};

const make = (runner: MemoryProcessRunnerDriver | undefined, mode: Partial<ConsoleMode> = {}) => {
  const echoed: string[] = [];
  const children = createProcess({
    ...(runner === undefined ? {} : { runner }),
    mode: { ...MODE, ...mode },
    cwd: "/repo",
    echo: (chunk) => echoed.push(chunk),
    redact: (text) => text.replaceAll("s3cret", "[redacted]"),
  });
  return { children, echoed };
};

describe("createProcess", () => {
  it("runs in the run's working directory unless the call names another", async () => {
    const runner = new MemoryProcessRunnerDriver().on("git status", { output: "clean\n" });
    const { children } = make(runner);
    expect(await children.run("git", ["status"])).toEqual({ code: 0, output: "clean\n" });
    await children.run("git", ["status"], { cwd: "/other" });
    expect(runner.calls.map((call) => call.cwd)).toEqual(["/repo", "/other"]);
  });

  it("throws a CommandError carrying the output on a non-zero exit, unless check is off", async () => {
    const runner = new MemoryProcessRunnerDriver().on("pnpm install", {
      code: 1,
      output: "ERR_PNPM\n",
    });
    const { children } = make(runner);
    const failure = await children
      .run("pnpm", ["install"], { fix: "pnpm install --force" })
      .catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(CommandError);
    expect(failure).toMatchObject({
      message: '"pnpm install" failed with exit code 1',
      detail: "ERR_PNPM\n",
      fix: "pnpm install --force",
    });
    expect(await children.run("pnpm", ["install"], { check: false })).toMatchObject({ code: 1 });
  });

  it("refuses an interactive child without a terminal, before it starts", async () => {
    const runner = new MemoryProcessRunnerDriver().on("gh auth login");
    await expect(
      make(runner).children.run("gh", ["auth", "login"], { interactive: true }),
    ).rejects.toThrow('"gh auth login" needs a terminal');
    expect(runner.calls).toHaveLength(0);
    await make(runner, { interactive: true }).children.run("gh", ["auth", "login"], {
      interactive: true,
    });
    expect(runner.calls[0]?.interactive).toBe(true);
  });

  it("echoes output only under --verbose, with secrets redacted", async () => {
    const runner = new MemoryProcessRunnerDriver().on("deploy", { output: "token s3cret\n" });
    expect(make(runner).echoed).toEqual([]);
    const quiet = make(runner);
    expect((await quiet.children.run("deploy", [])).output).toBe("token [redacted]\n");
    expect(quiet.echoed).toEqual([]);
    const loud = make(runner, { verbose: true });
    await loud.children.run("deploy", []);
    expect(loud.echoed).toEqual(["token [redacted]\n"]);
  });

  it("refuses every run when no runner is bound", async () => {
    await expect(make(undefined).children.run("git", ["status"])).rejects.toThrow(
      "no process runner is bound",
    );
  });
});

/** Installs, as a long step. */
class InstallCommand extends Command({
  name: "install",
  description: "Install",
}) {
  async handle(io: CommandIo) {
    await io.output.task("Installing", () => io.process.run("pnpm", ["install"]));
    return { cwd: io.cwd };
  }
}

describe("a failed step", () => {
  const output = `${Array.from({ length: 30 }, (_, index) => `line ${index + 1}`).join("\n")}\n`;
  const runner = () => new MemoryProcessRunnerDriver().on("pnpm install", { code: 1, output });

  it("shows the last 20 lines of its output under the task line, and all of it only under --verbose", async () => {
    const result = await runCommandForTest([InstallCommand], ["install"], { process: runner() });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("FAIL");
    expect(result.stderr).toContain("│ line 30");
    expect(result.stderr).toContain("│ line 11\n");
    expect(result.stderr).not.toContain("│ line 10\n");
    const verbose = await runCommandForTest([InstallCommand], ["install", "-v"], {
      process: runner(),
    });
    expect(verbose.stderr).toContain("│ line 1\n");
  });

  it("runs in the harness's working directory", async () => {
    const ok = new MemoryProcessRunnerDriver().on("pnpm install");
    const result = await runCommandForTest([InstallCommand], ["install", "--json"], {
      process: ok,
      cwd: "/repo",
    });
    expect(result.json).toEqual({ ok: true, data: { cwd: "/repo" } });
    expect(ok.calls[0]?.cwd).toBe("/repo");
  });
});
