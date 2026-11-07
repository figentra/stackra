/**
 * Stackra file contract:
 * Purpose: `DbRollbackCommand`, `stackra db rollback [--env <environment>]`: reverts the member's last migration batch
 *          on a dev, preview or test database and lists it (`--json`: the environment and the reverted names). It
 *          refuses any other target with exit 1, because production rolls forward.
 * Boundary: the refusal comes before the runner loads, so a refused run touches no database. Runs in the member's
 *           folder through its own `@stackra/database/node`.
 * Runtime: node
 * Governing contract: ADR 0159 (2026-10-23 and 2026-10-24 notes: rollback on dev, preview and test only; production
 *                     is forward-only); ADR 0282 (decision 3); ADR 0506; STA-1966.
 */
import { Command, CommandError, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { ROLLBACK_ENVIRONMENTS } from "#node/constants/rollback-environments.constant";
import { databaseEnvironment } from "#node/functions/database-environment.function";
import { loadDatabaseRunner } from "#node/functions/load-database-runner.function";

/** Reverts the last migration batch. */
export class DbRollbackCommand extends Command({
  name: "db:rollback",
  description: "Revert the last migration batch (dev, preview and test databases only)",
  bin: true,
}) {
  /** The target environment. */
  @Option({
    description: `${ROLLBACK_ENVIRONMENTS.join(", ")} (default: STACKRA_ENVIRONMENT, else dev)`,
  })
  @Str
  env?: string;

  /** Reverts the batch and returns what it reverted. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const environment = databaseEnvironment({ env: this.env });
    if (!ROLLBACK_ENVIRONMENTS.includes(environment))
      throw new CommandError(`stackra db rollback is refused on ${environment}`, {
        why:
          `rollback runs on ${ROLLBACK_ENVIRONMENTS.join(", ")} databases only; ` +
          "production rolls forward with a new migration (ADR 0159)",
      });
    const { reverted } = await (
      await loadDatabaseRunner(io.cwd)
    ).rollback({ cwd: io.cwd, environment });
    if (reverted.length === 0) io.output.info(`db rollback (${environment}): nothing to revert`);
    else {
      io.output.success(`db rollback (${environment}): reverted ${reverted.length}`);
      io.output.list(reverted);
    }
    return { environment, reverted };
  }
}
