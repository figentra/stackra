/**
 * Stackra file contract:
 * Purpose: `MigrationDrift`, what `checkMigrationDrift` returns for a member: its key, the differences between its
 *          models and the schema its migrations build, the gen refusals that stopped the comparison, and whether there
 *          was anything to compare.
 * Boundary: a type only. `errors` holds discovery, migration compile and ordering refusals; a replay or missing-peer
 *           failure is thrown by `checkMigrationDrift`, not returned.
 * Runtime: node
 * Governing contract: ADR 0159; ADR 0282 (decision 3: `stackra db diff`); STA-1808.
 */
import type { GenError } from "#core/types/gen-error.type";
import type { SchemaDifference } from "#core/types/schema-difference.type";

/** The result of comparing one member's models with its migrations. */
export interface MigrationDrift {
  /** The member key. */
  readonly member: string;

  /** Where the models and the migrations disagree; empty when they agree. */
  readonly differences: readonly SchemaDifference[];

  /** The refusals that stopped the comparison; empty when it ran. */
  readonly errors: readonly GenError[];

  /** False when the member has no models and no migrations to compare (a package, an app, an empty service). */
  readonly compared: boolean;
}
