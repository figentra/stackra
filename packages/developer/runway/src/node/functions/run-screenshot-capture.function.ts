/**
 * Stackra file contract:
 * Purpose: `runScreenshotCapture(job, repository, run?)`, runs a capture job's commands in order on the Mac CI runner,
 *          waiting each step's `settleMs` before the next.
 * Boundary: runs exactly the job's list through the command runner (ADR 0352: the list printed for review is the list
 *           run); stops at the first failing command. Never meant for a developer's Mac (ci-box rule).
 * Runtime: node
 * Governing contract: ADR 0441 (as amended: D19); ADR 0352 (decision 3); app-shells section 14 (simulator lane on a
 *                     Mac runner).
 */
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import { runCommand } from "#node/functions/run-command.function";
import type { CommandRunner } from "#node/types/command-runner.type";
import type { ScreenshotCaptureJob } from "#node/types/screenshot-capture-job.type";

/**
 * Runs the capture job.
 *
 * @param job - the job `screenshotCaptureJob` defined.
 * @param repository - the repository root every step's folder is relative to.
 * @param run - the command runner; `runCommand` when absent.
 * @throws Error from the command runner when a command exits with an error.
 * @example
 * await runScreenshotCapture(screenshotCaptureJob({ repository: ".", app: "shopper", appPath }), ".");
 */
export async function runScreenshotCapture(
  job: ScreenshotCaptureJob,
  repository: string,
  run: CommandRunner = runCommand,
): Promise<void> {
  for (const step of job.steps) {
    await run(step.command, step.args, { cwd: join(repository, step.cwd ?? "") });
    if (step.settleMs !== undefined && step.settleMs > 0) await sleep(step.settleMs);
  }
}
