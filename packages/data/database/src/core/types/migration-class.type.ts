/**
 * Stackra file contract:
 * Purpose: `MigrationClass`, the class `extends Migration` or `extends Migration({ after })` produces, and what
 *          `compileMigration` takes.
 * Boundary: a type only; a concrete migration has no constructor parameters (it is a frozen snapshot).
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0294 and ADR 0305.
 */
import type { MigrationBase } from "#core/bases/migration.base";

/** A migration class. */
export type MigrationClass = abstract new () => MigrationBase;
