/**
 * Stackra file contract:
 * Purpose: `runProcess(run, io)`, starts one tool process and resolves with its exit code: with the terminal when
 *          `io.inherit`, otherwise with its output piped into `io`. Every `node_modules/.bin` from the tool's directory
 *          up goes first on `PATH` (`toolEnv`), so the member's own pinned tools win.
 * Boundary: starts the tool through cross-spawn: elsewhere that is `child_process.spawn` with no shell; on Windows it
 *           finds the `.cmd` shim a package manager writes (`pnpm.cmd`, `node_modules/.bin/vitest.cmd`) and runs it
 *           through cmd.exe with every argument escaped, so no argument is parsed as shell syntax on any system. Never
 *           reads or prints a secret. A tool that cannot start resolves 127 with the reason written to `io.err`. One
 *           still running past `run.timeoutMs` gets SIGTERM (SIGKILL 5 s later) and resolves 124, the `timeout`
 *           convention.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5); POSIX exit status 127 for a command that cannot run; STA-2899 (Windows-
 *                     safe process runners).
 */
import crossSpawn from "cross-spawn";

import { toolEnv } from "#node/functions/tool-env.function";
import type { CliIo } from "#node/types/cli-io.type";
import type { ToolRun } from "#node/types/tool-run.type";

/**
 * Runs `run` and resolves with its exit code.
 *
 * @param run - the program, its arguments and its directory.
 * @param io - where its output goes, unless it inherits the terminal.
 * @example
 * process.exitCode = await runProcess({ command: "vitest", args: ["run"], cwd: root }, PROCESS_IO);
 */
export function runProcess(run: ToolRun, io: CliIo): Promise<number> {
  return new Promise((resolve) => {
    const child = crossSpawn(run.command, [...run.args], {
      cwd: run.cwd,
      env: toolEnv(run.cwd, run.env),
      stdio: io.inherit ? "inherit" : ["ignore", "pipe", "pipe"],
    });
    child.stdout?.setEncoding("utf8").on("data", io.out);
    child.stderr?.setEncoding("utf8").on("data", io.err);
    let settled = false;
    let timedOut = false;
    // A testbed probe that never answers (a box still booting keeps an SSH session open) must not stall its caller.
    const deadline =
      run.timeoutMs === undefined
        ? undefined
        : setTimeout(() => {
            timedOut = true;
            io.err(`stackra: ${run.command} gave no answer in ${run.timeoutMs} ms\n`);
            child.kill("SIGTERM");
            setTimeout(() => child.kill("SIGKILL"), 5000).unref();
          }, run.timeoutMs);
    // A spawn failure (no such program) emits `error` and then `close`; the first settle wins. On Windows cross-spawn
    // reports a program cmd.exe could not find the same way, as an ENOENT `error`.
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      io.err(`stackra: cannot start ${run.command}: ${error.message}\n`);
      resolve(127);
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      resolve(timedOut ? 124 : (code ?? 1));
    });
  });
}
