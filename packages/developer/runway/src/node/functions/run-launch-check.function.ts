/**
 * Stackra file contract:
 * Purpose: `runLaunchCheck(job, repository, run?)`, runs a launch check job's commands in order on the CI runner.
 * Boundary: runs exactly the job's list through the command runner (ADR 0352: the list printed for review is the list
 *           run); stops at the first failing command, so a failed flow fails the job and blocks the promotion that
 *           needs it. Never meant for a developer's Mac.
 * Runtime: node
 * Governing contract: STA-265 spec (FR-002, D5); ADR 0352 (decision 3).
 */
import { join } from "node:path";

import { runCommand } from "#node/functions/run-command.function";
import type { CommandRunner } from "#node/types/command-runner.type";
import type { LaunchCheckJob } from "#node/types/launch-check-job.type";

/**
 * Runs the launch check.
 *
 * @param job - the job `launchCheckJob` defined.
 * @param repository - the repository root every step runs from.
 * @param run - the command runner; `runCommand` when absent.
 * @throws Error from the command runner when a command, a Maestro flow included, exits with an error.
 * @example
 * await runLaunchCheck(launchCheckJob({ repository: ".", app: "shopper", platform: "ios", appPath, templateDir }), ".");
 */
export async function runLaunchCheck(
  job: LaunchCheckJob,
  repository: string,
  run: CommandRunner = runCommand,
): Promise<void> {
  for (const step of job.steps)
    await run(step.command, step.args, { cwd: join(repository, step.cwd ?? "") });
}
