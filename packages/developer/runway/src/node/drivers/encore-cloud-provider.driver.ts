/**
 * Stackra file contract:
 * Purpose: `EncoreCloudProviderDriver`, the `encore-cloud` driver of the `RunwayProvider` port: an Encore Cloud
 *          environment deploys the commit its branch points to, so apply pushes to the branch on the app's
 *          `encore://<app>` remote, rollback force-pushes an earlier deploy, current reads the branch, and verify reads
 *          the branch and then polls the deployment's `GET <origin>/readyz` while Encore builds. The generated app is gitignored, so when the
 *          working tree holds one, apply pushes its deploy commit (`encoreDeployTree`: the source commit plus the
 *          generated app) and records that commit as the deploy's reference; without one it pushes the commit as is.
 * Boundary: runs `git` through the given `CommandRunner` and `GET`s through `fetch`; the push credentials are the
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
import { encoreDeployTree } from "#node/functions/encore-deploy-tree.function";
import { runProgram } from "#node/functions/run-program.function";
import type { CommandRunner } from "#node/types/command-runner.type";

/** An Encore Cloud app id. */
const APP = /^[a-z0-9][a-z0-9-]*$/;

/** A branch name git and a refspec accept without quoting. */
const BRANCH = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

/** A full git commit id. */
const COMMIT = /^[0-9a-f]{40}$/;

/** The commit a record put on the branch: its reference when that is a commit (a deploy commit), else its sha. */
const pushedOf = (record: DeployRecord): string =>
  COMMIT.test(record.reference) ? record.reference : record.sha;

/** The readiness route of every Stackra server app (@stackra/app `answerProbe`). */
const READINESS_PATH = "/readyz";

/** How long verify waits for `/readyz` while Encore builds, unless `encore.readyTimeoutMinutes` says otherwise. */
const READY_TIMEOUT_MINUTES = 15;

/** The first wait between `/readyz` polls; each wait doubles, up to the last. */
const READY_POLL_MS = { first: 5000, last: 60_000 };

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

  /** The command runner, `runProgram`; a test or a dry run replaces it. */
  run: CommandRunner = runProgram;

  /** The HTTP client verify probes `/readyz` with; a test replaces it. */
  fetch: typeof globalThis.fetch = (input, init) => globalThis.fetch(input, init);

  /** Waits between `/readyz` polls; a test replaces it. */
  sleep: (ms: number) => Promise<void> = (ms) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  /** The clock the poll's timeout reads; a test replaces it. */
  now: () => number = () => Date.now();

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

  /** Pushes the deploy commit of `sha` (or `sha` itself when no generated app is present); Encore Cloud builds it. */
  override async apply(target: DeployTarget, sha: string): Promise<DeployRecord> {
    const tree = await encoreDeployTree({
      repository: this.cwd ?? process.cwd(),
      sha,
      run: this.run,
    });
    if (tree === undefined) {
      for (const step of this.plan(target, sha))
        await this.run(step.command, step.args, { cwd: this.cwd });
      return { target: target.id, sha, reference: sha };
    }
    try {
      // Each deploy commit sits on its own source commit, so the branch moves by force.
      await this.run(
        "git",
        ["push", this.remote, `+${tree.sha}:refs/heads/${this.branchOf(target)}`],
        { cwd: this.cwd },
      );
    } finally {
      await tree.dispose();
    }
    return { target: target.id, sha, reference: tree.sha };
  }

  /**
   * Up when the branch holds the record's commit and, when the target names an origin, `/readyz` answers 2xx. Encore
   * Cloud builds after the push, so until then `/readyz` answers 404 ("application not found"), a 5xx or nothing:
   * verify polls it with backoff for `encore.readyTimeoutMinutes` (15 by default) and reports the last answer.
   */
  override async verify(target: DeployTarget, record: DeployRecord): Promise<HealthReport> {
    const now = await this.current(target);
    const pushed = pushedOf(record);
    if (now !== pushed)
      return {
        status: HealthStatus.Down,
        detail: `${this.branchOf(target)} points to ${now ?? "nothing"}, not ${pushed}`,
      };
    const origin = this.blockField(target, "origin");
    if (typeof origin !== "string" || origin === "") return { status: HealthStatus.Up };
    const url = `${origin.replace(/\/+$/, "")}${READINESS_PATH}`;
    const minutes = this.blockField(target, "readyTimeoutMinutes");
    const deadline =
      this.now() + (typeof minutes === "number" ? minutes : READY_TIMEOUT_MINUTES) * 60_000;
    // shortcut: polls the app, not Encore's build status; read the deploy from Encore's API if it gains a public one.
    for (let wait = READY_POLL_MS.first; ; wait = Math.min(wait * 2, READY_POLL_MS.last)) {
      const detail = await this.probe(url);
      if (detail === undefined) return { status: HealthStatus.Up };
      if (this.now() + wait > deadline) return { status: HealthStatus.Down, detail };
      await this.sleep(wait);
    }
  }

  /** Force-pushes the earlier deploy (its deploy commit when it had one) to the branch. */
  override async rollback(target: DeployTarget, to: DeployRecord): Promise<DeployRecord> {
    const pushed = pushedOf(to);
    await this.run("git", ["push", this.remote, `+${pushed}:refs/heads/${this.branchOf(target)}`], {
      cwd: this.cwd,
    });
    return { target: target.id, sha: to.sha, reference: pushed };
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

  /** One `/readyz` read: `undefined` when it answers 2xx, else what went wrong. Never throws (RunwayProvider). */
  private async probe(url: string): Promise<string | undefined> {
    try {
      const response = await this.fetch(url, { method: "GET" });
      return response.ok ? undefined : `${url} answered ${response.status}`;
    } catch (error) {
      return `${url} failed: ${error instanceof Error ? error.name : "error"}`;
    }
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
