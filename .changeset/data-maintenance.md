---
"@stackra/data-maintenance": minor
---

Add `@stackra/data-maintenance`, the add-on above `@stackra/iam` that holds the data layer's system jobs with their
system-held permissions (ADR 0462 decision 1): `data_maintenance.partition.maintain` and `data_maintenance.record.prune`
over `@stackra/database`, `data_maintenance.index.reindex` and `data_maintenance.index.reindex_semantic` over
`@stackra/search` with the `searchReindex` runner, and `data_maintenance.change_log.maintain` and
`data_maintenance.outbox_message.prune` over `@stackra/outbox`. Their permissions are `PartitionPermissions`,
`RecordPermissions`, `IndexPermissions`, `ChangeLogPermissions` and `OutboxMessagePermissions`: L4 system for the jobs
that drop or delete data, L2 system for the reindex jobs. `ReindexSearchInput.version` (and
`searchReindex({ version })`) runs a versioned rebuild and swap of `@stackra/search`. `data_maintenance.query.record` (`RecordSearchQueryAction`,
`QueryPermissions.record`, L2 system) writes the search query log, queued by `QueuedSearchQueryLogDriver`, the bound
`SearchQueryLog` over `@stackra/search`'s abstract `PostgresSearchQueryLogDriver`. `data_maintenance.timeseries.rollup`
(`RollUpTimeSeriesAction`, `TimeseriesPermissions.rollup`, L4 system) keeps the `TimeSeries` rollups of
`@stackra/database` through `rollUpAllTimeSeries`.
