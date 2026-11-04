/**
 * Stackra file contract:
 * Purpose: `runInherited(io, run)`, starts one tool whose output people watch (turbo, vitest, tsdown, a seed entry)
 *          through the console's `io.process`, sharing the standard streams so its output is live, and resolves with
 *          its exit code. Every `node_modules/.bin` from the tool's directory up goes first on `PATH` (`toolPath`), so
 *          the member's own pinned tools win, and the run's `env` is added.
 * Boundary: never uses a shell. Under `--json` the console sends the tool's output to standard error. A tool that
 *           cannot start resolves 127 with the reason on standard error; a non-zero exit is the tool's own code, never
 *           a thrown error. Refused (a `CommandError`) while the run holds a secret value.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5); ADR 0506 (amendment 2026-11-03: `inherit`); STA-1966; POSIX exit status
 *                     127 for a command that cannot run.
 */
import type { CommandIo } from "@stackra/console";

import { toolPath } from "#node/functions/tool-path.function";
import type { ToolRun } from "#node/types/tool-run.type";

/**
 * Runs `run` with the shared streams and resolves with its exit code.
 *
 * @example
 * return runInherited(io, { command: "turbo", args: ["run", "test"], cwd: root });
 */
export async function runInherited(io: CommandIo, run: ToolRun): Promise<number> {
  const { code, output } = await io.process.run(run.command, run.args, {
    cwd: run.cwd,
    env: { ...run.env, PATH: toolPath(run.cwd) },
    inherit: true,
    check: false,
  });
  // A shared child's output is not captured, so any output is the runner's reason the tool could not start.
  if (output !== "") io.stderr.write(`stackra: cannot start ${output}`);
  return code;
}
