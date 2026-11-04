/**
 * Stackra file contract:
 * Purpose: `toolCommand(task, summary)`, the passthrough form of a member tool command, kept for the two still on
 *          passthrough, `stackra dev` and `stackra build` (`DEV_COMMAND`, `BUILD_COMMAND`): its flags parsed here,
 *          then `runToolTask` with `runProcess`, so the tool takes the terminal when the caller has one. `start`,
 *          `typecheck`, `test` and `lint` are console command classes over the same `runToolTask`.
 * Boundary: builds the command definition only; `runToolTask` does the work.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5); the task vocabulary rule; ADR 0500 (decision 7: passthrough only goes
 *                     down); STA-1966.
 */
import { runProcess } from "#node/functions/run-process.function";
import { runToolTask } from "#node/functions/run-tool-task.function";
import type { CliCommand } from "#node/types/cli-command.type";
import type { ToolTask } from "#node/types/tool-task.type";

/** The options each task accepts. */
const OPTIONS: Readonly<Record<ToolTask, CliCommand["options"]>> = {
  dev: { target: { type: "string" } },
  build: { target: { type: "string" } },
  start: {},
  typecheck: {},
  test: { tier: { type: "string" }, target: { type: "string" } },
  lint: {},
};

/**
 * The command that runs `task`.
 *
 * @param task - the command name, also the Turborepo task.
 * @param summary - its line in `stackra --help`.
 * @example
 * toolCommand("build", "Generate, then build the member");
 */
export function toolCommand(task: ToolTask, summary: string): CliCommand {
  const options = OPTIONS[task] ?? {};
  const flags = Object.keys(options).map((name) => ` [--${name} <${name}>]`);
  return {
    name: task,
    summary,
    usage: `stackra ${task}${flags.join("")}`,
    options,
    run: ({ cwd, values, io }) =>
      runToolTask(
        task,
        {
          cwd,
          target: typeof values["target"] === "string" ? values["target"] : undefined,
          tier: typeof values["tier"] === "string" ? values["tier"] : undefined,
        },
        io,
        (tool) => runProcess(tool, io),
      ),
  };
}
