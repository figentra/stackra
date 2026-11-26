/**
 * Stackra file contract:
 * Purpose: `DbMigrateCommand`, `stackra db migrate [--env <environment>]`: applies the member's pending migrations in
 *          order and lists them (`--json`: the environment and the applied names). It is the release step, in every
 *          environment, SaaS and on-prem. On preview, staging and production it applies exactly the committed SQL:
 *          inside a git checkout whose `.stackra/migrations` differs from the commit (a changed, staged, deleted,
 *          untracked or ignored `.sql` file, as a release job that ran `stackra gen` or a dirty checkout would hold) it
 *          refuses with exit 1 and names the files, the rule runway's Encore deploy holds (STA-2788). Dev and test
 *          apply the stream as gen wrote it; outside a checkout (an installed artifact) the shipped stream applies.
 * Boundary: runs in the member's folder through its own `@stackra/database/node`; the CLI holds no database driver.
 *           The connection comes from the member's runway and config, never from an argument. The refusal comes before
 *           the runner loads, so a refused run touches no database.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2 as amended 2026-10-24: `stackra db migrate` is a release step); ADR 0282
 *                     (decision 3); ADR 0352 (amended 2026-11-07: infra is figentra/infra's Pulumi stacks, never a CLI command); ADR 0506;
 *                     STA-1966; STA-2788 (the committed compiled migrations are what deploys).
 */
import { Command, CommandError, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { COMMITTED_SQL_ENVIRONMENTS } from "#node/constants/committed-sql-environments.constant";
import { committedMigrationDrift } from "#node/functions/committed-migration-drift.function";
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

  /** Applies the migrations and returns what it applied. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const environment = databaseEnvironment({ env: this.env });
    if (COMMITTED_SQL_ENVIRONMENTS.includes(environment)) {
      const drift = committedMigrationDrift(io.cwd) ?? [];
      if (drift.length > 0)
        throw new CommandError(
          `stackra db migrate is refused on ${environment}: ${drift.length} compiled migration file(s) differ from the commit`,
          {
            why:
              `${drift.slice(0, 5).join("; ")}${drift.length > 5 ? "; …" : ""} — a release applies only the committed ` +
              "SQL, the SQL the pull request showed and Squawk linted (STA-2788)",
            fix: "run stackra gen, commit the compiled migrations and migrate from that commit",
          },
        );
    }
    const { applied } = await (
      await loadDatabaseRunner(io.cwd)
    ).migrate({ cwd: io.cwd, environment });
    if (applied.length === 0) io.output.info(`db migrate (${environment}): no pending migrations`);
    else {
      io.output.success(`db migrate (${environment}): applied ${applied.length}`);
      io.output.list(applied);
    }
    return { environment, applied };
  }
}
