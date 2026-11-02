/**
 * Stackra file contract:
 * Purpose: `runStep(command, args, cwd)`, one step of `stackra create` (install, gen, typecheck, tests, git) with its
 *          output captured: resolves with the output; rejects with the last lines of it when the step fails, so the
 *          failure names what went wrong without flooding the screen.
 * Boundary: runs one child process in `cwd`; writes nothing itself.
 * Runtime: node
 * Governing contract: STA-1952 spec FR-009 and FR-011.
 */
import { execFile } from "node:child_process";

/** How many lines of a failed step's output are shown. */
const TAIL = 25;

/**
 * Runs a step and resolves with its standard output and error, joined.
 *
 * @param command - the program.
 * @param args - its arguments.
 * @param cwd - where it runs.
 * @throws Error with the output's tail when it exits non-zero or cannot start.
 * @example
 * const wrote = await runStep("pnpm", ["exec", "stackra", "gen"], "/tmp/acme");
 */
export function runStep(command: string, args: readonly string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(command, [...args], { cwd, maxBuffer: 64 * 1024 * 1024 }, (error, stdout, stderr) => {
      const output = `${stdout}${stderr}`;
      if (error === null) {
        resolve(output);
        return;
      }
      const tail = output.trimEnd().split("\n").slice(-TAIL).join("\n");
      reject(new Error(`\`${[command, ...args].join(" ")}\` failed:\n${tail || error.message}`));
    });
  });
}
