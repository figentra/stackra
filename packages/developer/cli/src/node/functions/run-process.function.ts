/**
 * Stackra file contract:
 * Purpose: `runProcess(run, io)`, starts one tool process and resolves with its exit code: with the terminal when
 *          `io.inherit`, otherwise with its output piped into `io`. Every `node_modules/.bin` from the tool's directory
 *          up goes first on `PATH`, so the member's own pinned tools win.
 * Boundary: never uses a shell, so no argument is parsed as shell syntax; never reads or prints a secret. A tool that
 *           cannot start resolves 127 with the reason written to `io.err`.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5); POSIX exit status 127 for a command that cannot run.
 */
import { spawn } from "node:child_process";
import { delimiter, dirname, join } from "node:path";

import type { CliIo } from "#node/types/cli-io.type";
import type { ToolRun } from "#node/types/tool-run.type";

/** `PATH` with every `node_modules/.bin` from `cwd` to the filesystem root in front. */
function pathFrom(cwd: string): string {
  const bins: string[] = [];
  for (let folder = cwd; ; folder = dirname(folder)) {
    bins.push(join(folder, "node_modules", ".bin"));
    if (dirname(folder) === folder) break;
  }
  return [...bins, process.env["PATH"] ?? ""].join(delimiter);
}

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
    // shortcut: no shell, so Windows `.cmd` shims do not start; add `shell: true` with quoting when Windows is supported.
    const child = spawn(run.command, [...run.args], {
      cwd: run.cwd,
      env: { ...process.env, PATH: pathFrom(run.cwd) },
      stdio: io.inherit ? "inherit" : ["ignore", "pipe", "pipe"],
    });
    child.stdout?.setEncoding("utf8").on("data", io.out);
    child.stderr?.setEncoding("utf8").on("data", io.err);
    let settled = false;
    // A spawn failure (no such program) emits `error` and then `close`; the first settle wins.
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      io.err(`stackra: cannot start ${run.command}: ${error.message}\n`);
      resolve(127);
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      resolve(code ?? 1);
    });
  });
}
