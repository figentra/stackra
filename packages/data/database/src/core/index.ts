/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/database until `stackra gen` writes the entry barrels (STA-339).
 *          The template's old `./orm` entry is folded in (ADR 0127 2026-10-24 note): `EntitySchema`, `OptionalProps`
 *          and `UniqueViolation` are MikroORM's own, re-exported, so generated entity metadata and `instanceof` checks
 *          use the classes the ORM throws and reads.
 * Boundary: names each re-export and declares nothing. The migration records, the registries and the name helpers stay
 *           internal.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note;
 *                     ADR 0097 (decision 2: the only package that imports MikroORM).
 */
export {
  EntitySchema,
  OptionalProps,
  UniqueConstraintViolationException as UniqueViolation,
} from "@mikro-orm/core";
export { CrudService } from "#core/bases/crud-service.base";
export { Macro } from "#core/bases/macro.base";
export { Migration } from "#core/bases/migration.base";
export { Seeder } from "#core/bases/seeder.base";
export { DatabaseUnitOfWorkDriver } from "#core/drivers/database-unit-of-work.driver";
export { PostgresDatabaseDriver } from "#core/drivers/postgres-database.driver";
export { Aggregate } from "#core/enums/aggregate.enum";
export { Extension } from "#core/enums/extension.enum";
export { MixedCurrencyError } from "#core/errors/mixed-currency.error";
export { compileMigration } from "#core/functions/compile-migration.function";
export { operationAction } from "#core/functions/operation-action.function";
export { operationQuery } from "#core/functions/operation-query.function";
export { registerEntities } from "#core/functions/register-entities.function";
export { registerModelPartners } from "#core/functions/register-model-partners.function";
export { repositoryOf } from "#core/functions/repository-of.function";
export { sql } from "#core/functions/sql.function";
export { table } from "#core/functions/table.function";
export { StackraNamingStrategy } from "#core/orm/stackra.naming-strategy";
export { Database } from "#core/ports/database.port";
export { GraphQuery } from "#core/services/graph-query.service";
export type { Blueprint } from "#core/types/blueprint.type";
export type { ColumnDefinition } from "#core/types/column-definition.type";
export type { ColumnGroup } from "#core/types/column-group.type";
export type { CompileOptions } from "#core/types/compile-options.type";
export type { CompiledMigration } from "#core/types/compiled-migration.type";
export type { CompiledStep } from "#core/types/compiled-step.type";
export type { DatabaseOptions } from "#core/types/database-options.type";
export type { ForeignKeyColumn } from "#core/types/foreign-key-column.type";
export type { GraphOptions } from "#core/types/graph-options.type";
export type { GraphRow } from "#core/types/graph-row.type";
export type { IndexMethod } from "#core/types/index-method.type";
export type { MacroClass } from "#core/types/macro-class.type";
export type { MetricSeries } from "#core/types/metric-series.type";
export type { MetricValue } from "#core/types/metric-value.type";
export type { MetricsOptions } from "#core/types/metrics-options.type";
export type { MigrationClass } from "#core/types/migration-class.type";
export type { MigrationId } from "#core/types/migration-id.type";
export type { MigrationOptions } from "#core/types/migration-options.type";
export type { OperationActionOptions } from "#core/types/operation-action-options.type";
export type { OperationQueryOptions } from "#core/types/operation-query-options.type";
export type { Repository } from "#core/types/repository.type";
export type { SchemaBuilder } from "#core/types/schema-builder.type";
export type { Table } from "#core/types/table.type";
export type { TableIndex } from "#core/types/table-index.type";
export type { TableOptions } from "#core/types/table-options.type";
export type { TablePage } from "#core/types/table-page.type";
export type { TableQuery } from "#core/types/table-query.type";
export type { TransactionOptions } from "#core/types/transaction-options.type";
export type { Where } from "#core/types/where.type";
export type { ColumnRef } from "#core/values/column-ref.value";
export type { MetricsReader } from "#core/values/metrics-reader.value";
