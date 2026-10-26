/**
 * Stackra file contract:
 * Purpose: `runCaptured(command, args, cwd)`, runs one tool for a check phase with its output captured (stdout and stderr
 *          apart), or resolves `undefined` when the tool is not installed, so the phase reports "skipped (not
 *          installed)" instead of failing.
 * Boundary: starts one process through `runProcess` (no shell; the member's own `node_modules/.bin` first).
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); POSIX exit status 127 for a command that cannot run.
 */
import { runProcess } from "#node/functions/run-process.function";
import type { ToolOutput } from "#node/types/tool-output.type";

/**
 * The output of `command args` run in `cwd`, or `undefined` when `command` cannot start.
 *
 * @param command - the program, found on `PATH` or in a `node_modules/.bin` above `cwd`.
 * @param args - its arguments.
 * @param cwd - the absolute directory it runs in.
 * @example
 * const result = await runCaptured("oxlint", ["-f", "json", "."], root);
 */
export async function runCaptured(
  command: string,
  args: readonly string[],
  cwd: string,
): Promise<ToolOutput | undefined> {
  let stdout = "";
  let stderr = "";
  const code = await runProcess(
    { command, args, cwd },
    {
      out: (text) => {
        stdout += text;
      },
      err: (text) => {
        stderr += text;
      },
      inherit: false,
    },
  );
  if (code === 127 && stderr.startsWith(`stackra: cannot start ${command}:`)) return undefined;
  return { code, stdout, stderr };
}
