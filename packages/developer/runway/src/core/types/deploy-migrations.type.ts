/**
 * Stackra file contract:
 * Purpose: `DeployMigrations`, every service migration stream one deploy job ships, with the migration keys the
 *          environment's last successful deploy applied (`<member>:<id>`, from the `runway-migrations` record
 *          `runway migrations:record` wrote after it), when the job was given them.
 * Boundary: data only; built by the `runway evidence` command, judged by `destructiveOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0533 (decision 3); ADR 0159 (decision 3); STA-2866.
 */
import type { MigrationStream } from "#core/types/migration-stream.type";

/** Every migration stream of one deploy job. */
export interface DeployMigrations {
  /** The services the job ships, each with its migrations. */
  readonly streams: readonly MigrationStream[];

  /** The `<member>:<id>` keys the environment's last successful deploy applied, or `undefined` when unknown. */
  readonly previous?: readonly string[] | undefined;
}
