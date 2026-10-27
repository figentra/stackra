/**
 * Stackra file contract:
 * Purpose: `MintlifyProviderDriver`, the `mintlify` driver of the `RunwayProvider` port for a docs app in the clean
 *          layout (ADR 0002 amendment of 2026-10-27): from a checkout of the release commit, apply runs the member's
 *          `stackra build` (gen assembles `.stackra/site/`, then `mint validate`) and `stackra lint`
 *          (`mint broken-links`, `mint a11y`), commits the generated site as one orphan commit carrying a
 *          `Source: <sha>` trailer, and force-pushes it to the deploy branch (`targets.mintlify.branch`) that the
 *          Mintlify GitHub app builds; verify and current read that trailer back from the branch. Rollback refuses:
 *          the deploy branch keeps no history, so the release skill promotes the last good SHA, which rebuilds it.
 * Boundary: runs `git` and `stackra` only, through the given `CommandRunner`; the push uses the job's checkout
 *           credentials, never an argument, and no Mintlify key is read here (the Mintlify GitHub app deploys the
 *           branch). The branch is runway data, never hard-coded. Agents and tests never apply against a real remote
 *           (ADR 0352 decision 6): plans only until the owner switches the GitHub app to the deploy branch.
 * Runtime: node
 * Governing contract: ADR 0352 (decision 3); ADR 0299 (CI deploys after the checks); ADR 0002 (2026-10-27
 *                     amendment: runway publishes `.stackra/site`); STA-1316.
 */
import { HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { RunwayProvider } from "#core/ports/runway-provider.port";
import type { DeployRecord } from "#core/types/deploy-record.type";
import type { DeployStep } from "#core/types/deploy-step.type";
import type { DeployTarget } from "#core/types/deploy-target.type";
import { runCommand } from "#node/functions/run-command.function";
import type { CommandRunner } from "#node/types/command-runner.type";

/** A branch name git and Mintlify accept. */
const BRANCH = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

/** The generated Mintlify root of the docs member (`DOCS_SITE_DIR` of `@stackra/gen`). */
const SITE_DIR = ".stackra/site";

/** The trailer that ties a site commit to the release commit it was built from. */
const TRAILER = "Source";

/**
 * Publishes a docs app's generated site to the deploy branch Mintlify builds.
 *
 * @example
 * const mintlify = new MintlifyProviderDriver({ projectDir: "apps/docs" });
 * mintlify.plan(target, sha); // stackra build, stackra lint, git init/add/commit, git fetch, git push
 */
export class MintlifyProviderDriver extends RunwayProvider {
  override readonly destination = "mintlify";

  private readonly projectDir: string;

  private readonly run: CommandRunner;

  /**
   * @param options.projectDir - the docs app's folder, relative to the repository root.
   * @param options.run - the command runner; `runCommand` when absent.
   */
  constructor(options: { readonly projectDir: string; readonly run?: CommandRunner }) {
    super();
    this.projectDir = options.projectDir;
    this.run = options.run ?? runCommand;
  }

  /** Build and check the site, commit it as one orphan commit, and push it to the deploy branch. */
  override plan(target: DeployTarget, sha: string): readonly DeployStep[] {
    const branch = this.branchOf(target);
    const site = `${this.projectDir}/${SITE_DIR}`;
    return [
      { command: "stackra", args: ["build"], cwd: this.projectDir },
      { command: "stackra", args: ["lint"], cwd: this.projectDir },
      { command: "git", args: ["init", "--quiet", "--initial-branch", branch], cwd: site },
      { command: "git", args: ["add", "--all"], cwd: site },
      {
        command: "git",
        args: [
          "-c",
          "user.name=stackra-runway",
          "-c",
          "user.email=runway@users.noreply.github.com",
          "commit",
          "--quiet",
          "--message",
          `docs: site of ${sha}\n\n${TRAILER}: ${sha}`,
        ],
        cwd: site,
      },
      {
        command: "git",
        args: ["fetch", "--quiet", "--force", site, `${branch}:refs/heads/${branch}`],
      },
      { command: "git", args: ["push", "--quiet", "--force", "origin", `refs/heads/${branch}`] },
    ];
  }

  /** Runs the plan from the checked-out commit, which must be `sha`. */
  override async apply(target: DeployTarget, sha: string): Promise<DeployRecord> {
    const head = (await this.run("git", ["rev-parse", "HEAD"], {})).trim();
    if (head !== sha)
      throw new RunwayUnresolvedError(
        `the docs site is built from the checked-out tree: check out ${sha} (now ${head})`,
      );
    for (const step of this.plan(target, sha))
      await this.run(step.command, step.args, { cwd: step.cwd });
    return { target: target.id, sha, reference: this.branchOf(target) };
  }

  /** Up when the deploy branch carries the site of `record.sha`. */
  override async verify(target: DeployTarget, record: DeployRecord): Promise<HealthReport> {
    const current = await this.current(target);
    return current === record.sha
      ? { status: HealthStatus.Up }
      : {
          status: HealthStatus.Down,
          detail: `${this.branchOf(target)} carries ${current ?? "nothing"}, not ${record.sha}`,
        };
  }

  /** Refuses: the deploy branch is rebuilt, never rewound. */
  override rollback(target: DeployTarget, to: DeployRecord): Promise<DeployRecord> {
    return Promise.reject(
      new RunwayUnresolvedError(
        `${target.id} keeps no site history: promote ${to.sha} to rebuild and publish it again`,
      ),
    );
  }

  /** The release commit whose site the deploy branch carries, or `null` when the branch does not exist. */
  override async current(target: DeployTarget): Promise<string | null> {
    const branch = this.branchOf(target);
    try {
      await this.run("git", ["fetch", "--quiet", "origin", `refs/heads/${branch}`], {});
    } catch {
      return null;
    }
    const sha = (
      await this.run(
        "git",
        ["log", "-1", `--format=%(trailers:key=${TRAILER},valueonly)`, "FETCH_HEAD"],
        {},
      )
    ).trim();
    return sha === "" ? null : sha;
  }

  /** `targets.mintlify.branch`, checked. */
  private branchOf(target: DeployTarget): string {
    const branch = target.settings["branch"];
    if (typeof branch !== "string" || !BRANCH.test(branch) || branch.includes(".."))
      throw new RunwayInvalidError("runway.yaml", [
        {
          path: "targets.mintlify.branch",
          message: "Name the deploy branch the Mintlify GitHub app builds",
        },
      ]);
    return branch;
  }
}
