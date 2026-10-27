/**
 * Stackra file contract:
 * Purpose: `MigrationBase`, the instance side every `Migration` class shares: the kind brand and the abstract
 *          `up(schema)` a migration states.
 * Boundary: never extended directly: a migration extends `Migration` or `Migration({ after })` (migration.base.ts), whose
 *           prototype is this one. Not exported from the entry.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0294 and ADR 0305; ADR 0294 (decision 25: kind bases); ADR 0305
 *                     (rules 10 to 13).
 */
import type { SchemaBuilder } from "#core/types/schema-builder.type";

/** The instance side every migration shares. */
export abstract class MigrationBase {
  /** Type-only kind brand, so a class of another kind cannot stand in for a migration. */
  declare readonly "~kind": "migration";

  /** Records the schema changes, in order, on `schema`; the compiler turns them into SQL steps. */
  abstract up(schema: SchemaBuilder): void;
}
