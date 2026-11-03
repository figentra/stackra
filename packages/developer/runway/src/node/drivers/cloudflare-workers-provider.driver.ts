/**
 * Stackra file contract:
 * Purpose: `CloudflareWorkersProviderDriver`, the `cloudflare-workers` driver of the `RunwayProvider` port: from a
 *          checkout of the release commit it builds each Worker member of `targets.cloudflare-workers.members` that
 *          ships under the target's kind, swaps the placeholder binding ids in its `wrangler.jsonc` for the real ones
 *          (restored afterwards), applies its D1 migrations, runs `wrangler deploy --message <sha>` and sets its secrets
 *          with `wrangler secret bulk`. Current reads the commit back from `wrangler deployments list`, verify adds each
 *          member's smoke URL, and rollback returns every member to the version recorded for a commit.
 * Boundary: runs `pnpm` (turbo and each member's own wrangler) through the given `CommandRunner`; wrangler logs in
 *           with the job's `CLOUDFLARE_API_TOKEN` (OIDC from Infisical in CI) or the owner's session. Ids, vars and
 *           secrets are read by name from `env`; a secret value goes to wrangler on stdin only, never as an argument,
 *           a file or a log line. When `runways` is set, the secret values are read from Infisical
 *           (`readMemberSecrets`, in CI) before anything ships, instead of from `env` (ADR 0173). Agents and tests
 *           never apply against a real account (ADR 0352 decision 6).
 * Runtime: node
 * Governing contract: ADR 0352 (decisions 1, 3 and 6); ADR 0284 (Workers members); ADR 0173 (no secret is an
 *                     argument); ADR 0294 R3 and ADR 0305 rule 3 (the `Driver(Port)` base); STA-1921.
 */
import { readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

import { Driver } from "@stackra/container";
import { HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";
import type { z } from "zod";

import { CLOUDFLARE_WORKERS_SETTINGS_SCHEMA } from "#core/constants/cloudflare-workers-settings-schema.constant";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { RunwayProvider } from "#core/ports/runway-provider.port";
import type { DeployRecord } from "#core/types/deploy-record.type";
import type { DeployStep } from "#core/types/deploy-step.type";
import type { DeployTarget } from "#core/types/deploy-target.type";
import { readMemberSecrets } from "#node/functions/read-member-secrets.function";
import { runCommand } from "#node/functions/run-command.function";
import type { CommandRunner } from "#node/types/command-runner.type";
import type { DeployRunways } from "#node/types/deploy-runways.type";

/** One parsed member of `targets.cloudflare-workers.members`. */
type Member = z.output<typeof CLOUDFLARE_WORKERS_SETTINGS_SCHEMA>["members"][string];

/** The member's own wrangler, from its `catalog:deploy` dev dependency. */
const WRANGLER = ["exec", "wrangler"] as const;

/** A full commit SHA: the message of every deployment this provider makes. */
const SHA = /^[0-9a-f]{40}$/;

/** A binding id wrangler accepts (a D1 uuid, a 32-hex KV namespace); nothing that could break out of a JSON string. */
const ID = /^[A-Za-z0-9-]+$/;

/** The version line `wrangler deploy` prints. */
const VERSION = /Current Version ID:\s*([0-9a-f-]{36})/;

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

  /** The root and member runways; when set, secrets are read from Infisical, not `env` (STA-606). */
  runways?: DeployRunways;

  /** The smoke request; a test replaces it. */
  fetch: (url: string) => Promise<{ readonly ok: boolean; readonly status: number }> = (url) =>
    globalThis.fetch(url, { redirect: "manual", signal: AbortSignal.timeout(30_000) });

  /** The repository root the member paths are relative to. */
  root = ".";

  /** The member keys to ship; empty ships every member of the target's kind. */
  only: readonly string[] = [];

  /** Per member: build, migrate, deploy, set secrets (the id swap and its restore are file edits, not commands). */
  override plan(target: DeployTarget, sha: string): readonly DeployStep[] {
    return this.membersOf(target).flatMap(([, member]) => {
      const cwd = join(this.root, member.path);
      return [
        { command: "pnpm", args: this.buildArgs(member), cwd: this.root },
        ...member.d1.map((database) => ({
          command: "pnpm",
          args: [...WRANGLER, "d1", "migrations", "apply", database, "--remote"],
          cwd,
        })),
        {
          command: "pnpm",
          args: this.deployArgs(member, sha, (name) => `$${name}`),
          cwd,
        },
        ...(member.secrets.length === 0
          ? []
          : [{ command: "pnpm", args: [...WRANGLER, "secret", "bulk"], cwd }]),
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
    // Read every Worker's values before anything ships: a missing secret fails with nothing changed.
    const secrets = new Map<string, ReadonlyMap<string, string>>();
    for (const [key, member] of members) {
      if (this.runways === undefined || member.secrets.length === 0) continue;
      const read = await readMemberSecrets({
        environment: target.environment,
        member: basename(member.path),
        runways: this.runways,
        run: this.run,
      });
      secrets.set(key, read);
    }

    const versions: string[] = [];
    for (const [key, member] of members) {
      const cwd = join(this.root, member.path);
      await this.run("pnpm", this.buildArgs(member), { cwd: this.root });
      const config = join(cwd, "wrangler.jsonc");
      const original = await readFile(config, "utf8");
      const swapped = this.withIds(key, member, original);
      try {
        if (swapped !== original) await writeFile(config, swapped);
        for (const database of member.d1)
          await this.run("pnpm", [...WRANGLER, "d1", "migrations", "apply", database, "--remote"], {
            cwd,
          });
        const output = await this.run(
          "pnpm",
          this.deployArgs(member, sha, (name) => this.env[name] ?? ""),
          { cwd },
        );
        const version = VERSION.exec(output)?.[1];
        if (version === undefined)
          throw new RunwayUnresolvedError(`wrangler deploy of ${key} printed no version id`);
        if (member.secrets.length > 0)
          await this.run("pnpm", [...WRANGLER, "secret", "bulk"], {
            cwd,
            input: JSON.stringify(
              Object.fromEntries(
                member.secrets.map((name) => [name, secrets.get(key)?.get(name) ?? this.env[name]]),
              ),
            ),
          });
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
      const status = await this.fetch(member.smoke).then(
        (response) => (response.ok ? undefined : `answered ${response.status}`),
        (error: unknown) => `failed: ${error instanceof Error ? error.message : String(error)}`,
      );
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

  /** `wrangler deploy` with the commit as its message and each var from `valueOf`. */
  private deployArgs(member: Member, sha: string, valueOf: (name: string) => string): string[] {
    return [
      ...WRANGLER,
      "deploy",
      "--message",
      sha,
      ...member.vars.flatMap((name) => ["--var", `${name}:${valueOf(name)}`]),
    ];
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
      ...(this.runways === undefined ? member.secrets : [])
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
