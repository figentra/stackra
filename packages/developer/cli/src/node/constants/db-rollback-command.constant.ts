/**
 * Stackra file contract:
 * Purpose: `DB_ROLLBACK_COMMAND`, `stackra db rollback [--env <environment>]`: reverts the member's last migration
 *          batch on a dev, preview or test database. It refuses any other target, because production rolls forward.
 * Boundary: the refusal comes before the runner loads, so a refused run touches no database. Runs in the member's
 *           folder through its own `@stackra/database/node`.
 * Runtime: node
 * Governing contract: ADR 0159 (2026-10-23 and 2026-10-24 notes: rollback on dev, preview and test only; production
 *                     is forward-only); ADR 0282 (decision 3).
 */
import { ROLLBACK_ENVIRONMENTS } from "#node/constants/rollback-environments.constant";
import { databaseEnvironment } from "#node/functions/database-environment.function";
import { loadDatabaseRunner } from "#node/functions/load-database-runner.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** `stackra db rollback`. */
export const DB_ROLLBACK_COMMAND: CliCommand = {
  name: "db rollback",
  summary: "Revert the last migration batch (dev, preview and test databases only)",
  usage: "stackra db rollback [--env <environment>]",
  options: { env: { type: "string" } },
  async run({ cwd, values, io }) {
    const environment = databaseEnvironment(values);
    if (!ROLLBACK_ENVIRONMENTS.includes(environment)) {
      io.err(
        `stackra db rollback: refused on ${environment}: rollback runs on ${ROLLBACK_ENVIRONMENTS.join(", ")} ` +
          "databases only; production rolls forward with a new migration (ADR 0159)\n",
      );
      return 1;
    }
    const { reverted } = await (await loadDatabaseRunner(cwd)).rollback({ cwd, environment });
    io.out(
      reverted.length === 0
        ? `db rollback (${environment}): nothing to revert\n`
        : `db rollback (${environment}): reverted ${reverted.length}\n${reverted.map((name) => `  ${name}\n`).join("")}`,
    );
    return 0;
  },
};
