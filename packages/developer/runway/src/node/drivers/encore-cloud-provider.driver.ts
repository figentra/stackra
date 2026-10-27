/**
 * Stackra file contract:
 * Purpose: `EncoreCloudProviderDriver`, the `encore-cloud` driver of the `RunwayProvider` port: an Encore Cloud
 *          environment deploys the commit its branch points to, so apply pushes the commit to the branch on the app's
 *          `encore://<app>` remote, rollback force-pushes an earlier commit, and current and verify read the branch.
 * Boundary: runs `git` only, through the given `CommandRunner`; the push credentials are the job's Encore login. The
 *           branch is runway data: `encore.branch` of the environment, `encore.regions.<region>.branch` for one
 *           region, or a dedicated deployment's own `encore` block. Verify checks the branch holds the commit; whether
 *           the build serves is the environment's post-deploy gate (`deploy.gate`), run once Encore Cloud finishes.
 * Runtime: node
 * Governing contract: ADR 0352 (decision 3), ADR 0289 (decision 5: Encore Cloud), STA-136 (the generated app deploys
 *                     to Encore Cloud), ADR 0400.
 */
import { Driver } from "@stackra/container";
import { HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayProvider } from "#core/ports/runway-provider.port";
import type { DeployRecord } from "#core/types/deploy-record.type";
import type { DeployStep } from "#core/types/deploy-step.type";
import type { DeployTarget } from "#core/types/deploy-target.type";
import { runCommand } from "#node/functions/run-command.function";
import type { CommandRunner } from "#node/types/command-runner.type";

/** An Encore Cloud app id. */
const APP = /^[a-z0-9][a-z0-9-]*$/;

/** A branch name git and a refspec accept without quoting. */
const BRANCH = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

/** `block[key]` when `block` is an object. */
function fieldOf(block: unknown, key: string): unknown {
  return typeof block === "object" && block !== null
    ? (block as Record<string, unknown>)[key]
    : undefined;
}

/**
 * Deploys to Encore Cloud.
 *
 * @example
 * const encore = new EncoreCloudProviderDriver({ app: root.providers?.encore?.app ?? "" });
 * await deploy(root, "staging", sha, [encore]);
 */
export class EncoreCloudProviderDriver extends Driver(RunwayProvider) {
  override readonly destination = "encore-cloud";

  private readonly remote: string;

  private readonly run: CommandRunner;

  private readonly cwd: string | undefined;

  /**
   * @param options.app - the Encore Cloud app id (`providers.encore.app`).
   * @param options.run - the command runner; `runCommand` when absent.
   * @param options.cwd - the git working tree that holds the commits; the current folder when absent.
   * @throws TypeError when the app id is not one.
   */
  constructor(options: {
    readonly app: string;
    readonly run?: CommandRunner;
    readonly cwd?: string;
  }) {
    super();
    if (!APP.test(options.app))
      throw new TypeError(`"${options.app}" is not an Encore Cloud app id (providers.encore.app)`);
    this.remote = `encore://${options.app}`;
    this.run = options.run ?? runCommand;
    this.cwd = options.cwd;
  }

  /** The push of `sha` to the target's branch. */
  override plan(target: DeployTarget, sha: string): readonly DeployStep[] {
    return [
      { command: "git", args: ["push", this.remote, `${sha}:refs/heads/${this.branchOf(target)}`] },
    ];
  }

  /** Pushes `sha`; Encore Cloud builds and deploys it. */
  override async apply(target: DeployTarget, sha: string): Promise<DeployRecord> {
    for (const step of this.plan(target, sha))
      await this.run(step.command, step.args, { cwd: this.cwd });
    return { target: target.id, sha, reference: sha };
  }

  /** Up when the branch holds the record's commit. */
  override async verify(target: DeployTarget, record: DeployRecord): Promise<HealthReport> {
    const now = await this.current(target);
    return now === record.sha
      ? { status: HealthStatus.Up }
      : {
          status: HealthStatus.Down,
          detail: `${this.branchOf(target)} points to ${now ?? "nothing"}, not ${record.sha}`,
        };
  }

  /** Force-pushes the earlier commit to the branch. */
  override async rollback(target: DeployTarget, to: DeployRecord): Promise<DeployRecord> {
    await this.run("git", ["push", this.remote, `+${to.sha}:refs/heads/${this.branchOf(target)}`], {
      cwd: this.cwd,
    });
    return { target: target.id, sha: to.sha, reference: to.sha };
  }

  /** The commit the branch points to. */
  override async current(target: DeployTarget): Promise<string | null> {
    const out = await this.run(
      "git",
      ["ls-remote", this.remote, `refs/heads/${this.branchOf(target)}`],
      {
        cwd: this.cwd,
      },
    );
    return /^([0-9a-f]{40})\s/.exec(out)?.[1] ?? null;
  }

  /** The branch the target's Encore Cloud environment deploys from. */
  private branchOf(target: DeployTarget): string {
    const encore = target.scope["encore"];
    const regional =
      target.region === undefined
        ? undefined
        : fieldOf(fieldOf(encore, "regions"), target.region.key);
    const branch = fieldOf(regional, "branch") ?? fieldOf(encore, "branch");
    if (typeof branch === "string" && BRANCH.test(branch)) return branch;
    const path =
      target.dedicated === undefined
        ? `environments.${target.environment}.encore`
        : `environments.${target.environment}.dedicated.${target.dedicated.key}.encore`;
    throw new RunwayInvalidError("runway.yaml", [
      {
        path: `${path}.branch`,
        message: "Name the branch this Encore Cloud environment deploys from",
      },
    ]);
  }
}
