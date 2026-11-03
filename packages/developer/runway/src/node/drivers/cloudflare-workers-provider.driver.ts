/**
 * Stackra file contract:
 * Purpose: `CloudflareWorkersProviderDriver`, the `cloudflare-workers` driver of the `RunwayProvider` port: from a
 *          checkout of the release commit it builds each Worker member of `targets.cloudflare-workers.members` that
 *          ships under the target's kind, swaps the placeholder binding ids in its `wrangler.jsonc` for the real ones
 *          (restored afterwards), applies its D1 migrations, renders the operational settings of runway.yaml into it (ADR 0519), uploads a version (`wrangler versions upload --message <sha>`) with its
 *          secrets on stdin, smoke-tests it at 0% by version override, then moves traffic to it in the member's `rollout`
 *          steps (production only), smoke-testing after each hold and putting the previous version back at 100% on a
 *          failure; a member with Durable Object migrations goes out through `wrangler deploy` at 100% instead. Current reads the commit back from `wrangler deployments list`, verify adds each
 *          member's smoke URL, and rollback returns every member to the version recorded for a commit.
 * Boundary: runs `pnpm` (turbo and each member's own wrangler) through the given `CommandRunner`; wrangler logs in
 *           with the job's `CLOUDFLARE_API_TOKEN` (OIDC from Infisical in CI) or the owner's session. Ids, vars and
 *           secrets are read by name from `env`; a secret value goes to wrangler on stdin only, never as an argument,
 *           a file or a log line. Agents and tests never apply against a real account (ADR 0352 decision 6).
 * Runtime: node
 * Governing contract: ADR 0352 (decisions 1, 3 and 6); ADR 0284 (Workers members); ADR 0173 (no secret is an
 *                     argument); ADR 0294 R3 and ADR 0305 rule 3 (the `Driver(Port)` base); STA-1921; ADR 0519; STA-1989, STA-1990.
 */
import { existsSync, readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { Driver } from "@stackra/container";
import { HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";
import type { z } from "zod";

import { CLOUDFLARE_WORKERS_SETTINGS_SCHEMA } from "#core/constants/cloudflare-workers-settings-schema.constant";
import { RunwayDeployFailedError } from "#core/errors/runway-deploy-failed.error";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { renderWranglerConfig } from "#core/functions/render-wrangler-config.function";
import { workerSettingsOf } from "#core/functions/worker-settings-of.function";
import { RunwayProvider } from "#core/ports/runway-provider.port";
import type { DeployRecord } from "#core/types/deploy-record.type";
import type { DeployStep } from "#core/types/deploy-step.type";
import type { DeployTarget } from "#core/types/deploy-target.type";
import { runCommand } from "#node/functions/run-command.function";
import type { CommandRunner } from "#node/types/command-runner.type";

/** One parsed member of `targets.cloudflare-workers.members`. */
type Member = z.output<typeof CLOUDFLARE_WORKERS_SETTINGS_SCHEMA>["members"][string];

/** The member's own wrangler, from its `catalog:deploy` dev dependency. */
const WRANGLER = ["exec", "wrangler"] as const;

/** A full commit SHA: the message of every deployment this provider makes. */
const SHA = /^[0-9a-f]{40}$/;

/** A binding id wrangler accepts (a D1 uuid, a 32-hex KV namespace); nothing that could break out of a JSON string. */
const ID = /^[A-Za-z0-9-]+$/;

/** The version line `wrangler versions upload` ("Worker Version ID") and `wrangler deploy` ("Current Version ID") print. */
const VERSION = /(?:Worker|Current) Version ID:\s*([0-9a-f-]{36})/;

/** How long a gradual rollout holds each partial step. */
const ROLLOUT_HOLD_MS = 5 * 60_000;

/** A string, or a `//` or `/* *\/` comment; the strings are kept. */
const JSONC_TOKEN = /("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g;

/**
 * Whether a rendered wrangler config ships Durable Object migrations. "Versions of Worker bundles that change Durable
 * Object class lifecycle cannot be uploaded"; apply them with `wrangler deploy`
 * (developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/with-durable-objects/). So such a
 * member goes out at 100% that way (ADR 0519 decision 3).
 */
function migrates(config: { migrations?: unknown }): boolean {
  // shortcut: any `migrations` array takes this path, applied or not; diff the tags against the live ones to split again.
  return config.migrations !== undefined;
}

/** Where the settings live in runway.yaml. */
const SETTINGS_PATH = "targets.cloudflare-workers";

/**
 * Deploys the Worker members of a runway target with wrangler.
 *
 * @example
 * const workers = new CloudflareWorkersProviderDriver();
 * workers.only = ["registry"];
 * await workers.apply(target, sha); // { target, sha, reference: "registry=<version id>" }
 */
export class CloudflareWorkersProviderDriver extends Driver(RunwayProvider) {
  /** The runway destination this provider serves. */
  override readonly destination = "cloudflare-workers";

  /** The command runner, `runCommand`; a test or a dry run replaces it. */
  run: CommandRunner = runCommand;

  /** The environment ids, vars and secrets are read from; a test replaces it. */
  env: Readonly<Record<string, string | undefined>> = process.env;

  /** The smoke request; a test replaces it. */
  fetch: (
    url: string,
    headers?: Record<string, string>,
  ) => Promise<{ readonly ok: boolean; readonly status: number }> = (url, headers) =>
    globalThis.fetch(url, {
      ...(headers ? { headers } : {}),
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
    });

  /** Holds a partial rollout step, in milliseconds; a test replaces it. */
  sleep: (ms: number) => Promise<void> = (ms) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  /** The repository root the member paths are relative to. */
  root = ".";

  /** The member keys to ship; empty ships every member of the target's kind. */
  only: readonly string[] = [];

  /** Per member: build, migrate, upload a version (with its secrets), deploy it (the id swap and its restore are file edits, not commands). */
  override plan(target: DeployTarget, sha: string): readonly DeployStep[] {
    return this.membersOf(target).flatMap(([key, member]) => {
      const cwd = join(this.root, member.path);
      const config = join(cwd, "wrangler.jsonc");
      // Without the file (a plan away from the checkout) the member plans the versioned path.
      const migrating =
        existsSync(config) &&
        migrates(
          JSON.parse(this.render(target, key, readFileSync(config, "utf8"))) as {
            migrations?: unknown;
          },
        );
      return [
        { command: "pnpm", args: this.buildArgs(member), cwd: this.root },
        ...member.d1.map((database) => ({
          command: "pnpm",
          args: [...WRANGLER, "d1", "migrations", "apply", database, "--remote"],
          cwd,
        })),
        {
          command: "pnpm",
          args: this.uploadArgs(member, sha, (name) => `$${name}`, migrating),
          cwd,
        },
        ...(migrating
          ? []
          : [{ command: "pnpm", args: this.deployVersionArgs([["$VERSION", 100]], sha), cwd }]),
      ];
    });
  }

  /** Runs the plan from the checked-out commit, which must be `sha`; every id and secret must be set first. */
  override async apply(target: DeployTarget, sha: string): Promise<DeployRecord> {
    const head = (await this.run("git", ["rev-parse", "HEAD"], {})).trim();
    if (head !== sha)
      throw new RunwayUnresolvedError(
        `Workers are built from the checked-out tree: check out ${sha} (now ${head})`,
      );
    const members = this.membersOf(target);
    for (const [key, member] of members) this.checkValues(key, member);

    const versions: string[] = [];
    for (const [key, member] of members) {
      const cwd = join(this.root, member.path);
      await this.run("pnpm", this.buildArgs(member), { cwd: this.root });
      const config = join(cwd, "wrangler.jsonc");
      const original = await readFile(config, "utf8");
      const swapped = this.render(target, key, this.withIds(key, member, original));
      try {
        if (swapped !== original) await writeFile(config, swapped);
        for (const database of member.d1)
          await this.run("pnpm", [...WRANGLER, "d1", "migrations", "apply", database, "--remote"], {
            cwd,
          });
        // `render` already stripped the JSONC comments and trailing commas: `swapped` is strict JSON.
        const deployed = JSON.parse(swapped) as { name?: string; migrations?: unknown };
        const migrating = migrates(deployed);
        const output = await this.run(
          "pnpm",
          this.uploadArgs(member, sha, (name) => this.env[name] ?? "", migrating),
          {
            cwd,
            // The secrets ride the version, on stdin: no file, no argument.
            input:
              member.secrets.length === 0
                ? undefined
                : JSON.stringify(
                    Object.fromEntries(member.secrets.map((name) => [name, this.env[name]])),
                  ),
          },
        );
        const version = VERSION.exec(output)?.[1];
        if (version === undefined)
          throw new RunwayUnresolvedError(
            `wrangler versions upload of ${key} printed no version id`,
          );
        if (migrating) {
          versions.push(`${key}=${version}`);
          continue;
        }
        // The version takes no traffic yet; the smoke request is routed to it by header.
        const url = member.smoke;
        const check =
          url === undefined
            ? undefined
            : () =>
                this.smoke(url, {
                  "Cloudflare-Workers-Version-Overrides": `${deployed.name ?? ""}="${version}"`,
                });
        if (check !== undefined) {
          const failure = await check();
          if (failure !== undefined)
            throw new RunwayUnresolvedError(
              `${key} version ${version} failed its 0% smoke ${member.smoke} (${failure}); no traffic moved`,
            );
        }
        const steps =
          target.environment === "production" && member.rollout !== undefined
            ? member.rollout
            : [100];
        await this.rollOut(target, key, cwd, version, steps, sha, check);
        versions.push(`${key}=${version}`);
      } finally {
        if (swapped !== original) await writeFile(config, original);
      }
    }
    return { target: target.id, sha, reference: versions.join(",") };
  }

  /** Up when every member serves `record.sha` and answers its smoke URL. */
  override async verify(target: DeployTarget, record: DeployRecord): Promise<HealthReport> {
    const current = await this.current(target);
    if (current !== record.sha)
      return {
        status: HealthStatus.Down,
        detail: `${target.id} serves ${current ?? "no single commit"}, not ${record.sha}`,
      };
    for (const [key, member] of this.membersOf(target)) {
      if (member.smoke === undefined) continue;
      const status = await this.smoke(member.smoke);
      if (status !== undefined)
        return { status: HealthStatus.Down, detail: `${key} smoke ${member.smoke} ${status}` };
    }
    return { status: HealthStatus.Up };
  }

  /** Every member back to the version recorded for `to.sha`. */
  override async rollback(target: DeployTarget, to: DeployRecord): Promise<DeployRecord> {
    const versions = new Map(
      to.reference
        .split(",")
        .filter((entry) => entry.includes("="))
        .map((entry) => entry.split("=", 2) as [string, string]),
    );
    const members = this.membersOf(target);
    const missing = members.filter(([key]) => !versions.has(key)).map(([key]) => key);
    if (missing.length > 0)
      throw new RunwayUnresolvedError(
        `${target.id} has no recorded version of ${missing.join(", ")} for ${to.sha}`,
      );
    for (const [key, member] of members)
      await this.run(
        "pnpm",
        [...WRANGLER, "rollback", versions.get(key) ?? "", "--message", to.sha],
        { cwd: join(this.root, member.path) },
      );
    return { target: target.id, sha: to.sha, reference: to.reference };
  }

  /** The commit every member serves, or `null` when they differ or one was never deployed by runway. */
  override async current(target: DeployTarget): Promise<string | null> {
    const shas = new Set<string | null>();
    for (const [, member] of this.membersOf(target)) {
      const output = await this.run("pnpm", [...WRANGLER, "deployments", "list", "--json"], {
        cwd: join(this.root, member.path),
      });
      shas.add(this.latestSha(output));
    }
    const [sha] = shas;
    return shas.size === 1 && sha !== undefined ? sha : null;
  }

  /** `turbo run build` of one member, with what it depends on. */
  private buildArgs(member: Member): string[] {
    return ["turbo", "run", "build", `--filter=./${member.path}`];
  }

  /** `wrangler versions upload` with the commit as its message, each var from `valueOf` and the secrets from stdin. */
  private uploadArgs(
    member: Member,
    sha: string,
    valueOf: (name: string) => string,
    migrating = false,
  ): string[] {
    return [
      ...WRANGLER,
      ...(migrating ? ["deploy"] : ["versions", "upload"]),
      "--message",
      sha,
      ...member.vars.flatMap((name) => ["--var", `${name}:${valueOf(name)}`]),
      ...(member.secrets.length === 0 ? [] : ["--secrets-file", "/dev/stdin"]),
    ];
  }

  /** `wrangler versions deploy <id>@<percent>...`. */
  private deployVersionArgs(split: readonly (readonly [string, number])[], sha: string): string[] {
    return [
      ...WRANGLER,
      "versions",
      "deploy",
      ...split.map(([id, percent]) => `${id}@${percent}`),
      "--message",
      sha,
      "--yes",
    ];
  }

  /** Moves traffic to `version` in `steps`, the rest staying on the version that served before. */
  private async rollOut(
    target: DeployTarget,
    key: string,
    cwd: string,
    version: string,
    steps: readonly number[],
    sha: string,
    check: (() => Promise<string | undefined>) | undefined,
  ): Promise<void> {
    let before: string | undefined;
    if (steps.length > 1 || steps[0] !== 100) {
      const status = await this.run("pnpm", [...WRANGLER, "deployments", "status", "--json"], {
        cwd,
      });
      const served = (
        JSON.parse(status.slice(status.indexOf("{"))) as {
          versions?: { version_id: string; percentage: number }[];
        }
      ).versions;
      before = served?.toSorted((a, b) => b.percentage - a.percentage)[0]?.version_id;
      if (before === undefined)
        throw new RunwayUnresolvedError("a gradual rollout needs a deployed version to split with");
    }
    let moved = false;
    try {
      for (const [index, percent] of steps.entries()) {
        await this.run(
          "pnpm",
          this.deployVersionArgs(
            percent === 100 || before === undefined
              ? [[version, 100]]
              : [
                  [version, percent],
                  [before, 100 - percent],
                ],
            sha,
          ),
          { cwd },
        );
        moved = true;
        if (index < steps.length - 1) await this.sleep(ROLLOUT_HOLD_MS);
        // Each hold ends in a smoke of the new version; a single 100% move is left to verify.
        const failure = before === undefined ? undefined : await check?.();
        if (failure !== undefined)
          throw new RunwayUnresolvedError(
            `${version} failed its smoke at ${percent}% (${failure})`,
          );
      }
    } catch (error) {
      if (!moved || before === undefined) throw error;
      // Production is split or moved: put the previous version back at 100% before failing.
      await this.run("pnpm", [...WRANGLER, "rollback", before, "--message", sha], { cwd });
      throw new RunwayDeployFailedError(target.id, [
        {
          record: { target: target.id, sha, reference: `${key}=${before}` },
          report: {
            status: HealthStatus.Down,
            detail: `${version} rolled back to ${before}: ${error instanceof Error ? error.message : String(error)}`,
          },
        },
      ]);
    }
  }

  /** What is wrong with `url`'s answer, or `undefined` when it is a 2xx. */
  private smoke(url: string, headers?: Record<string, string>): Promise<string | undefined> {
    return this.fetch(url, headers).then(
      (response) => (response.ok ? undefined : `answered ${response.status}`),
      (error: unknown) => `failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  /** The members of `target`'s kind (and `only`), in runway.yaml order. */
  private membersOf(target: DeployTarget): [string, Member][] {
    const result = CLOUDFLARE_WORKERS_SETTINGS_SCHEMA.safeParse(target.settings);
    if (!result.success)
      throw new RunwayInvalidError(
        "runway.yaml",
        result.error.issues.map((issue) => ({
          path: [SETTINGS_PATH, ...issue.path.map(String)].join("."),
          message: issue.message,
        })),
      );
    const members = Object.entries(result.data.members).filter(
      ([key, member]) =>
        member.kind === target.kind && (this.only.length === 0 || this.only.includes(key)),
    );
    if (members.length === 0)
      throw new RunwayUnresolvedError(
        `${SETTINGS_PATH}.members has no ${target.kind} member${this.only.length === 0 ? "" : ` among ${this.only.join(", ")}`}`,
      );
    return members;
  }

  /** Refuses an unset id or secret, or an id wrangler would not accept, before anything ships. */
  private checkValues(key: string, member: Member): void {
    const issues = [
      ...Object.keys(member.ids)
        .filter((name) => !ID.test(this.env[name] ?? ""))
        .map((name) => ({
          path: `${SETTINGS_PATH}.members.${key}.ids.${name}`,
          message: `Set ${name} to the real id in the deploy job's environment`,
        })),
      ...member.secrets
        .filter((name) => (this.env[name] ?? "") === "")
        .map((name) => ({
          path: `${SETTINGS_PATH}.members.${key}.secrets`,
          message: `Set ${name} in the deploy job's environment (Infisical over OIDC in CI)`,
        })),
    ];
    if (issues.length > 0) throw new RunwayInvalidError("deploy environment", issues);
  }

  /** `config` with each quoted placeholder id swapped for its real id. */
  private withIds(key: string, member: Member, config: string): string {
    let swapped = config;
    for (const [name, placeholder] of Object.entries(member.ids)) {
      if (!swapped.includes(`"${placeholder}"`))
        throw new RunwayInvalidError("runway.yaml", [
          {
            path: `${SETTINGS_PATH}.members.${key}.ids.${name}`,
            message: `${member.path}/wrangler.jsonc has no "${placeholder}"`,
          },
        ]);
      swapped = swapped.replaceAll(`"${placeholder}"`, `"${this.env[name] ?? ""}"`);
    }
    return swapped;
  }

  /** `config` with the member's operational settings for the target's environment added (comments are dropped). */
  private render(target: DeployTarget, key: string, config: string): string {
    // shortcut: a trailing comma inside a string next to a closer is read as a trailing comma; none exists in a member config.
    const json = config
      .replaceAll(JSONC_TOKEN, (_, text?: string) => text ?? "")
      .replaceAll(/,(\s*[}\]])/g, "$1");
    const settings = CLOUDFLARE_WORKERS_SETTINGS_SCHEMA.parse(target.settings);
    return JSON.stringify(
      renderWranglerConfig(
        JSON.parse(json) as Record<string, unknown>,
        workerSettingsOf(settings, key, target.environment),
      ),
      null,
      2,
    );
  }

  /** The commit of the newest deployment whose message is one, from `wrangler deployments list --json`. */
  private latestSha(output: string): string | null {
    let deployments: unknown;
    try {
      deployments = JSON.parse(output.slice(output.indexOf("[")));
    } catch {
      return null;
    }
    if (!Array.isArray(deployments)) return null;
    const messages = (
      deployments as { created_on?: string; annotations?: Record<string, string> }[]
    )
      .toSorted((a, b) => (b.created_on ?? "").localeCompare(a.created_on ?? ""))
      .map((deployment) => deployment.annotations?.["workers/message"] ?? "");
    return messages.find((message) => SHA.test(message)) ?? null;
  }
}
