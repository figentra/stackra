/**
 * Stackra file contract:
 * Purpose: `compileMigration`, the migration compiler: runs a migration's `up(schema)` against a recording schema and
 *          returns its ordered SQL steps with their derived inverses and its `after` edges. Gen calls it for every
 *          migration and writes the ordered files; `usePostgres` applies its output in tests.
 * Boundary: pure: no database connection, no file access. It enforces the rules visible in one migration (explicit
 *           nullability and comments, expand-only column adds, online indexes, approved extensions, stated raw
 *           inverses); ordering across members, the foreign-key-target check and the step hashes are gen's.
 * Runtime: node
 * Governing contract: ADR 0159 (decisions 1 to 3; the 2026-10-23 and 2026-10-24 notes); ADR 0160; ADR 0294
 *                     (decision 20: a Postgres schema per module).
 */
import { kindOf } from "@stackra/container";

import type { MigrationBase } from "#core/bases/migration-base.base";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import { PUBLIC_ID_TEXT } from "#core/constants/public-id-text.constant";
import { SchemaRecord } from "#core/records/schema.record";
import type { CompileOptions } from "#core/types/compile-options.type";
import type { CompiledMigration } from "#core/types/compiled-migration.type";
import type { MigrationClass } from "#core/types/migration-class.type";
import type { MigrationId } from "#core/types/migration-id.type";

/**
 * Compiles one migration class.
 *
 * @throws TypeError when `type` is not a migration, the schema name is not snake_case, or a migration rule is broken.
 * @example
 * const { steps } = compileMigration(CreateOrdersMigration, { schema: "orders", createsSchema: true, macros });
 * steps[0].sql[0]; // 'create schema if not exists "orders"'
 */
export function compileMigration(type: MigrationClass, options: CompileOptions): CompiledMigration {
  const kind = kindOf(type);
  if (kind?.kind !== "migration") throw new TypeError(`${type.name} does not extend Migration`);
  quoteIdentifier(options.schema);
  const schema = new SchemaRecord(
    options.macros ?? [],
    options.publicIds === "uuid" ? "uuid" : PUBLIC_ID_TEXT,
  );
  (Reflect.construct(type, []) as MigrationBase).up(schema);
  return {
    after: (kind.options["after"] ?? []) as readonly MigrationId[],
    steps: schema.compile(options.schema, options.createsSchema ?? false),
  };
}
