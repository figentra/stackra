/**
 * Stackra file contract:
 * Purpose: `MaestroSmokeDriver`, the `mobile` driver of the `SmokeDriver` port: runs the launch check
 *          (`launchCheckJob`, `runLaunchCheck`) of one app on one platform and reports the failing command as its
 *          problem and the report folder as its evidence.
 * Boundary: runs the launch check's commands only, through the given `CommandRunner`, on the CI runner the workflow
 *           picked for the platform (`LAUNCH_CHECK_DEFAULTS.runners`). A runway the job refuses still throws.
 * Runtime: node
 * Governing contract: STA-265 spec (D1 to D4, D6, FR-011).
 */
import { Driver } from "@stackra/container";

import { SmokeDriver } from "#core/ports/smoke-driver.port";
import type { SmokeResult } from "#core/types/smoke-result.type";
import type { SmokeSubject } from "#core/types/smoke-subject.type";
import { launchCheckJob } from "#node/functions/launch-check-job.function";
import { runCommand } from "#node/functions/run-command.function";
import { runLaunchCheck } from "#node/functions/run-launch-check.function";
import type { CommandRunner } from "#node/types/command-runner.type";

/**
 * The mobile smoke check.
 *
 * @example
 * await new MaestroSmokeDriver().check({ target: "mobile", name: "shopper", platform: "ios", appPath, templateDir }, ".");
 */
export class MaestroSmokeDriver extends Driver(SmokeDriver) {
  /** The target this driver checks. */
  override readonly target = "mobile";

  /** The command runner, `runCommand`; a test or a dry run replaces it. */
  run: CommandRunner = runCommand;

  /** Runs the app's launch check. */
  override async check(subject: SmokeSubject, repository: string): Promise<SmokeResult> {
    if (subject.target !== "mobile")
      throw new Error(`The mobile driver cannot check a ${subject.target} subject`);
    const { name: app, platform, appPath, templateDir } = subject;
    const job = launchCheckJob({ repository, app, platform, appPath, templateDir });
    const name = `${app} (${platform})`;
    try {
      await runLaunchCheck(job, repository, this.run);
      return { target: "mobile", name, passed: true, problems: [], evidence: job.reportDir };
    } catch (error) {
      const problem = error instanceof Error ? error.message : String(error);
      return {
        target: "mobile",
        name,
        passed: false,
        problems: [problem],
        evidence: job.reportDir,
      };
    }
  }
}
