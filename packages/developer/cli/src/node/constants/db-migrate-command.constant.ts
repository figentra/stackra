/**
 * Stackra file contract:
 * Purpose: `DB_MIGRATE_COMMAND`, `stackra db migrate [--env <environment>]`: applies the member's pending migrations
 *          in order. It is the release step, in every environment, SaaS and on-prem.
 * Boundary: runs in the member's folder through its own `@stackra/database/node`; the CLI holds no database driver.
 *           The connection comes from the member's runway and config, never from an argument.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2 as amended 2026-10-24: `stackra db migrate` is a release step); ADR 0282
 *                     (decision 3); ADR 0352 (infra is `stackra runway infra`, not a CLI command).
 */
import { databaseEnvironment } from "#node/functions/database-environment.function";
import { loadDatabaseRunner } from "#node/functions/load-database-runner.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** `stackra db migrate`. */
export const DB_MIGRATE_COMMAND: CliCommand = {
  name: "db migrate",
  summary: "Apply the member's pending migrations in order (the release step)",
  usage: "stackra db migrate [--env <environment>]",
  options: { env: { type: "string" } },
  async run({ cwd, values, io }) {
    const environment = databaseEnvironment(values);
    const { applied } = await (await loadDatabaseRunner(cwd)).migrate({ cwd, environment });
    io.out(
      applied.length === 0
        ? `db migrate (${environment}): no pending migrations\n`
        : `db migrate (${environment}): applied ${applied.length}\n${applied.map((name) => `  ${name}\n`).join("")}`,
    );
    return 0;
  },
};
