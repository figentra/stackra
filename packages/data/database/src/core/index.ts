/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/database until `stackra gen` writes the entry barrels (STA-339).
 *          The template's old `./orm` entry is folded in (ADR 0127 2026-10-24 note): `EntitySchema`, `OptionalProps`
 *          and `UniqueViolation` are MikroORM's own, re-exported, so generated entity metadata and `instanceof` checks
 *          use the classes the ORM throws and reads. `DatabaseConfig` (with `DatabaseConfig$` and `DatabaseConfigOptions`)
 *          holds the health probe's settings.
 * Boundary: names each re-export and declares nothing. The Postgres and unit-of-work drivers live in `./node`; the
 *           `VisibilityFilter` and `HoldRegistry` ports and the `Where` type live in `./contracts`. `Projection` is the read-model kind base (its versions table's migration is found by path). The migration records, the registries, the name helpers, the
 *           block-id minting and the visibility filter function stay internal; the sequence tables' migration is found
 *           by its path (`src/node/database/migrations/`), as every migration is, so it is not re-exported.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note;
 *                     ADR 0097 (decision 2: the only package that imports MikroORM).
 */
export {
  EntitySchema,
  OptionalProps,
  UniqueConstraintViolationException as UniqueViolation,
} from "@mikro-orm/core";
export { DatabaseConfig } from "#config/database.config";
export { CrudService } from "#core/bases/crud-service.base";
export { Macro } from "#core/bases/macro.base";
export { Migration } from "#core/bases/migration.base";
export { Projection } from "#core/bases/projection.base";
export { Seeder } from "#core/bases/seeder.base";
export { Sequence } from "#core/bases/sequence.base";
export { DATABASE_CONFIG_SCHEMA as DatabaseConfig$ } from "#core/constants/database-config-schema.constant";
export { Aggregate } from "#core/enums/aggregate.enum";
export { Extension } from "#core/enums/extension.enum";
export { Isolation } from "#core/enums/isolation.enum";
export { MixedCurrencyError } from "#core/errors/mixed-currency.error";
export { AppendOnlyWriteError } from "#core/errors/append-only-write.error";
export { ModelInvalidError } from "#core/errors/model-invalid.error";
export { SystemFieldWriteError } from "#core/errors/system-field-write.error";
export { RecordHeldError } from "#core/errors/record-held.error";
export { StaleVersionError } from "#core/errors/stale-version.error";
export { DuplicateRecordError } from "#core/errors/duplicate-record.error";
export { ConstraintViolatedError } from "#core/errors/constraint-violated.error";
export { TransactionConflictError } from "#core/errors/transaction-conflict.error";
export { translateDbError } from "#core/functions/translate-db-error.function";
export { maintainAllPartitions } from "#core/functions/maintain-all-partitions.function";
export { maintainPartitions } from "#core/functions/maintain-partitions.function";
export { pruneAllRecords } from "#core/functions/prune-all-records.function";
export { pruneRecords } from "#core/functions/prune-records.function";
export { SequenceBlockClosedError } from "#core/errors/sequence-block-closed.error";
export { SequenceNotReservableError } from "#core/errors/sequence-not-reservable.error";
export { SequenceNumberOutOfOrderError } from "#core/errors/sequence-number-out-of-order.error";
export { TableFilterInvalidError } from "#core/errors/table-filter-invalid.error";
export { ancestorOf } from "#core/functions/ancestor-of.function";
export { compileMigration } from "#core/functions/compile-migration.function";
export { connectHoldRegistry } from "#core/functions/connect-hold-registry.function";
export { connectNativeWriteWatcher } from "#core/functions/connect-native-write-watcher.function";
export { connectSequenceTimeZone } from "#core/functions/connect-sequence-time-zone.function";
export { connectVisibilityFilter } from "#core/functions/connect-visibility-filter.function";
export { descendantOf } from "#core/functions/descendant-of.function";
export { disposableIds } from "#core/functions/disposable-ids.function";
export { formatSequenceNumber } from "#core/functions/format-sequence-number.function";
export { jsonContains } from "#core/functions/json-contains.function";
export { jsonPath } from "#core/functions/json-path.function";
export { operationAction } from "#core/functions/operation-action.function";
export { operationQuery } from "#core/functions/operation-query.function";
export { registerEntities } from "#core/functions/register-entities.function";
export { registerHoldLinks } from "#core/functions/register-hold-links.function";
export { registerModelPartners } from "#core/functions/register-model-partners.function";
export { registerSequences } from "#core/functions/register-sequences.function";
export { repositoryOf } from "#core/functions/repository-of.function";
export { sql } from "#core/functions/sql.function";
export { table } from "#core/functions/table.function";
export { visibleKeysQuery } from "#core/functions/visible-keys-query.function";
export { AppendOnlySubscriber } from "#core/orm/append-only.subscriber";
export { HoldSubscriber } from "#core/orm/hold.subscriber";
export { StampSubscriber } from "#core/orm/stamp.subscriber";
export { ValidateOnFlushSubscriber } from "#core/orm/validate-on-flush.subscriber";
export { StackraNamingStrategy } from "#core/orm/stackra.naming-strategy";
export { Database } from "#core/ports/database.port";
export { DatabaseConfigOptions } from "#core/schemas/database-config-options.schema";
export { GraphQuery } from "#core/services/graph-query.service";
export { SequenceService } from "#core/services/sequence.service";
export type { Blueprint } from "#core/types/blueprint.type";
export type { ColumnChange } from "#core/types/column-change.type";
export type { ColumnDefinition } from "#core/types/column-definition.type";
export type { ColumnGroup } from "#core/types/column-group.type";
export type { CompileOptions } from "#core/types/compile-options.type";
export type { CompiledMigration } from "#core/types/compiled-migration.type";
export type { CompiledStep } from "#core/types/compiled-step.type";
export type { DatabaseOptions } from "#core/types/database-options.type";
export type { NativeWrite } from "#core/types/native-write.type";
export type { PruneReport } from "#core/types/prune-report.type";
export type { NativeWriteWatcher } from "#core/types/native-write-watcher.type";
export type { ForeignKeyColumn } from "#core/types/foreign-key-column.type";
export type { GraphOptions } from "#core/types/graph-options.type";
export type { GraphRow } from "#core/types/graph-row.type";
export type { IndexMethod } from "#core/types/index-method.type";
export type { JsonPathValue } from "#core/types/json-path-value.type";
export type { EachOptions } from "#core/types/each-options.type";
export type { LockOptions } from "#core/types/lock-options.type";
export type { OffsetPage } from "#core/types/offset-page.type";
export type { PageOptions } from "#core/types/page-options.type";
export type { PageQuery } from "#core/types/page-query.type";
export type { UpsertOptions } from "#core/types/upsert-options.type";
export type { UpsertResult } from "#core/types/upsert-result.type";
export type { MacroClass } from "#core/types/macro-class.type";
export type { MetricSeries } from "#core/types/metric-series.type";
export type { MetricValue } from "#core/types/metric-value.type";
export type { MetricsOptions } from "#core/types/metrics-options.type";
export type { MigrationClass } from "#core/types/migration-class.type";
export type { MigrationId } from "#core/types/migration-id.type";
export type { MigrationOptions } from "#core/types/migration-options.type";
export type { OperationActionOptions } from "#core/types/operation-action-options.type";
export type { OperationQueryOptions } from "#core/types/operation-query-options.type";
export type { ProjectionClass } from "#core/types/projection-class.type";
export type { ProjectionOptions } from "#core/types/projection-options.type";
export type { ProjectionReadOptions } from "#core/types/projection-read-options.type";
export type { ProjectionRow } from "#core/types/projection-row.type";
export type { Repository } from "#core/types/repository.type";
export type { RowLevelSecurityOptions } from "#core/types/row-level-security-options.type";
export type { SchemaBuilder } from "#core/types/schema-builder.type";
export type { SequenceBlock } from "#core/types/sequence-block.type";
export type { SequenceClass } from "#core/types/sequence-class.type";
export type { SequenceNumber } from "#core/types/sequence-number.type";
export type { SequenceOptions } from "#core/types/sequence-options.type";
export type { SequenceRegistration } from "#core/types/sequence-registration.type";
export type { SequenceReserveOptions } from "#core/types/sequence-reserve-options.type";
export type { SequenceSeries } from "#core/types/sequence-series.type";
export type { Table } from "#core/types/table.type";
export type { TableIndex } from "#core/types/table-index.type";
export type { TableOptions } from "#core/types/table-options.type";
export type { TablePage } from "#core/types/table-page.type";
export type { TableFilter } from "#core/types/table-filter.type";
export type { TableQuery } from "#core/types/table-query.type";
export type { DatabasePool } from "#core/types/database-pool.type";
export type { SessionTimeouts } from "#core/types/session-timeouts.type";
export type { TableSort } from "#core/types/table-sort.type";
export type { TransactionOptions } from "#core/types/transaction-options.type";
export type { UpdateOptions } from "#core/types/update-options.type";
export type { PartitionReport } from "#core/types/partition-report.type";
export type { ColumnRef } from "#core/values/column-ref.value";
export type { MetricsReader } from "#core/values/metrics-reader.value";
