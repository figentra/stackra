/**
 * Stackra file contract:
 * Purpose: `MigrationOptions`, what the called form `Migration({ after })` takes.
 * Boundary: a type only. `after` lists migrations of other members this one needs first; within a module the number
 *           orders migrations, and calling a package's macro adds an edge to that package's migrations. There is no
 *           `before`, and a released prefix never moves.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305 (order).
 */
import type { MigrationId } from "#core/types/migration-id.type";

/** The options of a migration. */
export interface MigrationOptions {
  /** Migrations of other members that must run first, by their typed ids from `#stackra/migrations`. */
  readonly after?: readonly MigrationId[];
}
