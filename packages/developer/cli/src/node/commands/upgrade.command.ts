/**
 * Stackra file contract:
 * Purpose: `UpgradeCommand`, `stackra upgrade [--to <version>] [--from <version>] [--only a,b] [--dry-run] [--list]
 *          [--allow-dirty] [--no-install]`: moves a workspace from the `@stackra/*` version it pins to a release (by
 *          default this CLI's own version) in one mechanical step. It prints the upgrade note of every breaking
 *          release in between, moves every exact `@stackra/*` pin in package.json and pnpm-workspace.yaml, runs those
 *          releases' codemods over the source (ts-morph rewrites moved and renamed imports; ast-grep reports the code
 *          only a person can port), then runs `pnpm install`, each codemod's steps (such as `stackra encore:prepare`
 *          in every service) and `stackra gen`. The `--json` data is the plan, the edited files, the findings and the
 *          runs. Exit 0 when it finished (findings are printed as manual steps), 1 when a command failed, 2 on a usage
 *          or setup error.
 * Boundary: the work is `planUpgrade` and `collectSourceEdits`; this class prints, writes the edits and starts the
 *           commands through `io.process`. It refuses a working tree with uncommitted changes (`--allow-dirty` to
 *           override), so every edit can be reviewed and reverted with git. After a failed command it names the
 *           re-run (`--from <old> --to <new> --allow-dirty`), which runs the codemods again and every step. `--dry-run` writes and runs nothing;
 *           `--no-install` writes the edits and prints the commands instead of running them. Never reads or prints a
 *           secret; never reaches a registry itself (pnpm does, for the install).
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2: `stackra upgrade` applies codemods written with ast-grep and ts-morph);
 *                     ADR 0013 (decision 5: a note for each breaking release); ADR 0177 (decision 5); STA-145.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { cliVersion } from "#node/functions/cli-version.function";
import { lineDiff } from "#node/functions/line-diff.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import { UPGRADE_CODEMODS } from "#node/upgrade/constants/upgrade-codemods.constant";
import { collectSourceEdits } from "#node/upgrade/functions/collect-source-edits.function";
import { compareUpgradeVersions } from "#node/upgrade/functions/compare-upgrade-versions.function";
import { planUpgrade } from "#node/upgrade/functions/plan-upgrade.function";
import { upgradeStepRuns } from "#node/upgrade/functions/upgrade-step-runs.function";
import type { UpgradeFileEdit } from "#node/upgrade/types/upgrade-file-edit.type";
import type { UpgradePlan } from "#node/upgrade/types/upgrade-plan.type";
import type { UpgradeStepRun } from "#node/upgrade/types/upgrade-step-run.type";

/** Upgrades a workspace's `@stackra/*` packages. */
export class UpgradeCommand extends Command({
  name: "upgrade",
  description:
    "Move every @stackra/* pin to a release and run the codemods of the releases in between",
  bin: true,
}) {
  /** The target version. */
  @Option({ description: "The version to move to (default: this CLI's version)" })
  @Str
  to?: string;

  /** The version the workspace is on. */
  @Option({ description: "The version the workspace is on (default: its oldest @stackra/* pin)" })
  @Str
  from?: string;

  /** Only these codemods. */
  @Option({ description: "Only these codemods, comma-separated (see --list)" })
  @Str
  only?: string;

  /** Print, write nothing, run nothing. */
  @Option({ description: "Print the plan, the notes and every diff; write and run nothing" })
  dryRun = false;

  /** Print the codemods. */
  @Option({ description: "List every codemod with its release and exit" })
  list = false;

  /** Run on uncommitted changes. */
  @Option({ description: "Run on a working tree with uncommitted changes" })
  allowDirty = false;

  /** Run the commands after the edits. */
  @Option({
    description:
      "Run pnpm install, the codemod steps and stackra gen after the edits (--no-install prints them instead)",
  })
  install = true;

  /**
   * Plans, prints, writes and runs the upgrade; resolves with the exit code.
   *
   * @throws CliUsageError when a version is not exact, nothing is pinned and `--from` is missing, a pin is newer than
   *         the target, `--only` names an unknown codemod, or the working tree has uncommitted changes.
   */
  async handle(io: CommandIo): Promise<number> {
    if (this.list) return this.printCodemods(io);
    const root = workspaceRoot(io.cwd);
    const plan = usage(() =>
      planUpgrade(root, {
        to: this.to ?? cliVersion(),
        codemods: UPGRADE_CODEMODS,
        ...(this.from === undefined ? {} : { from: this.from }),
        ...(this.only === undefined
          ? {}
          : {
              only: this.only
                .split(",")
                .map((id) => id.trim())
                .filter(Boolean),
            }),
      }),
    );
    // Up to date only when nothing moves and no `--from` names an older version: a re-run after a failed step
    // (`--from <old> --allow-dirty`) runs the codemods again (they change nothing twice) and every step.
    if (plan.manifests.length === 0 && compareUpgradeVersions(plan.from, plan.to) === 0) {
      if (io.json) io.output.json({ from: plan.from, to: plan.to, upToDate: true });
      else io.output.success(`already on ${plan.to}: nothing to upgrade`);
      return 0;
    }
    if (!this.dryRun && !this.allowDirty) await refuseDirtyTree(io, root);
    const sources = await collectSourceEdits(root, plan.codemods);
    const edits = [...plan.manifests, ...sources.edits];
    const runs = upgradeStepRuns(plan.codemods, plan.services);
    if (!io.json) this.printPlan(io, plan, edits);
    if (!this.dryRun) for (const edit of edits) writeFileSync(join(root, edit.file), edit.after);
    const ran = this.dryRun || !this.install ? [] : await runSteps(io, root, runs);
    const failed = ran.find((run) => run.code !== 0);
    if (io.json)
      io.output.json({
        from: plan.from,
        to: plan.to,
        dryRun: this.dryRun,
        codemods: plan.codemods.map(({ id, version, title, note, source }) => ({
          id,
          version,
          title,
          note,
          source,
        })),
        edits: edits.map(({ file, by }) => ({ file, by })),
        findings: sources.findings,
        runs: this.dryRun || !this.install ? runs : ran,
      });
    else {
      if (sources.findings.length > 0) {
        io.output.title(`To change by hand (${sources.findings.length})`);
        for (const finding of sources.findings)
          io.output.warn(
            `${finding.file}:${finding.line}:${finding.column} [${finding.codemod}] ${finding.message}\n    ${finding.code}`,
          );
      }
      if (this.dryRun || !this.install) {
        io.output.title(this.dryRun ? "Would run" : "Run next");
        io.output.list(runs.map(describeRun));
      }
      if (failed !== undefined)
        io.output.error(
          `${describeRun(failed)} failed: the edits are written, ${runs
            .slice(ran.length)
            .map(describeRun)
            .join(
              "; ",
            )} did not run. Fix it, then finish with: stackra upgrade --from ${plan.from} --to ${plan.to} --allow-dirty`,
        );
      else if (!this.dryRun)
        io.output.success(
          `moved to ${plan.to}: ${edits.length} ${edits.length === 1 ? "file" : "files"} changed; review them with git diff`,
        );
    }
    return failed === undefined ? 0 : 1;
  }

  /** `--list`: every codemod, oldest release first. */
  private printCodemods(io: CommandIo): number {
    const rows = UPGRADE_CODEMODS.map(({ id, version, title }) => ({ version, id, title }));
    if (io.json) io.output.json(rows);
    else
      io.output.table(
        ["Release", "Codemod", "Change"],
        rows.map((row) => [row.version, row.id, row.title]),
      );
    return 0;
  }

  /** The plan, the upgrade notes and the edits (every diff under `--dry-run` or `--verbose`). */
  private printPlan(io: CommandIo, plan: UpgradePlan, edits: readonly UpgradeFileEdit[]): void {
    io.output.title(`stackra upgrade ${plan.from} → ${plan.to}${this.dryRun ? " (dry run)" : ""}`);
    if (plan.codemods.length === 0)
      io.output.info(
        `no release after ${plan.from} up to ${plan.to} has an upgrade entry: only the @stackra/* versions move`,
      );
    for (const codemod of plan.codemods)
      io.output.note(codemod.note, "info", `${codemod.version} · ${codemod.id}: ${codemod.title}`);
    io.output.title(`Files (${edits.length})`);
    io.output.list(edits.map((edit) => `${edit.file}  (${edit.by.join(", ")})`));
    if (this.dryRun || io.verbose)
      for (const edit of edits) {
        io.output.line(`--- ${edit.file}`);
        for (const line of lineDiff(edit.before, edit.after)
          .trimEnd()
          .split("\n")
          .filter((diff) => diff.startsWith("+") || diff.startsWith("-")))
          io.output.line(line);
      }
  }
}

/** A run as one line: `pnpm install` or `services/orders: pnpm exec stackra encore:prepare`. */
function describeRun(run: UpgradeStepRun): string {
  return `${run.cwd === "." ? "" : `${run.cwd}: `}${run.command.join(" ")}`;
}

/** Runs each command in order and stops at the first that fails; answers each run with its exit code. */
async function runSteps(
  io: CommandIo,
  root: string,
  runs: readonly UpgradeStepRun[],
): Promise<readonly (UpgradeStepRun & { readonly code: number })[]> {
  const done: (UpgradeStepRun & { readonly code: number })[] = [];
  for (const run of runs) {
    const [program = "", ...args] = run.command;
    let code = 0;
    try {
      await io.output.task(describeRun(run), () =>
        io.process.run(program, args, { cwd: join(root, run.cwd) }),
      );
    } catch {
      code = 1;
    }
    done.push({ ...run, code });
    if (code !== 0) break;
  }
  return done;
}

/**
 * Refuses uncommitted changes, so the upgrade's edits are the only ones git shows.
 *
 * @throws CliUsageError when `git status` lists a change or the root is not in a git repository.
 */
async function refuseDirtyTree(io: CommandIo, root: string): Promise<void> {
  const status = await io.process.run("git", ["status", "--porcelain"], {
    cwd: root,
    check: false,
  });
  if (status.code !== 0)
    throw new CliUsageError(
      `${root} is not in a git repository, so the edits could not be reviewed or reverted: pass --allow-dirty to run anyway`,
    );
  if (status.output.trim() !== "")
    throw new CliUsageError(
      "the working tree has uncommitted changes: commit or stash them first, or pass --allow-dirty",
    );
}

/** Runs a planner; whatever it refuses is a usage error (exit 2). */
function usage<T>(plan: () => T): T {
  try {
    return plan();
  } catch (error) {
    throw error instanceof CliUsageError ? error : new CliUsageError((error as Error).message);
  }
}
