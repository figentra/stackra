/**
 * Stackra file contract:
 * Purpose: `DbMigrateCommand`, `stackra db migrate [--env <environment>]`: applies the member's pending migrations in
 *          order and lists them (`--json`: the environment and the applied names). It is the release step, in every
 *          environment, SaaS and on-prem.
 * Boundary: runs in the member's folder through its own `@stackra/database/node`; the CLI holds no database driver.
 *           The connection comes from the member's runway and config, never from an argument.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2 as amended 2026-10-24: `stackra db migrate` is a release step); ADR 0282
 *                     (decision 3); ADR 0352 (infra is `stackra runway infra`, not a CLI command); ADR 0506; STA-1966.
 */
import { Command, Option, type CommandIo } from "@stackra/console";
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

  /** Applies the migrations and returns what it applied. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const environment = databaseEnvironment({ env: this.env });
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
