/**
 * Stackra file contract:
 * Purpose: `Migration`, the kind base of a schema migration: `class X extends Migration { up(schema) {} }`, or
 *          `extends Migration({ after: [Migrations.search.createTextFunctions] })` when another member's migration
 *          must run first.
 * Boundary: both forms, made with `createKind`; the called form checks and records `after`. A migration only states
 *           `up(schema)`: it imports nothing but @stackra/database and `#stackra/migrations`, names tables and columns
 *           with literals, has no `down()` (gen derives the dev inverse) and writes no data.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0294 and ADR 0305; ADR 0294 (decision 25: kind bases).
 */
import { createKind } from "@stackra/container";

import type { MigrationClass } from "#core/types/migration-class.type";
import type { MigrationOptions } from "#core/types/migration-options.type";
import type { SchemaBuilder } from "#core/types/schema-builder.type";

/** A migration id: `<module>.<NNNN>_<snake stem>`. */
const MIGRATION_ID = /^[a-z][a-z0-9_]*\.\d{4}_[a-z0-9_]+$/;

/** The instance side every migration shares. */
export abstract class MigrationBase {
  /** Type-only kind brand, so a class of another kind cannot stand in for a migration. */
  declare readonly "~kind": "migration";

  /** Records the schema changes, in order, on `schema`; the compiler turns them into SQL steps. */
  abstract up(schema: SchemaBuilder): void;
}

/** A migration instance. */
export type Migration = MigrationBase;

/** Checks the options of the called form. */
function read(options: MigrationOptions = {}) {
  const { after = [] } = options;
  if (!Array.isArray(after))
    throw new TypeError("Migration({ after }) lists migration ids from #stackra/migrations");
  for (const id of after)
    if (typeof id !== "string" || !MIGRATION_ID.test(id))
      throw new TypeError(
        `Migration({ after }) takes ids such as "search.0001_create_text_functions", got ${JSON.stringify(id)}`,
      );
  return { after: Object.freeze([...after]) };
}

/**
 * The migration kind base.
 *
 * @example
 * export class OrdersPaidAtIndexMigration extends Migration {
 *   up(schema: SchemaBuilder): void {
 *     schema.table("orders", (t: Blueprint) => {
 *       t.index(["status", "paid_at"]).concurrently();
 *     });
 *   }
 * }
 */
export const Migration = createKind("migration", MigrationBase, read) as MigrationClass &
  ((options: MigrationOptions) => MigrationClass);
