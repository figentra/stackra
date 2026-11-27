/**
 * Stackra file contract:
 * Purpose: `RunwayMigrationsRecordCommand`, `runway migrations:record <environment> --target <t> --sha <sha>
 *          [--member <m>]`: run after a deploy job's deploy step succeeded, it writes
 *          `runway-migrations-<environment>[-<member>].json` (`runway.migrations/v1`) in the working folder: the
 *          `<member>:<id>` key of every migration the deploy applied (`migrationKeysOf`), which the next deploy to the
 *          environment passes to `runway evidence --previous`, so `destructive` names only what is new. Only a deploy
 *          that succeeded records: a rejected, failed or cancelled one leaves the previous record in force, so a
 *          migration it did not apply still counts as new.
 * Boundary: reads the root runway's path only to find the repository, and each shipped service's
 *           `.stackra/migration-safety.json` and `.stackra/migrations` file names (`readMigrationStreams`); writes that
 *           one file and nothing else; no network and no value. When a service's classes are missing or stale it
 *           writes nothing and warns: the next evidence then reads an older record, so more counts as new (floor).
 * Runtime: node
 * Governing contract: ADR 0533 (decision 3); ADR 0159 (decision 3); ADR 0506 (decision 8); STA-2866.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { Argument, Command, Option, UsageError, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import type { z } from "zod";

import type { RUNWAY_MIGRATIONS_FILE_SCHEMA } from "#core/constants/runway-migrations-file-schema.constant";
import { SERVICE_TARGETS } from "#core/constants/service-targets.constant";
import { migrationKeysOf } from "#core/functions/migration-keys-of.function";
import { readMigrationStreams } from "#node/functions/read-migration-streams.function";
import { repositoryRoot } from "#node/functions/repository-root.function";

/** Records the migrations a successful deploy applied. */
export class RunwayMigrationsRecordCommand extends Command({
  name: "migrations:record",
  bin: true,
  description:
    "After a deploy succeeded, record the migrations it applied for the next deploy's evidence",
  examples: [
    "runway migrations:record production --target encore-cloud --sha <sha>",
    "runway migrations:record production --target encore-cloud --member billing --sha <sha> --json",
  ],
}) {
  /** The environment the job deployed. */
  @Argument({ description: "The runway environment the job deployed" })
  environment!: string;

  /** The destination target. */
  @Option({
    description: "The service target, a key of runway.yaml `targets` (for example encore-cloud)",
  })
  @Str
  target?: string;

  /** The commit the job deployed. */
  @Option({ description: "The full commit SHA the job deployed" })
  @Str
  sha?: string;

  /** The member, when the job shipped one. */
  @Option({ description: "The member the job shipped (default: every service)" })
  @Str
  member?: string;

  /**
   * Writes the record and resolves with it, or `undefined` when the classes are missing or stale.
   *
   * @throws UsageError without `--target` or with one that ships no service migrations, or without a full `--sha`.
   */
  handle(io: CommandIo): z.infer<typeof RUNWAY_MIGRATIONS_FILE_SCHEMA> | undefined {
    if (this.target === undefined || !SERVICE_TARGETS.has(this.target))
      throw new UsageError(
        "--target must name a service target",
        `Pass the target the job deployed, one of ${[...SERVICE_TARGETS].join(", ")}`,
      );
    if (this.sha === undefined || !/^[0-9a-f]{40}$/.test(this.sha))
      throw new UsageError(
        "--sha must be a full commit SHA",
        "Pass the 40-character commit the job deployed",
      );
    const streams = readMigrationStreams(repositoryRoot(io.cwd), this.member);
    const migrations = streams === undefined ? undefined : migrationKeysOf({ streams });
    const name = `runway-migrations-${this.environment}${this.member === undefined ? "" : `-${this.member}`}.json`;
    if (migrations === undefined) {
      io.output.warn(
        `${name} not written: a service's migration classes are missing or stale (run stackra gen before the deploy); the next evidence reads the older record, so more counts as new`,
      );
      return undefined;
    }
    const record = {
      schema: "runway.migrations/v1" as const,
      environment: this.environment,
      sha: this.sha,
      migrations,
    };
    writeFileSync(join(io.cwd, name), `${JSON.stringify(record, null, 2)}\n`);
    io.output.success(`${name}: ${String(migrations.length)} migrations applied`);
    return record;
  }
}
