/**
 * Stackra file contract:
 * Purpose: `RunwayPlanCommand`, `runway plan [env]`: what a deploy of `env` (default production) does, as JSON: each
 *          build-order target with its caller workflows, the CI secret names its jobs read and the member secret and
 *          var names a deploy syncs (`deployPlan`). The JSON is printed without `--json` too, as the binary always
 *          did; with `--json` it is the envelope's data.
 * Boundary: reads the runway files under the repository root; names only, never a value.
 * Runtime: node
 * Governing contract: ADR 0170; ADR 0506 (decision 8); STA-268; STA-2100.
 */
import { Argument, Command, type CommandIo } from "@stackra/console";

import { deployPlan } from "#node/functions/deploy-plan.function";
import { readRunways } from "#node/functions/read-runways.function";
import { repositoryRoot } from "#node/functions/repository-root.function";

/** Prints a deploy plan. */
export class RunwayPlanCommand extends Command({
  name: "plan",
  description: "Print what a deploy of an environment does, as JSON (names only)",
  examples: ["runway plan", "runway plan staging --json"],
}) {
  /** The environment to plan. */
  @Argument({
    description: "The environment (default production)",
    optional: true,
  })
  environment = "production";

  /**
   * Plans and returns the plan (the `--json` data).
   *
   * @throws Error when the root runway has no such environment.
   */
  handle(io: CommandIo): ReturnType<typeof deployPlan> {
    const plan = deployPlan(this.environment, readRunways(repositoryRoot(io.cwd)));
    if (!io.json) io.output.line(JSON.stringify(plan, null, 2));
    return plan;
  }
}
