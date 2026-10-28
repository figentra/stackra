<!-- Purpose: the guide to @stackra/data-maintenance: the system jobs over the data layer, their keys, schedules and system-held permissions, the search:reindex runner and the queued search query log driver. Boundary: documentation of packages/data/data-maintenance only. Runtime: none (Markdown). Governing contract: ADR 0462; ADR 0305 (rule 28); ADR 0099; ADR 0132. -->

# @stackra/data-maintenance

Stackra data maintenance: the add-on that holds the system jobs of the data layer and the permissions they derive. Every
action needs a permission (ADR 0462 decision 1), and `Permissions` lives in `@stackra/iam`, which depends on
`@stackra/database` and, through `@stackra/scope`, on `@stackra/outbox`; the data layer stays below iam. So, as
`@stackra/segments` does for its recompute job, the jobs live here, above iam, and each is a thin call into the work its
lower package (`@stackra/database`, `@stackra/search`, `@stackra/outbox`) keeps as a plain function or port method.

**Tier:** `tier:lib` (`packages/data/data-maintenance`). Entries `.` (the permissions) and `./node` (the jobs). Depends
on `@stackra/actions`, `@stackra/container`, `@stackra/contracts`, `@stackra/database`, `@stackra/iam`,
`@stackra/outbox`, `@stackra/queue` and `@stackra/scheduler` (gen's job registrations), `@stackra/search`,
`@stackra/validation` and zod. None of them depends on it.

## The jobs

Every job's only actor is the system, so none gets an endpoint or a tool. Gen registers the scheduled ones with
`registerScheduledJobs`; the two reindex jobs and the query log job are queued.

| Job (`./node`)             | Key                                         | When                      | Calls                                                          | Permission (`.`)                              |
| -------------------------- | ------------------------------------------- | ------------------------- | -------------------------------------------------------------- | --------------------------------------------- |
| `MaintainPartitionsAction` | `data_maintenance.partition.maintain@1`     | 02:15 UTC, once           | `maintainAllPartitions` of `@stackra/database`                 | `PartitionPermissions.maintain`, L4 system    |
| `PruneRecordsAction`       | `data_maintenance.record.prune@1`           | 03:00 UTC, once per scope | `pruneAllRecords` of `@stackra/database`                       | `RecordPermissions.prune`, L4 system          |
| `RollUpTimeSeriesAction`   | `data_maintenance.timeseries.rollup@1`      | every 15 min, per scope   | `rollUpAllTimeSeries` of `@stackra/database`                   | `TimeseriesPermissions.rollup`, L4 system     |
| `ReindexSearchAction`      | `data_maintenance.index.reindex@1`          | queued, unique per scope  | `reindexSearch` of `@stackra/search/node`                      | `IndexPermissions.reindex`, L2 system         |
| `ReindexSemanticAction`    | `data_maintenance.index.reindex_semantic@1` | queued, unique per scope  | `reindexSemantic` of `@stackra/search/node`                    | `IndexPermissions.reindexSemantic`, L2 system |
| `MaintainChangeLogAction`  | `data_maintenance.change_log.maintain@1`    | 02:30 UTC, once           | `ChangeFeed.maintain` of `@stackra/outbox`                     | `ChangeLogPermissions.maintain`, L4 system    |
| `PruneOutboxAction`        | `data_maintenance.outbox_message.prune@1`   | 03:15 UTC, once           | `pruneOutbox` of `@stackra/outbox`                             | `OutboxMessagePermissions.prune`, L4 system   |
| `RecordSearchQueryAction`  | `data_maintenance.query.record@1`           | queued per sampled read   | `PostgresSearchQueryLogDriver.store` of `@stackra/search/node` | `QueryPermissions.record`, L2 system          |

The jobs that drop or delete data (partitions, expired rows, expired rollup buckets, change log days, dead letters) are
L4, privileged or destructive; the reindex jobs rewrite derived data only and the query log job appends an analytics
row, so they are L2, a reversible write. All are system-held (`Permission.Lx.system()`): no role may grant them. Each
job keeps its schedule, timeout and retries, and its input and output schema is here beside it
(`MaintainPartitionsInput`, `ReindexSearchInput`, ...).

`searchReindex({ model, scope, since, semantic })` (`./node`) is the half of the `stackra search:reindex` runner that
queues `ReindexSearchAction` or `ReindexSemanticAction` in the member's queue; `searchStatus` stays in
`@stackra/search/node`. A member that wants the CLI reindex adds this package.

`QueuedSearchQueryLogDriver` (`./node`) is the `SearchQueryLog` a Postgres service binds: the abstract
`PostgresSearchQueryLogDriver` of `@stackra/search/node` (its `store`, `popular` and reports) whose `record` queues the
entry as `RecordSearchQueryAction`, off the read path; an entry without a scope is not logged.

## Install

Add `@stackra/data-maintenance` to a service that runs these jobs. Without it, the lower packages work as before but
nothing schedules their upkeep.
