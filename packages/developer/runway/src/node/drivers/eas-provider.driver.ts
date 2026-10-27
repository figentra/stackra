/**
 * Stackra file contract:
 * Purpose: `EasProviderDriver`, the `eas` driver of the `RunwayProvider` port: from a checkout of the release commit,
 *          apply starts an EAS build of the environment's profile (`targets.eas.release: build`, the default) or
 *          publishes an over-the-air update to its channel (`release: update`); verify reads the build or update;
 *          rollback republishes an earlier update group; current reads the commit of the latest build or update.
 * Boundary: runs `git` and `eas` only, through the given `CommandRunner`, in the app's folder; the EAS login is the
 *           job's `EXPO_TOKEN`, never an argument. The profile is `mobile.profile`, else `mobile.channel`, of the
 *           environment (the update channel is the profile name). A store build cannot be rolled back: rollback
 *           refuses it, and the release skill ships a fix forward or an update instead.
 * Runtime: node
 * Governing contract: ADR 0352 (decision 3), ADR 0180 and ADR 0344 (EAS builds and updates), ADR 0170 (rollback).
 */
import { Driver } from "@stackra/container";
import { HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";

import type { RunwayConfig } from "#config/runway.config";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { RunwayProvider } from "#core/ports/runway-provider.port";
import type { DeployRecord } from "#core/types/deploy-record.type";
import type { DeployStep } from "#core/types/deploy-step.type";
import type { DeployTarget } from "#core/types/deploy-target.type";
import { runCommand } from "#node/functions/run-command.function";
import type { CommandRunner } from "#node/types/command-runner.type";

/** A profile or channel name EAS accepts. */
const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** The platforms `eas build --platform` takes. */
const PLATFORMS = ["all", "ios", "android"];

/** The build states that end a build, and what each means. */
const FINISHED = new Map([
  ["FINISHED", HealthStatus.Up],
  ["ERRORED", HealthStatus.Down],
  ["CANCELED", HealthStatus.Down],
]);

/** `block[key]` when `block` is an object. */
function fieldOf(block: unknown, key: string): unknown {
  return typeof block === "object" && block !== null
    ? (block as Record<string, unknown>)[key]
    : undefined;
}

/** The items of an EAS `--json` answer: an array, or a page of them. */
function itemsOf(out: string): Record<string, unknown>[] {
  const value: unknown = JSON.parse(out);
  const items = Array.isArray(value) ? value : fieldOf(value, "currentPage");
  return Array.isArray(items)
    ? (items as Record<string, unknown>[])
    : [value as Record<string, unknown>];
}

/**
 * The `eas` runway provider: builds or publishes over-the-air updates through EAS.
 *
 * @example
 * const eas = new EasProviderDriver(buildConfig(RunwayConfig));
 * await deploy(root, "production", sha, [encore, eas]);
 */
export class EasProviderDriver extends Driver(RunwayProvider) {
  /** The runway destination this provider serves. */
  override readonly destination = "eas";

  /** The command runner, `runCommand`; a test or a dry run replaces it. */
  run: CommandRunner = runCommand;

  /** The folder the commands run in, `easProjectDir`; the mobile job points it at its template checkout. */
  projectDir: string;

  /**
   * @param config - holds the mobile app's folder (`easProjectDir`), relative to the repository root.
   */
  constructor(config: RunwayConfig) {
    super();
    this.projectDir = config.easProjectDir;
  }

  /** The build or update command. */
  override plan(target: DeployTarget, sha: string): readonly DeployStep[] {
    const { profile, update, platform } = this.optionsOf(target);
    const args = update
      ? ["update", "--channel", profile, "--message", sha, "--non-interactive", "--json"]
      : [
          "build",
          "--profile",
          profile,
          "--platform",
          platform,
          "--non-interactive",
          "--no-wait",
          "--json",
        ];
    return [{ command: "eas", args, cwd: this.projectDir }];
  }

  /** Starts the build or publishes the update from the checked-out commit, which must be `sha`. */
  override async apply(target: DeployTarget, sha: string): Promise<DeployRecord> {
    const head = (await this.run("git", ["rev-parse", "HEAD"], { cwd: this.projectDir })).trim();
    if (head !== sha)
      throw new RunwayUnresolvedError(
        `EAS ships the checked-out tree: check out ${sha} (now ${head})`,
      );
    const [step] = this.plan(target, sha);
    const out =
      step === undefined ? "[]" : await this.run(step.command, step.args, { cwd: step.cwd });
    const key = this.optionsOf(target).update ? "group" : "id";
    const reference = [...new Set(itemsOf(out).map((item) => String(item[key])))].join(",");
    return { target: target.id, sha, reference };
  }

  /** Up when every build finished (degraded while one runs) or the update group exists. */
  override async verify(target: DeployTarget, record: DeployRecord): Promise<HealthReport> {
    if (this.optionsOf(target).update) {
      const out = await this.run("eas", ["update:view", record.reference, "--json"], {
        cwd: this.projectDir,
      });
      return itemsOf(out).length > 0
        ? { status: HealthStatus.Up }
        : { status: HealthStatus.Down, detail: `update group ${record.reference} was not found` };
    }
    let report: HealthReport = { status: HealthStatus.Up };
    for (const id of record.reference.split(",")) {
      const out = await this.run("eas", ["build:view", id, "--json"], { cwd: this.projectDir });
      const status = String(itemsOf(out)[0]?.["status"]);
      const state = FINISHED.get(status) ?? HealthStatus.Degraded;
      if (state === HealthStatus.Down) return { status: state, detail: `build ${id} is ${status}` };
      if (state === HealthStatus.Degraded)
        report = { status: state, detail: `build ${id} is ${status}` };
    }
    return report;
  }

  /** Republishes the earlier update group; a store build refuses. */
  override async rollback(target: DeployTarget, to: DeployRecord): Promise<DeployRecord> {
    if (!this.optionsOf(target).update)
      throw new RunwayUnresolvedError(
        `${target.id} ships store builds, which cannot be rolled back: publish an update or ship a fix forward`,
      );
    const out = await this.run(
      "eas",
      ["update:republish", "--group", to.reference, "--non-interactive", "--json"],
      { cwd: this.projectDir },
    );
    const group = itemsOf(out)[0]?.["group"];
    return {
      target: target.id,
      sha: to.sha,
      reference: typeof group === "string" ? group : to.reference,
    };
  }

  /** The commit of the latest build of the profile, or the latest update on its channel. */
  override async current(target: DeployTarget): Promise<string | null> {
    const { profile, update } = this.optionsOf(target);
    const args = update
      ? ["update:list", "--branch", profile, "--limit", "1", "--json", "--non-interactive"]
      : ["build:list", "--profile", profile, "--limit", "1", "--json", "--non-interactive"];
    const hash = itemsOf(await this.run("eas", args, { cwd: this.projectDir }))[0]?.[
      "gitCommitHash"
    ];
    return typeof hash === "string" ? hash : null;
  }

  /** The profile, the release mode and the platform of `target`. */
  private optionsOf(target: DeployTarget): { profile: string; update: boolean; platform: string } {
    const mobile = target.scope["mobile"];
    const profile = fieldOf(mobile, "profile") ?? fieldOf(mobile, "channel");
    const release = target.settings["release"] ?? "build";
    const platform = target.settings["platform"] ?? "all";
    const issues = [
      ...(typeof profile === "string" && NAME.test(profile)
        ? []
        : [
            {
              path: `environments.${target.environment}.mobile.channel`,
              message: "Name the EAS profile and channel",
            },
          ]),
      ...(release === "build" || release === "update"
        ? []
        : [{ path: "targets.eas.release", message: "Expected build or update" }]),
      ...(typeof platform === "string" && PLATFORMS.includes(platform)
        ? []
        : [{ path: "targets.eas.platform", message: `Expected one of ${PLATFORMS.join(", ")}` }]),
    ];
    if (issues.length > 0) throw new RunwayInvalidError("runway.yaml", issues);
    return {
      profile: profile as string,
      update: release === "update",
      platform: platform as string,
    };
  }
}
