/**
 * Stackra file contract:
 * Purpose: `EncoreCloudProviderDriver`, the `encore-cloud` driver of the `RunwayProvider` port: an Encore Cloud
 *          environment deploys the commit its branch points to, so apply pushes the commit to the branch on the app's
 *          `encore://<app>` remote, rollback force-pushes an earlier commit, current reads the branch, and verify reads
 *          the branch and then the deployment's `GET <origin>/readyz`.
 * Boundary: runs `git` through the given `CommandRunner` and one `GET` through `fetch`; the push credentials are the
 *           job's Encore login. The branch and origin are runway data: `encore.branch` / `encore.origin` of the
 *           environment, `encore.regions.<region>.*` for one region, or a dedicated deployment's own `encore` block.
 *           Without an origin verify checks the branch only. `/readyz` is @stackra/app's readiness route (STA-1379):
 *           every bound `HealthIndicator`, 503 when one is down.
 * Runtime: node
 * Governing contract: ADR 0352 (decision 3), ADR 0289 (decision 5: Encore Cloud), STA-136 (the generated app deploys
 *                     to Encore Cloud), ADR 0400, ADR 0190 (health), STA-1385 (verify reads /readyz).
 */
import { Driver } from "@stackra/container";
import { HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";

import type { RunwayConfig } from "#config/runway.config";
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

/** The readiness route of every Stackra server app (@stackra/app `answerProbe`). */
const READINESS_PATH = "/readyz";

/** `block[key]` when `block` is an object. */
function fieldOf(block: unknown, key: string): unknown {
  return typeof block === "object" && block !== null
    ? (block as Record<string, unknown>)[key]
    : undefined;
}

/**
 * The `encore-cloud` runway provider: deploys by pushing the commit to the environment's branch.
 *
 * @example
 * const encore = new EncoreCloudProviderDriver(
 *   buildConfig(RunwayConfig, { values: { encoreApp: root.providers?.encore?.app ?? "" } }),
 * );
 * await deploy(root, "staging", sha, [encore]);
 */
export class EncoreCloudProviderDriver extends Driver(RunwayProvider) {
  /** The runway destination this provider serves. */
  override readonly destination = "encore-cloud";

  /** The command runner, `runCommand`; a test or a dry run replaces it. */
  run: CommandRunner = runCommand;

  /** The HTTP client verify probes `/readyz` with; a test replaces it. */
  fetch: typeof globalThis.fetch = (input, init) => globalThis.fetch(input, init);

  private readonly remote: string;

  private readonly cwd: string | undefined;

  /**
   * @param config - holds the Encore Cloud app id (`encoreApp`, from `providers.encore.app`) and the git working
   *                 tree that holds the commits (`encoreCwd`; the current folder when empty).
   * @throws TypeError when the app id is unset or not one.
   */
  constructor(config: RunwayConfig) {
    super();
    if (!APP.test(config.encoreApp))
      throw new TypeError(
        `"${config.encoreApp}" is not an Encore Cloud app id (providers.encore.app)`,
      );
    this.remote = `encore://${config.encoreApp}`;
    this.cwd = config.encoreCwd || undefined;
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

  /** Up when the branch holds the record's commit and, when the target names an origin, `/readyz` answers 200. */
  override async verify(target: DeployTarget, record: DeployRecord): Promise<HealthReport> {
    const now = await this.current(target);
    if (now !== record.sha)
      return {
        status: HealthStatus.Down,
        detail: `${this.branchOf(target)} points to ${now ?? "nothing"}, not ${record.sha}`,
      };
    const origin = this.blockField(target, "origin");
    if (typeof origin !== "string" || origin === "") return { status: HealthStatus.Up };
    const url = `${origin.replace(/\/+$/, "")}${READINESS_PATH}`;
    try {
      const response = await this.fetch(url, { method: "GET" });
      return response.ok
        ? { status: HealthStatus.Up }
        : { status: HealthStatus.Down, detail: `${url} answered ${response.status}` };
    } catch (error) {
      // A failing check reports down, it never throws (RunwayProvider).
      return {
        status: HealthStatus.Down,
        detail: `${url} failed: ${error instanceof Error ? error.name : "error"}`,
      };
    }
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
    const branch = this.blockField(target, "branch");
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

  /** `key` of the target's region `encore` block, else of its `encore` block. */
  private blockField(target: DeployTarget, key: string): unknown {
    const encore = target.scope["encore"];
    const regional =
      target.region === undefined
        ? undefined
        : fieldOf(fieldOf(encore, "regions"), target.region.key);
    return fieldOf(regional, key) ?? fieldOf(encore, key);
  }
}
