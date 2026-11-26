/**
 * Stackra file contract:
 * Purpose: `CloudflareWorkersProviderDriver`, the `cloudflare-workers` driver of the `RunwayProvider` port: from a
 *          checkout of the release commit it builds each Worker member of `targets.cloudflare-workers.members` that
 *          ships under the target's kind, swaps the placeholder binding ids in its `wrangler.jsonc` for the real ones
 *          (restored afterwards), applies its D1 migrations, renders the operational settings of runway.yaml into it (ADR 0519), uploads a version (`wrangler versions upload --message <sha>`) with its
 *          secrets in a private temporary file, adds it to the deployment at 0% (`wrangler versions deploy <old>@100
 *          <new>@0`; Cloudflare honours a version override only for a version in the current deployment), smoke-tests it
 *          there by version override, then moves traffic to it in the member's `rollout`
 *          steps (production only), smoke-testing after each hold and putting the previous version back at 100% on a
 *          failure; a member with Durable Object migrations goes out through `wrangler deploy` at 100% instead. Every
 *          smoke proves the version that answered is the one under test (`x-stackra-version` on every answer, or the
 *          `/-/version` route of a static Worker; STA-2786), so a smoke that reaches the old version fails. Current reads the commit back from `wrangler deployments list`, verify adds each
 *          member's smoke checks against the recorded version (retried while a new version or a new domain's certificate comes up), and rollback returns every member to the version recorded for a commit.
 *          A partial step and the rollback after a failed step carry a message that is no bare SHA, so `current` keeps
 *          naming the commit that serves. A version uploaded before the proof names none: verify then takes
 *          Cloudflare's own deployment (that version at 100%) as the proof. After the 0% smoke, each promotion step's
 *          smoke has `stepSmokeAttempts` and stops at `deadline` (`RUNWAY_DEPLOY_DEADLINE`), so a degraded step rolls
 *          back before the job's timeout can kill it mid-split. Every phase prints one line to `log` (build, migrations,
 *          upload, the version id, each smoke attempt, each rollout step with its percentage and hold, any rollback), and
 *          each command's output streams there line by line while it runs, every secret value masked (STA-2860).
 * Boundary: runs `pnpm` (turbo and each member's own wrangler) through the given `CommandRunner`; wrangler logs in
 *           with the job's `CLOUDFLARE_API_TOKEN` (decrypted from sops in CI) or the owner's session. Ids, vars and
 *           secrets are read by name from `env`; a secret value goes to wrangler only in a 0600 file in a fresh temporary
 *           folder, removed right after the upload (wrangler can't open /dev/stdin when it is a socket, as on Linux
 *           runners), never as an argument or a log line. When `runways` is set, the member's declared secrets are read
 *           from `env`, where the secrets-decrypt action put its sops scope (`readMemberSecrets`, in a proved CI job),
 *           before anything ships (ADR 0525). Agents and tests
 *           never apply against a real account (ADR 0352 decision 6).
 * Runtime: node
 * Governing contract: ADR 0352 (decisions 1, 3 and 6); ADR 0284 (Workers members); ADR 0173 (no secret is an
 *                     argument); ADR 0294 R3 and ADR 0305 rule 3 (the `Driver(Port)` base); STA-1921; ADR 0519; STA-1989, STA-1990;
 *                     ADR 0536 (gate 2, the version proof); STA-2786; STA-2860 (the streamed, masked deploy log).
 */
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

import { Driver } from "@stackra/container";
import { HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";
import type { z } from "zod";

import { CLOUDFLARE_WORKERS_SETTINGS_SCHEMA } from "#core/constants/cloudflare-workers-settings-schema.constant";
import { WORKER_VERSION } from "#core/constants/worker-version.constant";
import { WorkerVersionProof } from "#core/enums/worker-version-proof.enum";
import { RunwayDeployFailedError } from "#core/errors/runway-deploy-failed.error";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { diffWorkerSettings } from "#core/functions/diff-worker-settings.function";
import { maskSecrets } from "#core/functions/mask-secrets.function";
import { renderWranglerConfig } from "#core/functions/render-wrangler-config.function";
import { servedVersionProblem } from "#core/functions/served-version-problem.function";
import { workerSettingsOf } from "#core/functions/worker-settings-of.function";
import { RunwayProvider } from "#core/ports/runway-provider.port";
import type { DeployRecord } from "#core/types/deploy-record.type";
import type { DeployStep } from "#core/types/deploy-step.type";
import type { DeployTarget } from "#core/types/deploy-target.type";
import type { WorkerDrift } from "#core/types/worker-drift.type";
import { readMemberSecrets } from "#node/functions/read-member-secrets.function";
import { runProgram } from "#node/functions/run-program.function";
import type { CommandRunner } from "#node/types/command-runner.type";
import type { DeployRunways } from "#node/types/deploy-runways.type";
import type { SmokeAnswer } from "#node/types/smoke-answer.type";

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

/** The variables whose values are masked in every line printed, besides each member's secrets and smoke bearers. */
const ALWAYS_MASKED = ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_API_TOKEN_READ"] as const;

/** What a promotion needs on top of its holds before the deadline: its smokes and, on a failure, the rollback. */
const PROMOTION_MARGIN_MS = 3 * 60_000;

/** Cloudflare's error code for a Worker that does not exist (was never deployed). */
const NOT_FOUND = /\[code: 10007\]/;

/**
 * The message of the deployment that adds a version at 0% for its smoke, and of the one that takes it out again after
 * a failed smoke. Neither is a bare SHA, so `current` keeps reading the commit that serves.
 */
const STAGED = (sha: string): string => `${sha} (0% smoke)`;
const UNSTAGED = (sha: string): string => `${sha} (0% smoke failed)`;

/**
 * The message of a partial promotion step, and of the rollback after a failed step. Neither is a bare SHA: while a
 * step holds, `current` names the commit that served before; after the rollback, `current` skips the failed attempt.
 */
const STEPPED = (sha: string, percent: number): string => `${sha} (${percent}%)`;
const ROLLED_BACK = (sha: string, before: string): string => `${sha} (rolled back to ${before})`;

/** A rollback message: the commit whose attempt it ended. */
const ROLLED_BACK_FROM = /^([0-9a-f]{40}) \(rolled back to /;

/** The version proof a probe applies; `legacy` (verify only) accepts an answer that names no version. */
type Proof = {
  /** The version that must answer. */
  readonly version: string;
  /** Whether this is the `/-/version` route of a static Worker. */
  readonly route: boolean;
  /**
   * Set by verify: an answer that names no version (2xx without the header, or a route answering 404) is a version
   * uploaded before the proof existed; its URL is added here and verify asks Cloudflare's deployment instead.
   */
  readonly legacy?: Set<string>;
};

/** How a smoke run is made: by override, with how many attempts per check, until when. */
type SmokeRun = {
  /** The override header value routing every request to the version. */
  readonly override?: string;
  /** Attempts per check; `smokeAttempts` when unset. */
  readonly attempts?: number;
  /** Epoch ms after which a check is not retried. */
  readonly until?: number;
  /** See `Proof.legacy`. */
  readonly legacy?: Set<string>;
};

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

  /** The command runner, `runProgram`; a test or a dry run replaces it. */
  run: CommandRunner = runProgram;

  /** The environment ids, vars and secrets are read from; a test replaces it. */
  env: Readonly<Record<string, string | undefined>> = process.env;

  /** The root and member runways; when set, the declared secrets are read in a proved CI job (STA-606). */
  runways?: DeployRunways;

  /** A test's answer to "is this a proved CI job"; unset, the job's GitHub OIDC token proves it (STA-2100). */
  ci?: boolean;

  /** The smoke request; a test replaces it. */
  fetch: (url: string, headers?: Record<string, string>) => Promise<SmokeAnswer> = (url, headers) =>
    globalThis.fetch(url, {
      ...(headers ? { headers } : {}),
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
    });

  /** Smoke attempts per check, `smokeIntervalMs` apart: ten minutes covers a new domain's certificate. */
  smokeAttempts = 60;

  /**
   * Attempts a check may see another version answer before it fails: a deployment reaches the edge within seconds, so
   * a minute of the old version is a smoke that will not reach the new one.
   */
  proofAttempts = 6;

  /**
   * Attempts per check of a promotion step's smoke. The 0% smoke already waited out a new domain's certificate, so a
   * step that still fails is degraded: it fails in about a minute and rolls back, inside the job's timeout.
   */
  stepSmokeAttempts = 6;

  /** The wait between smoke attempts; a test sets 0. */
  smokeIntervalMs = 10_000;

  /** The clock, in epoch ms; a test replaces it. */
  now: () => number = Date.now;

  /**
   * Where the phase lines and each command's streamed output go, one line per call, every secret already masked
   * (STA-2860); standard error by default, so a deploy job's log shows progress while it runs. A test replaces it.
   */
  log: (line: string) => void = (line) => {
    process.stderr.write(`${line}\n`);
  };

  /** Holds a partial rollout step, in milliseconds; a test replaces it. */
  sleep: (ms: number) => Promise<void> = (ms) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  /** A read-only Cloudflare API GET, the `result` of the answer; a test replaces it. */
  read: (path: string, token: string) => Promise<Record<string, unknown>> = async (path, token) => {
    const response = await globalThis.fetch(`https://api.cloudflare.com/client/v4${path}`, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok)
      throw new RunwayUnresolvedError(`Cloudflare answered ${response.status} to GET ${path}`);
    return ((await response.json()) as { result: Record<string, unknown> }).result;
  };

  /** The repository root the member paths are relative to. */
  root = ".";

  /** The member keys to ship; empty ships every member of the target's kind. */
  only: readonly string[] = [];

  /** The secret values of the deploy under way (each member's secrets and smoke bearers), masked in every line. */
  private readonly secretValues = new Set<string>();

  /**
   * Epoch ms by which a promotion must have ended, from `RUNWAY_DEPLOY_DEADLINE` (epoch seconds, set by the deploy job
   * below its timeout). A promotion whose holds do not fit starts no step; a step's smoke stops retrying at it and
   * the previous version goes back. Unset, no deadline.
   */
  get deadline(): number | undefined {
    const seconds = Number(this.env["RUNWAY_DEPLOY_DEADLINE"] ?? "");
    return Number.isInteger(seconds) && seconds > 0 ? seconds * 1000 : undefined;
  }

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
        // The version joins the deployment at 0% for its smoke, then takes the traffic (in steps in production).
        ...(migrating
          ? []
          : [
              {
                command: "pnpm",
                args: this.deployVersionArgs(
                  [
                    ["$SERVING", 100],
                    ["$VERSION", 0],
                  ],
                  STAGED(sha),
                ),
                cwd,
              },
              { command: "pnpm", args: this.deployVersionArgs([["$VERSION", 100]], sha), cwd },
            ]),
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
      if (this.runways === undefined || Object.keys(member.secrets).length === 0) continue;
      const read = await readMemberSecrets({
        environment: target.environment,
        member: basename(member.path),
        runways: this.runways,
        ci: this.ci,
        env: this.env,
      });
      secrets.set(key, read);
    }
    // Every value that could reach a line printed below is masked there.
    this.secretValues.clear();
    for (const [key, member] of members) {
      for (const [name, from] of Object.entries(member.secrets))
        this.secretValues.add(secrets.get(key)?.get(name) ?? this.env[from] ?? "");
      for (const smoke of member.smoke)
        if (smoke.bearer !== undefined) this.secretValues.add(this.env[smoke.bearer] ?? "");
    }

    const versions: string[] = [];
    for (const [key, member] of members) {
      const cwd = join(this.root, member.path);
      this.say(key, `build (turbo run build --filter=./${member.path})`);
      await this.exec("pnpm", this.buildArgs(member), this.root);
      const config = join(cwd, "wrangler.jsonc");
      const original = await readFile(config, "utf8");
      const swapped = this.render(target, key, this.withIds(key, member, original));
      try {
        if (swapped !== original) await writeFile(config, swapped);
        for (const database of member.d1) {
          this.say(key, `apply the D1 migrations of ${database}`);
          await this.exec(
            "pnpm",
            [...WRANGLER, "d1", "migrations", "apply", database, "--remote"],
            cwd,
          );
        }
        // `render` already stripped the JSONC comments and trailing commas: `swapped` is strict JSON.
        const deployed = JSON.parse(swapped) as { name?: string; migrations?: unknown };
        const migrating = migrates(deployed);
        // The secrets ride the version in a private temporary file: never an argument, removed right after.
        const folder =
          Object.keys(member.secrets).length === 0
            ? undefined
            : await mkdtemp(join(tmpdir(), "runway-secrets-"));
        let output: string;
        try {
          const file = folder === undefined ? undefined : join(folder, "secrets.json");
          if (file !== undefined)
            await writeFile(
              file,
              JSON.stringify(
                Object.fromEntries(
                  Object.entries(member.secrets).map(([name, from]) => [
                    name,
                    secrets.get(key)?.get(name) ?? this.env[from],
                  ]),
                ),
              ),
              { mode: 0o600 },
            );
          this.say(
            key,
            migrating
              ? "deploy at 100% (wrangler deploy: the config has Durable Object migrations)"
              : "upload a version (wrangler versions upload)",
          );
          output = await this.exec(
            "pnpm",
            this.uploadArgs(member, sha, (name) => this.env[name] ?? "", migrating, file),
            cwd,
          );
        } finally {
          if (folder !== undefined) await rm(folder, { recursive: true, force: true });
        }
        const version = VERSION.exec(output)?.[1];
        if (version === undefined)
          throw new RunwayUnresolvedError(
            `wrangler versions upload of ${key} printed no version id`,
          );
        this.say(key, `version ${version} uploaded`);
        if (migrating) {
          this.say(key, `${version} serves 100%`);
          versions.push(`${key}=${version}`);
          continue;
        }
        // The preset's rollout counts too.
        const { rollout } = workerSettingsOf(
          CLOUDFLARE_WORKERS_SETTINGS_SCHEMA.parse(target.settings),
          key,
          target.environment,
        );
        const steps =
          target.environment === "production" && rollout !== undefined ? rollout : [100];
        // Every smoke reaches the version by override and must see it answer (STA-2786).
        const override = `${deployed.name ?? ""}="${version}"`;
        const check = (run: Omit<SmokeRun, "override"> = {}) =>
          this.smokeAll(key, member, version, { ...run, override });
        await this.rollOut(target, key, cwd, version, steps, sha, check);
        this.say(key, `${version} serves 100%`);
        versions.push(`${key}=${version}`);
      } finally {
        if (swapped !== original) await writeFile(config, original);
      }
    }
    return { target: target.id, sha, reference: versions.join(",") };
  }

  /**
   * Up when every member serves `record.sha` and its smoke URLs answer from the version the record names. A version
   * uploaded before the proof (any rollback target older than STA-2786) names none: its answers must still be 2xx,
   * and Cloudflare's own deployment must show that version at 100%. An answer naming another version is down.
   */
  override async verify(target: DeployTarget, record: DeployRecord): Promise<HealthReport> {
    const current = await this.current(target);
    if (current !== record.sha)
      return {
        status: HealthStatus.Down,
        detail: `${target.id} serves ${current ?? "no single commit"}, not ${record.sha}`,
      };
    const versions = this.versionsOf(record.reference);
    const notes: string[] = [];
    for (const [key, member] of this.membersOf(target)) {
      const version = versions.get(key);
      if (version === undefined)
        return {
          status: HealthStatus.Down,
          detail: `${key} has no recorded version to prove its smoke against`,
        };
      const legacy = new Set<string>();
      this.say(key, `verify ${version} (${record.sha})`);
      const failure = await this.smokeAll(key, member, version, { legacy });
      if (failure !== undefined)
        return { status: HealthStatus.Down, detail: `${key} smoke ${failure}` };
      if (legacy.size === 0) continue;
      const split = await this.deploymentSplit(join(this.root, member.path));
      const unnamed = `${key} smoke ${[...legacy].join(", ")} named no version`;
      if (split?.find((served) => served.version_id === version)?.percentage !== 100)
        return {
          status: HealthStatus.Down,
          detail: `${unnamed}, and Cloudflare's deployment serves ${
            split === undefined || split.length === 0
              ? "nothing"
              : split.map((served) => `${served.version_id}@${served.percentage}`).join(" ")
          }, not ${version}@100`,
        };
      notes.push(
        `${unnamed} (a version older than the proof); Cloudflare serves ${version} at 100%`,
      );
    }
    return notes.length === 0
      ? { status: HealthStatus.Up }
      : { status: HealthStatus.Up, detail: notes.join("; ") };
  }

  /** Every member back to the version recorded for `to.sha`. */
  override async rollback(target: DeployTarget, to: DeployRecord): Promise<DeployRecord> {
    const versions = this.versionsOf(to.reference);
    const members = this.membersOf(target);
    const missing = members.filter(([key]) => !versions.has(key)).map(([key]) => key);
    if (missing.length > 0)
      throw new RunwayUnresolvedError(
        `${target.id} has no recorded version of ${missing.join(", ")} for ${to.sha}`,
      );
    for (const [key, member] of members) {
      this.say(key, `roll back to ${versions.get(key) ?? ""} (${to.sha})`);
      await this.exec(
        "pnpm",
        [...WRANGLER, "rollback", versions.get(key) ?? "", "--message", to.sha],
        join(this.root, member.path),
      );
      this.say(key, `rolled back to ${versions.get(key) ?? ""}`);
    }
    return { target: target.id, sha: to.sha, reference: to.reference };
  }

  /**
   * Per member (of any kind), what runway.yaml renders against what Cloudflare reports (ADR 0519 decision 7). Reads
   * only, with `CLOUDFLARE_API_TOKEN_READ`; changes nothing.
   */
  async drift(target: DeployTarget): Promise<WorkerDrift[]> {
    const token = this.env["CLOUDFLARE_API_TOKEN_READ"];
    if (!token)
      throw new RunwayUnresolvedError(
        "Set CLOUDFLARE_API_TOKEN_READ (a read-only token) to read drift",
      );
    const settings = CLOUDFLARE_WORKERS_SETTINGS_SCHEMA.parse(target.settings);
    const drifts: WorkerDrift[] = [];
    for (const [key, member] of Object.entries(settings.members)) {
      if (this.only.length > 0 && !this.only.includes(key)) continue;
      const config = await readFile(join(this.root, member.path, "wrangler.jsonc"), "utf8");
      const rendered = JSON.parse(this.render(target, key, config)) as Record<string, unknown>;
      const worker = String(rendered["name"]);
      const account = String(rendered["account_id"] ?? this.env["CLOUDFLARE_ACCOUNT_ID"] ?? "");
      if (!/^[0-9a-f]{32}$/.test(account))
        throw new RunwayUnresolvedError(
          `${key} has no account_id in wrangler.jsonc or CLOUDFLARE_ACCOUNT_ID`,
        );
      const base = `/accounts/${account}/workers/scripts/${encodeURIComponent(worker)}`;
      const [script, subdomain] = await Promise.all([
        this.read(`${base}/settings`, token),
        this.read(`${base}/subdomain`, token),
      ]);
      const live = {
        ...script,
        workers_dev: subdomain["enabled"],
        preview_urls: subdomain["previews_enabled"],
      };
      drifts.push({ member: key, worker, rows: diffWorkerSettings(rendered, live) });
    }
    return drifts;
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

  /** Prints one phase line of member `key`, masked. */
  private say(key: string, text: string): void {
    this.log(this.mask(`runway: ${key}: ${text}`));
  }

  /** `text` with every secret value of the deploy and the Cloudflare tokens masked. */
  private mask(text: string): string {
    return maskSecrets(text, [
      ...this.secretValues,
      ...ALWAYS_MASKED.map((name) => this.env[name] ?? ""),
    ]);
  }

  /**
   * Runs one deploy command with its output streamed to `log` line by line, masked, and answers its standard output.
   * A failure whose message carries a secret is thrown again with it masked.
   */
  private async exec(command: string, args: readonly string[], cwd: string): Promise<string> {
    try {
      return await this.run(command, args, {
        cwd,
        onLine: (line) => this.log(this.mask(`  | ${line}`)),
      });
    } catch (error) {
      const message = errorText(error);
      const masked = this.mask(message);
      if (masked === message) throw error;
      // oxlint-disable-next-line eslint/preserve-caught-error -- the caught error carries the secret this masks; attached as the cause, it would print with it
      throw new Error(masked);
    }
  }

  /** `turbo run build` of one member, with what it depends on. */
  private buildArgs(member: Member): string[] {
    return ["turbo", "run", "build", `--filter=./${member.path}`];
  }

  /** `wrangler versions upload` with the commit as its message, each var from `valueOf` and the secrets from `file`. */
  private uploadArgs(
    member: Member,
    sha: string,
    valueOf: (name: string) => string,
    migrating = false,
    file = "<secrets-file>",
  ): string[] {
    return [
      ...WRANGLER,
      ...(migrating ? ["deploy"] : ["versions", "upload"]),
      "--message",
      sha,
      ...member.vars.flatMap((name) => ["--var", `${name}:${valueOf(name)}`]),
      ...(Object.keys(member.secrets).length === 0 ? [] : ["--secrets-file", file]),
    ];
  }

  /** `wrangler versions deploy <id>@<percent>... --message <message>`. */
  private deployVersionArgs(
    split: readonly (readonly [string, number])[],
    message: string,
  ): string[] {
    return [
      ...WRANGLER,
      "versions",
      "deploy",
      ...split.map(([id, percent]) => `${id}@${percent}`),
      "--message",
      message,
      "--yes",
    ];
  }

  /** `key=version` entries of a record's reference, by member key. */
  private versionsOf(reference: string): Map<string, string> {
    return new Map(
      reference
        .split(",")
        .filter((entry) => entry.includes("="))
        .map((entry) => entry.split("=", 2) as [string, string]),
    );
  }

  /**
   * The versions of the Worker's current deployment with their share of traffic, or `undefined` for a Worker that was
   * never deployed (Cloudflare's code 10007). Any other failure (a wrong account, a renamed Worker) throws.
   */
  private async deploymentSplit(
    cwd: string,
  ): Promise<readonly { version_id: string; percentage: number }[] | undefined> {
    const status = await this.run("pnpm", [...WRANGLER, "deployments", "status", "--json"], {
      cwd,
    }).catch((error: unknown) => {
      if (NOT_FOUND.test(String(error))) return undefined;
      throw error;
    });
    if (status === undefined) return undefined;
    return (
      JSON.parse(status.slice(status.indexOf("{"))) as {
        versions?: { version_id: string; percentage: number }[];
      }
    ).versions;
  }

  /** The version serving most of the Worker's traffic, or `undefined` for a Worker that was never deployed. */
  private async servingVersion(cwd: string): Promise<string | undefined> {
    return (await this.deploymentSplit(cwd))?.toSorted((a, b) => b.percentage - a.percentage)[0]
      ?.version_id;
  }

  /**
   * Adds `version` to the deployment at 0% and smokes it there, then moves traffic to it in `planned` steps, the rest
   * staying on the version that served before, with a smoke after each step; a failed step puts that version back.
   */
  private async rollOut(
    target: DeployTarget,
    key: string,
    cwd: string,
    version: string,
    planned: readonly number[],
    sha: string,
    check: (run?: Omit<SmokeRun, "override">) => Promise<string | undefined>,
  ): Promise<void> {
    const before = await this.servingVersion(cwd);
    if (before === undefined) {
      // A first deploy has no version to stage beside or go back to: it moves at once, then proves itself.
      this.say(key, `first deploy: ${version} at 100% (no earlier version to stage beside)`);
      await this.exec("pnpm", this.deployVersionArgs([[version, 100]], sha), cwd);
      this.say(key, `smoke ${version} after its first deploy`);
      const failure = await check();
      if (failure !== undefined)
        throw new RunwayUnresolvedError(
          `${key} version ${version} failed its smoke after its first deploy ${failure}; there is no earlier version to go back to`,
        );
      return;
    }
    // Cloudflare honours a version override only for a version in the current deployment and routes any other request
    // as usual, to `before`: so the version joins the deployment at 0% first, or its smoke would check `before`.
    this.say(key, `stage ${version} at 0% beside ${before} at 100% for its smoke`);
    await this.exec(
      "pnpm",
      this.deployVersionArgs(
        [
          [before, 100],
          [version, 0],
        ],
        STAGED(sha),
      ),
      cwd,
    );
    this.say(key, `0% smoke of ${version}`);
    const staged = await check();
    if (staged === undefined) this.say(key, `0% smoke of ${version} passed`);
    // No traffic moves unless the promotion's holds and a margin still fit before the job's deadline.
    const { deadline } = this;
    const holds = (planned.length - 1) * ROLLOUT_HOLD_MS;
    const late =
      staged === undefined &&
      deadline !== undefined &&
      this.now() + holds + PROMOTION_MARGIN_MS > deadline
        ? `the job's deadline leaves ${Math.max(0, Math.floor((deadline - this.now()) / 60_000))} min, and the promotion holds ${holds / 60_000} min`
        : undefined;
    if (staged !== undefined || late !== undefined) {
      // No traffic moved; the version leaves the deployment, so no override reaches it any more.
      this.say(
        key,
        `${staged === undefined ? `not promoted: ${late ?? ""}` : `0% smoke failed: ${staged}`}; take ${version} out of the deployment, no traffic moved`,
      );
      const left = await this.exec(
        "pnpm",
        this.deployVersionArgs([[before, 100]], UNSTAGED(sha)),
        cwd,
      ).then(
        () => "",
        (error: unknown) => `; taking it out of the deployment failed too (${errorText(error)})`,
      );
      throw new RunwayUnresolvedError(
        late === undefined
          ? `${key} version ${version} failed its 0% smoke ${staged ?? ""}; no traffic moved${left}`
          : `${key} version ${version} passed its 0% smoke but was not promoted: ${late}; no traffic moved${left}`,
      );
    }
    // A step's smoke stops retrying at the deadline, less the margin the rollback needs.
    const until = deadline === undefined ? undefined : deadline - PROMOTION_MARGIN_MS / 3;
    let moved = false;
    try {
      for (const [index, percent] of planned.entries()) {
        this.say(
          key,
          `rollout step ${index + 1}/${planned.length}: ${version} at ${percent}%${percent === 100 ? "" : `, ${before} at ${100 - percent}%`}`,
        );
        await this.exec(
          "pnpm",
          this.deployVersionArgs(
            percent === 100
              ? [[version, 100]]
              : [
                  [version, percent],
                  [before, 100 - percent],
                ],
            // Only the 100% step is a bare SHA: `current` names the commit that serves most of the traffic.
            percent === 100 ? sha : STEPPED(sha, percent),
          ),
          cwd,
        );
        moved = true;
        if (index < planned.length - 1) {
          this.say(
            key,
            `hold ${percent}% for ${ROLLOUT_HOLD_MS / 60_000} min (until ${new Date(this.now() + ROLLOUT_HOLD_MS).toISOString()})`,
          );
          await this.sleep(ROLLOUT_HOLD_MS);
        }
        // Each step ends in a smoke of the new version, the 100% one included.
        this.say(key, `smoke ${version} at ${percent}%`);
        const failure = await check({
          attempts: this.stepSmokeAttempts,
          ...(until === undefined ? {} : { until }),
        });
        if (failure !== undefined)
          throw new RunwayUnresolvedError(
            `${version} failed its smoke at ${percent}% (${failure})`,
          );
        this.say(key, `smoke ${version} at ${percent}% passed`);
      }
    } catch (error) {
      if (!moved) throw error;
      // Production is split or moved: put the previous version back at 100% before failing.
      this.say(key, `roll back to ${before}: ${errorText(error)}`);
      const back = await this.exec(
        "pnpm",
        [...WRANGLER, "rollback", before, "--message", ROLLED_BACK(sha, before)],
        cwd,
      ).then(
        () => `${version} rolled back to ${before}`,
        (rollbackError: unknown) =>
          `${version} could NOT be rolled back to ${before} (${errorText(rollbackError)}); traffic may still be split between ${version} and ${before}`,
      );
      this.say(key, back);
      throw new RunwayDeployFailedError(target.id, [
        {
          record: { target: target.id, sha, reference: `${key}=${before}` },
          report: { status: HealthStatus.Down, detail: `${back}: ${errorText(error)}` },
        },
      ]);
    }
  }

  /**
   * What is wrong with the first failing smoke check of `member` (each retried), or `undefined` when every check
   * answers 2xx from `version`: each answer's `x-stackra-version`, or for a `route` member its `/-/version` read
   * before and after the checks, must name it (STA-2786). `run.override` routes every request to that version;
   * `run.attempts` and `run.until` bound each check's retries; `run.legacy` (verify) accepts an answer naming none.
   */
  private async smokeAll(
    key: string,
    member: Member,
    version: string,
    run: SmokeRun = {},
  ): Promise<string | undefined> {
    if (member.smoke.length === 0)
      return `proves no version: the member lists no smoke check to reach ${version} with`;
    // A bearer is masked in every line from here on, also in `verify`, which runs without `apply`.
    for (const smoke of member.smoke)
      if (smoke.bearer !== undefined) this.secretValues.add(this.env[smoke.bearer] ?? "");
    const { override, legacy } = run;
    const pin: Record<string, string> =
      override === undefined ? {} : { [WORKER_VERSION.override]: override };
    const routed = member.versionProof === WorkerVersionProof.Route;
    const proof = (route: boolean): Proof => ({
      version,
      route,
      ...(legacy === undefined ? {} : { legacy }),
    });
    // A Worker whose answers are static assets names its version at one route, read on each smoke host.
    const proveRoute = async (): Promise<string | undefined> => {
      for (const origin of new Set(member.smoke.map((smoke) => new URL(smoke.url).origin))) {
        const failure = await this.probe(
          key,
          `${origin}${WORKER_VERSION.route}`,
          pin,
          proof(true),
          run,
        );
        if (failure !== undefined) return failure;
      }
      return undefined;
    };
    if (routed) {
      const failure = await proveRoute();
      if (failure !== undefined) return failure;
    }
    for (const smoke of member.smoke) {
      const headers: Record<string, string> = {
        ...pin,
        ...(smoke.bearer === undefined
          ? {}
          : { authorization: `Bearer ${this.env[smoke.bearer] ?? ""}` }),
      };
      const failure = await this.probe(
        key,
        smoke.url,
        headers,
        routed ? undefined : proof(false),
        run,
      );
      if (failure !== undefined) return failure;
    }
    return routed ? proveRoute() : undefined;
  }

  /**
   * One smoke check, retried while it is not 2xx (a new domain's certificate) and, for at most `proofAttempts`, while
   * another version answers (a deployment still reaching the edge; a route member's `/-/version` answering 404 is a
   * version without the route): what is wrong with its last answer, or `undefined`. It stops after `run.attempts`
   * (`smokeAttempts`) attempts, and makes no new attempt after `run.until`. Each attempt prints one line of `key`.
   */
  private async probe(
    key: string,
    url: string,
    headers: Record<string, string>,
    proof: Proof | undefined,
    run: SmokeRun = {},
  ): Promise<string | undefined> {
    const limit = run.attempts ?? this.smokeAttempts;
    let status: string | undefined;
    let attempts = 0;
    let others = 0;
    while (attempts < limit && others < this.proofAttempts) {
      if (attempts > 0) {
        if (run.until !== undefined && this.now() + this.smokeIntervalMs >= run.until) break;
        await this.sleep(this.smokeIntervalMs);
      }
      attempts += 1;
      let wrong = false;
      status = await this.fetch(url, headers).then(
        async (answer) => {
          if (proof === undefined) return answer.ok ? undefined : `answered ${answer.status}`;
          const routeMissing = proof.route && answer.status === 404;
          // A version older than the proof names none; only verify accepts that, and asks Cloudflare instead.
          if (
            proof.legacy !== undefined &&
            !answer.headers.get(WORKER_VERSION.header) &&
            (answer.ok || routeMissing)
          ) {
            proof.legacy.add(url);
            return undefined;
          }
          if (routeMissing) {
            wrong = true;
            return `answered 404: a version without the ${WORKER_VERSION.route} route answered, not ${proof.version}`;
          }
          if (!answer.ok) return `answered ${answer.status}`;
          const problem = servedVersionProblem(proof.version, {
            header: answer.headers.get(WORKER_VERSION.header),
            route: proof.route,
            body: proof.route ? await this.bodyOf(answer) : undefined,
          });
          wrong = problem !== undefined;
          return problem;
        },
        (error: unknown) => `failed: ${errorText(error)}`,
      );
      this.say(key, `smoke ${url} attempt ${attempts}/${limit}: ${status ?? "ok"}`);
      if (status === undefined) return undefined;
      if (wrong) others += 1;
    }
    return `${url} ${status ?? "was not reached"} after ${attempts} attempts`;
  }

  /** A smoke answer's JSON body, or `undefined` when it is not JSON. */
  private async bodyOf(answer: SmokeAnswer): Promise<unknown> {
    try {
      return JSON.parse(await answer.text()) as unknown;
    } catch {
      return undefined;
    }
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

  /** Refuses an unset id or secret, an id wrangler would not accept or a member with no smoke, before anything ships. */
  private checkValues(key: string, member: Member): void {
    const issues = [
      ...Object.keys(member.ids)
        .filter((name) => !ID.test(this.env[name] ?? ""))
        .map((name) => ({
          path: `${SETTINGS_PATH}.members.${key}.ids.${name}`,
          message: `Set ${name} to the real id in the deploy job's environment`,
        })),
      ...(this.runways === undefined ? Object.values(member.secrets) : [])
        .filter((name) => (this.env[name] ?? "") === "")
        .map((name) => ({
          path: `${SETTINGS_PATH}.members.${key}.secrets`,
          message: `Set ${name} in the deploy job's environment (.github/actions/secrets-decrypt in CI)`,
        })),
      // Every deploy step proves the version under test answers, so a member without a smoke check cannot ship.
      ...(member.smoke.length === 0
        ? [
            {
              path: `${SETTINGS_PATH}.members.${key}.smoke`,
              message: "List a smoke check: every deploy step proves the new version answers it",
            },
          ]
        : []),
      ...member.smoke
        .flatMap((smoke) => (smoke.bearer === undefined ? [] : [smoke.bearer]))
        .filter((name) => (this.env[name] ?? "") === "")
        .map((name) => ({
          path: `${SETTINGS_PATH}.members.${key}.smoke`,
          message: `Set ${name} in the deploy job's environment (the smoke bearer)`,
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

  /**
   * The commit of the newest deployment whose message is one, from `wrangler deployments list --json`. A rollback
   * after a failed step (`<sha> (rolled back to <id>)`) ends that attempt: its deployments back to the attempt's 0%
   * stage are skipped, so the failed commit's own 100% step never names what serves.
   */
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
    let failed: string | undefined;
    for (const message of messages) {
      if (failed !== undefined) {
        // Inside a failed attempt, newest first: its 0% stage is its first deployment.
        if (message === STAGED(failed)) failed = undefined;
        continue;
      }
      if (SHA.test(message)) return message;
      failed = ROLLED_BACK_FROM.exec(message)?.[1];
    }
    return null;
  }
}

/** An error's message, or the value as text. */
function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
