/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/data-maintenance (the system jobs with their input and
 *          output schemas: partition upkeep, record retention and time series rollups over @stackra/database, the
 *          full-text and semantic reindex and the search query log over @stackra/search, change log upkeep and the
 *          outbox prune over @stackra/outbox; `searchReindex`, the half of the `stackra search:reindex` runner that
 *          queues a reindex job; `QueuedSearchQueryLogDriver`, the search query log that queues its entries; and the tenant synonym sets: `Synonym`, `SynonymService`, `DatabaseSynonymSourceDriver` (search's `SynonymSource`), three actions and a list query) until
 *          `stackra gen` writes the entry barrels and the generated `DataMaintenanceModule` (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: every job reaches Postgres through the package
 *           that does its work. The permissions are the `.` entry's.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (an entry exists once its folder has a file);
 *                     the STA-347 stand-in barrel decision; ADR 0462 (decision 1).
 */
export { CreateSynonymAction } from "#node/actions/create-synonym.action";
export { DeleteSynonymAction } from "#node/actions/delete-synonym.action";
export { MaintainChangeLogAction } from "#node/actions/maintain-change-log.action";
export { MaintainPartitionsAction } from "#node/actions/maintain-partitions.action";
export { PruneOutboxAction } from "#node/actions/prune-outbox.action";
export { PruneRecordsAction } from "#node/actions/prune-records.action";
export { RecordSearchQueryAction } from "#node/actions/record-search-query.action";
export { UpdateSynonymAction } from "#node/actions/update-synonym.action";
export { RollUpTimeSeriesAction } from "#node/actions/roll-up-time-series.action";
export { ReindexSearchAction } from "#node/actions/reindex-search.action";
export { ReindexSemanticAction } from "#node/actions/reindex-semantic.action";
export { DatabaseSynonymSourceDriver } from "#node/drivers/database-synonym-source.driver";
export { QueuedSearchQueryLogDriver } from "#node/drivers/queued-search-query-log.driver";
export { searchReindex } from "#node/functions/search-reindex.function";
export { Synonym } from "#node/models/synonym.model";
export { ListSynonymsQuery } from "#node/queries/list-synonyms.query";
export { CreateSynonymInput } from "#node/schemas/create-synonym-input.schema";
export { CreateSynonymOutput } from "#node/schemas/create-synonym-output.schema";
export { DeleteSynonymInput } from "#node/schemas/delete-synonym-input.schema";
export { DeleteSynonymOutput } from "#node/schemas/delete-synonym-output.schema";
export { ListSynonymsInput } from "#node/schemas/list-synonyms-input.schema";
export { ListSynonymsOutput } from "#node/schemas/list-synonyms-output.schema";
export { MaintainChangeLogInput } from "#node/schemas/maintain-change-log-input.schema";
export { MaintainChangeLogOutput } from "#node/schemas/maintain-change-log-output.schema";
export { MaintainPartitionsInput } from "#node/schemas/maintain-partitions-input.schema";
export { MaintainPartitionsOutput } from "#node/schemas/maintain-partitions-output.schema";
export { PruneOutboxInput } from "#node/schemas/prune-outbox-input.schema";
export { PruneOutboxOutput } from "#node/schemas/prune-outbox-output.schema";
export { PruneRecordsInput } from "#node/schemas/prune-records-input.schema";
export { PruneRecordsOutput } from "#node/schemas/prune-records-output.schema";
export { RecordSearchQueryInput } from "#node/schemas/record-search-query-input.schema";
export { RollUpTimeSeriesInput } from "#node/schemas/roll-up-time-series-input.schema";
export { RollUpTimeSeriesOutput } from "#node/schemas/roll-up-time-series-output.schema";
export { ReindexSearchInput } from "#node/schemas/reindex-search-input.schema";
export { ReindexSearchOutput } from "#node/schemas/reindex-search-output.schema";
export { SynonymView } from "#node/schemas/synonym-view.schema";
export { UpdateSynonymInput } from "#node/schemas/update-synonym-input.schema";
export { UpdateSynonymOutput } from "#node/schemas/update-synonym-output.schema";
export { SynonymService } from "#node/services/synonym.service";
export { DATA_MAINTENANCE_ENTITIES } from "#node/entities.gen";
