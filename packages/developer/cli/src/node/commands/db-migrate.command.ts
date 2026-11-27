/**
 * Stackra file contract:
 * Purpose: `DbMigrateCommand`, `stackra db migrate [--env <environment>] [--release <id>]`: applies the member's
 *          pending migrations in order and lists them (`--json`: the environment and the applied names). It is the
 *          release step, in every environment, SaaS and on-prem; `--release` names the release it applies (the
 *          deploy's version or commit), which contract steps' release gates compare, else `STACKRA_RELEASE`, else the
 *          commit the member's checkout is at (@stackra/console's `migrationRelease`, shared with the member console's
 *          `db:migrate`), so a deploy running it in its checkout names its
 *          release by default.
 * Boundary: runs in the member's folder through its own `@stackra/database/node`; the CLI holds no database driver.
 *           The connection comes from the member's runway and config, never from an argument. The release is passed
 *           through as given; the runner checks its shape and refuses one that is not a version, tag or commit.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2 as amended 2026-10-24: `stackra db migrate` is a release step); ADR 0282
 *                     (decision 3); ADR 0352 (amended 2026-11-07: infra is figentra/infra's Pulumi stacks, never a CLI command); ADR 0506;
 *                     STA-1966; STA-1406 (`--release`).
 */
import { Command, migrationRelease, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { databaseEnvironment } from "#node/functions/database-environment.function";
import { loadDatabaseRunner } from "#node/functions/load-database-runner.function";

/** Applies the member's pending migrations. */
export class DbMigrateCommand extends Command({
  name: "db:migrate",
  description: "Apply the member's pending migrations in order (the release step)",
  bin: true,
}) {
  /** The target environment. */
  @Option({
    description:
      "dev, preview, test, staging or production (default: STACKRA_ENVIRONMENT, else dev)",
  })
  @Str
  env?: string;

  /** The release this run applies. */
  @Option({
    description:
      "The release applied (version, tag or commit), which contract steps' release gates compare (default: STACKRA_RELEASE, else the checkout's commit)",
  })
  @Str
  release?: string;

  /** Applies the migrations and returns what it applied. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const environment = databaseEnvironment({ env: this.env });
    const release = await migrationRelease(this.release, io, process.env);
    const { applied } = await (
      await loadDatabaseRunner(io.cwd)
    ).migrate({ cwd: io.cwd, environment, ...(release === undefined ? {} : { release }) });
    if (applied.length === 0) io.output.info(`db migrate (${environment}): no pending migrations`);
    else {
      io.output.success(`db migrate (${environment}): applied ${applied.length}`);
      io.output.list(applied);
    }
    return { environment, applied };
  }
}
