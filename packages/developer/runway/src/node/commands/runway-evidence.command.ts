/**
 * Stackra file contract:
 * Purpose: `RunwayEvidenceCommand`, `runway evidence <environment> --target <t> --sha <sha> [--member <m>] [--repo <r>]
 *          [--previous <file>]`: writes the approvals bot's evidence for one deploy job (`deployEvidence`, ADR 0533)
 *          to `runway-evidence-<environment>[-<member>].json` in the working folder, the name the bot looks for in the
 *          run's artifacts, and gives it as the `--json` data. For a service target it also writes
 *          `runway-migrations-<environment>[-<member>].json` (`runway.migrations/v1`), the migration keys the job
 *          ships, which the next deploy to the environment passes back as `--previous` so `destructive` names only
 *          what is new.
 * Boundary: reads the runway files, for a Workers member its `wrangler.jsonc`, and for a service target each shipped
 *           service's `.stackra/migration-safety.json` (gen's ADR 0159 classes) and `.stackra/migrations` file names
 *           (`services/<member>`, or every service under `services/` for the whole target); writes those two files and
 *           nothing else; no network and no value. The repo is the root runway's `providers.github` unless `--repo`
 *           names it. A `--previous` file of another environment, or one that does not parse, is refused.
 * Runtime: node
 * Governing contract: ADR 0533 (decision 3); ADR 0352 (decision 6); ADR 0506 (decision 8); ADR 0159 (decision 3);
 *                     STA-2104; STA-2866.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { Argument, Command, Option, UsageError, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { z } from "zod";

import { MIGRATION_SAFETY_FILE_SCHEMA } from "#core/constants/migration-safety-file-schema.constant";
import { SERVICE_TARGETS } from "#core/constants/service-targets.constant";
import { RunwayKind } from "#core/enums/runway-kind.enum";
import { deployEvidence } from "#core/functions/deploy-evidence.function";
import { migrationKeysOf } from "#core/functions/migration-keys-of.function";
import type { DeployEvidence } from "#core/types/deploy-evidence.type";
import type { DeployMigrations } from "#core/types/deploy-migrations.type";
import type { MigrationStream } from "#core/types/migration-stream.type";
import { readRunway } from "#node/functions/read-runway.function";
import { repositoryRoot } from "#node/functions/repository-root.function";

/** A previous deploy's `runway-migrations` file. */
const MIGRATIONS_FILE_SCHEMA = z.object({
  schema: z.literal("runway.migrations/v1"),
  environment: z.string(),
  sha: z.string(),
  migrations: z.array(z.string()),
});

/** Writes one deploy job's evidence for the approvals bot. */
export class RunwayEvidenceCommand extends Command({
  name: "evidence",
  bin: true,
  description:
    "Write the approvals bot's evidence for one deploy job (rollout, destructive migrations)",
  examples: [
    "runway evidence production --target cloudflare-workers --member docs --sha <sha>",
    "runway evidence production --target encore-cloud --sha <sha> --json",
    "runway evidence production --target encore-cloud --sha <sha> --previous runway-migrations-production.json",
  ],
}) {
  /** The environment the job deploys. */
  @Argument({ description: "The runway environment the job deploys" })
  environment!: string;

  /** The destination target. */
  @Option({
    description: "The target, a key of runway.yaml `targets` (for example cloudflare-workers)",
  })
  @Str
  target?: string;

  /** The commit the job deploys. */
  @Option({ description: "The full commit SHA the job deploys" })
  @Str
  sha?: string;

  /** The member, when the job ships one. */
  @Option({ description: "The member the job ships (default: the whole target)" })
  @Str
  member?: string;

  /** The repository, when the root runway does not name it. */
  @Option({ description: "owner/repo (default: the root runway's providers.github)" })
  @Str
  repo?: string;

  /** The previous deploy's migrations file. */
  @Option({
    description:
      "The runway-migrations file the previous deploy to this environment wrote (default: unknown, so a destructive migration is floor)",
  })
  @Str
  previous?: string;

  /**
   * Writes the file and resolves with the evidence.
   *
   * @throws UsageError without `--target`, without a full `--sha`, with no repository to name, or with a `--previous`
   *         file that does not parse or names another environment.
   */
  handle(io: CommandIo): DeployEvidence {
    if (this.target === undefined)
      throw new UsageError("--target is required", "Name the target the job deploys");
    if (this.sha === undefined || !/^[0-9a-f]{40}$/.test(this.sha))
      throw new UsageError(
        "--sha must be a full commit SHA",
        "Pass the 40-character commit the job deploys",
      );
    const root = repositoryRoot(io.cwd);
    const runway = readRunway(join(root, "runway.yaml"), RunwayKind.Root);
    const github = runway.providers?.github;
    const repo = this.repo ?? (github === undefined ? undefined : `${github.org}/${github.repo}`);
    if (repo === undefined)
      throw new UsageError(
        "no repository to name",
        "Pass --repo or set providers.github in runway.yaml",
      );
    const previous = this.readPrevious(io.cwd);
    const streams = SERVICE_TARGETS.has(this.target) ? this.streams(root) : undefined;
    const migrations: DeployMigrations | undefined =
      streams === undefined ? undefined : { streams, previous };
    const config = this.wranglerConfig(root, runway.targets?.["cloudflare-workers"]?.members);
    const evidence = deployEvidence(runway, {
      repo,
      environment: this.environment,
      sha: this.sha,
      target: this.target,
      member: this.member,
      // shortcut: a commented-out "migrations" key also counts, which only errs toward floor; parse JSONC if it matters.
      migrates: config === undefined ? undefined : /"migrations"\s*:/.test(config),
      d1: config === undefined ? undefined : /"d1_databases"\s*:/.test(config),
      migrations,
    });
    const suffix = `${this.environment}${this.member === undefined ? "" : `-${this.member}`}`;
    const name = `runway-evidence-${suffix}.json`;
    writeFileSync(join(io.cwd, name), `${JSON.stringify(evidence, null, 2)}\n`);
    const shipped = migrations === undefined ? undefined : migrationKeysOf(migrations);
    if (shipped !== undefined)
      writeFileSync(
        join(io.cwd, `runway-migrations-${suffix}.json`),
        `${JSON.stringify({ schema: "runway.migrations/v1", environment: this.environment, sha: this.sha, migrations: shipped }, null, 2)}\n`,
      );
    io.output.success(
      `${name}: rollout ${String(evidence.rollout)}, destructive ${String(evidence.destructive)}`,
    );
    return evidence;
  }

  /** The Workers member's `wrangler.jsonc` text; `undefined` without the member or the file. */
  private wranglerConfig(
    root: string,
    members: Readonly<Record<string, unknown>> | undefined,
  ): string | undefined {
    const member = this.member === undefined ? undefined : members?.[this.member];
    const path =
      typeof member === "object" && member !== null && "path" in member ? member.path : undefined;
    if (typeof path !== "string") return undefined;
    const config = join(root, path, "wrangler.jsonc");
    return existsSync(config) ? readFileSync(config, "utf8") : undefined;
  }

  /**
   * The previous deploy's shipped migration keys, or `undefined` without `--previous`.
   *
   * @throws UsageError when the file does not parse or names another environment.
   */
  private readPrevious(cwd: string): readonly string[] | undefined {
    if (this.previous === undefined) return undefined;
    const path = resolve(cwd, this.previous);
    let parsed: z.infer<typeof MIGRATIONS_FILE_SCHEMA>;
    try {
      parsed = MIGRATIONS_FILE_SCHEMA.parse(JSON.parse(readFileSync(path, "utf8")));
    } catch {
      throw new UsageError(
        `--previous ${this.previous} is not a runway-migrations file`,
        "Pass the runway-migrations-<environment>.json the previous deploy's evidence step wrote",
      );
    }
    if (parsed.environment !== this.environment)
      throw new UsageError(
        `--previous ${this.previous} is ${parsed.environment}'s, not ${this.environment}'s`,
        "Pass the file the previous deploy to this environment wrote",
      );
    return parsed.migrations;
  }

  /**
   * The migration streams of the services the job ships: `services/<member>`, or every service for the whole target;
   * `undefined` when the named member has no service folder, so nothing says what it ships.
   */
  private streams(root: string): MigrationStream[] | undefined {
    const services = join(root, "services");
    if (this.member !== undefined && !existsSync(join(services, this.member))) return undefined;
    const names =
      this.member !== undefined
        ? [this.member]
        : existsSync(services)
          ? readdirSync(services, { withFileTypes: true })
              .filter(
                (entry) =>
                  entry.isDirectory() && existsSync(join(services, entry.name, "package.json")),
              )
              .map((entry) => entry.name)
          : [];
    return names.map((member) => {
      const folder = join(services, member);
      const compiledDir = join(folder, ".stackra/migrations");
      const compiled = existsSync(compiledDir)
        ? readdirSync(compiledDir)
            .filter((file) => /^\d+_.+\.up\.sql$/.test(file))
            .map((file) => file.slice(0, -".up.sql".length))
        : [];
      const file = join(folder, ".stackra/migration-safety.json");
      let safety: MigrationStream["safety"];
      try {
        safety = existsSync(file)
          ? MIGRATION_SAFETY_FILE_SCHEMA.parse(JSON.parse(readFileSync(file, "utf8")))
          : undefined;
      } catch {
        // An unreadable safety file is unknown, never an empty stream.
        safety = undefined;
      }
      return { member, safety, compiled };
    });
  }
}
