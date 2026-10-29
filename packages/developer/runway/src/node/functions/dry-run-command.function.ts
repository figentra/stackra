/**
 * Stackra file contract:
 * Purpose: `dryRunCommand(options)`, the dry-run `CommandRunner`: records every command and answers without running
 *          it: `git rev-parse` with the given commit, `eas` with an empty JSON list, anything else with an empty
 *          output, unless `answer` answers first.
 * Boundary: runs nothing itself; `answer` may run a read for real (`npm view`). Passed as `run` to the mobile job, the
 *           publish step, the compatibility gate and the line checkout, it leaves their local outputs written and
 *           every external effect recorded.
 * Runtime: node
 * Governing contract: ADR 0352 (decision 3); ADR 0481.
 */
import type { DeployStep } from "#core/types/deploy-step.type";
import type { CommandRunner } from "#node/types/command-runner.type";
import type { DryRunCommand } from "#node/types/dry-run-command.type";

/**
 * A recording runner.
 *
 * @param options.head - what `git rev-parse` answers; forty zeros when absent.
 * @param options.answer - consulted first; `undefined` falls back to the stand-in output.
 * @example
 * const run = dryRunCommand({ head: sha });
 * await runMobileJob({ …, run });
 * run.calls; // [{ command: "git", args: ["rev-parse", "HEAD"], … }, { command: "eas", args: ["build", …] }]
 */
export function dryRunCommand(
  options: {
    readonly head?: string;
    readonly answer?: (
      command: string,
      args: readonly string[],
      cwd: string | undefined,
    ) => Promise<string | undefined> | string | undefined;
  } = {},
): DryRunCommand {
  const calls: DeployStep[] = [];
  const run: CommandRunner = async (command, args, { cwd }) => {
    calls.push({ command, args: [...args], ...(cwd === undefined ? {} : { cwd }) });
    const answered = await options.answer?.(command, args, cwd);
    if (answered !== undefined) return answered;
    if (command === "git" && args[0] === "rev-parse") return `${options.head ?? "0".repeat(40)}\n`;
    return command === "eas" ? "[]" : "";
  };
  return Object.assign(run, { calls });
}
