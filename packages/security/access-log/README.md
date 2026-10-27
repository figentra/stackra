# @stackra/access-log

Application-level access logs (ADR 0212 decision 5): the class facet `@AccessLogged({ classification, subjects })`
writes one record per call of a marked action, query or service to the `AccessLogSink` port, and each sink stores the
records as a SHA-256 hash chain, so a changed, removed or reordered record fails verification (ADR 0212 decision 3).
pgaudit covers direct database sessions; this package covers the application.

**Tier:** `tier:lib` (`packages/security/access-log`). Entries `.`, `./contracts`, `./node` and `./testing`. Depends on
`@stackra/actions`, `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/database`,
`@stackra/errors`, `@stackra/iam`, `@stackra/model`, `@stackra/tenancy` and `@stackra/validation`.

## Use

```ts
// an action: each `handle` call is logged against the principal the call is for
@AccessLogged({ classification: DataClassification.Pseudonymous })
export class CancelOrderAction extends Action({ key: "order.cancel", actors: [ActorKind.User] }) {}

// a service: each call is logged against the `customerId` of the records it handles
@AccessLogged({ classification: DataClassification.Pseudonymous, subjects: "customerId" })
export class OrderService extends CrudService<Order> {}

// a host's config override: same name, package class aliased
import { AccessLogConfig as BaseAccessLogConfig } from "@stackra/access-log";
export class AccessLogConfig extends BaseAccessLogConfig {
  override retentionDays = 730;
}

// a host table that stores a classification: the package's macro writes the column
schema.create("data_exports", (t: Blueprint) => {
  t.dataClassification("classification")
    .notNull()
    .comment("The classification of the exported data.");
});

// a host's own sink replaces the drivers, and chains with the package's function
@Replaces(AccessLogSink)
export class SiemAccessLogSinkDriver extends Driver(AccessLogSink) {}
```

`DataClassification` is `@stackra/contracts`'. The facet wraps the methods the class itself declares (`handle` on an
action, every declared method on a service), never inherited ones. A call that touched no subject writes no record. A
sink failure is logged as `access_log_write_failed` and never fails the call. A wrapped method called outside an action
or query call throws, because `RequestContext` has no actor to log.

## What is here

| Entry         | Symbol                                                                | Use                                                               |
| ------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `.`           | `AccessLogged`                                                        | the class facet, made with `createDecorator`                      |
| `.`           | `AccessLogService`                                                    | builds each record; fails open, or closed for `failClosed`        |
| `.`           | `AccessLogConfig`, `AccessLogOptions`, `AccessLogConfig$`             | `sink`, `retentionDays` (400, ≥90), `failClosed` classes          |
| `.`           | `MemoryAccessLogSinkDriver`                                           | one chain in memory, for tests and `sink: "memory"`               |
| `.`           | `OutboxAccessLogSinkDriver`, `AccessRecorded`                         | `sink: "outbox"`: each record to the audit service as an event    |
| `.`           | `linkAccessRecord`, `findChainBreak`                                  | build the next link; find the first broken link of a run          |
| `.`           | `AccessLogWriteFailedError`, `ACCESS_LOG_WRITE_FAILED`                | the sink's refusal and the log event, one code                    |
| `./contracts` | `AccessLogSink`                                                       | the port                                                          |
| `./contracts` | `AccessRecord`, `AccessLink`, `AccessLoggedOptions`                   | types                                                             |
| `./node`      | `AccessLogModule`, `AccessLogExplorer`                                | the root module and the facet's Explorer                          |
| `./node`      | `PostgresAccessLogSinkDriver`, `AccessLogEntry`                       | the production sink and its tenant-owned, append-only table       |
| `./node`      | `DataClassificationMacro`                                             | `t.dataClassification(column)` for any host table                 |
| `./node`      | `PurgeAccessLogAction`, `PurgeAccessLogInput`, `PurgeAccessLogOutput` | the nightly retention job                                         |
| `./node`      | `AccessLogEntryPermissions`                                           | `purge` (L2, system): the permission the retention job runs under |
| `./testing`   | `AccessLogSinkFake`, `AccessLogEntryFactory`, `toHaveLoggedAccess`    | a failing-capable fake, rows, the matcher                         |

No symbol is exported from two entries. `src/{contracts,core,node,testing}/index.ts` are stand-in barrels until gen
writes the entry barrels (STA-339).

## The hash chain

Each record is a link: `sequence` (from 1, no gaps), `previousHash` (64 zeros for the first) and `hash`, the SHA-256 of
the previous hash, the sequence and the record as canonical JSON (keys sorted, so a jsonb round trip hashes the same).
`linkAccessRecord(record, head)` builds the next link and `findChainBreak(links)` returns the sequence of the first link
that does not match its content or does not follow the one before, or `undefined`. The first link given is the anchor,
so a chain whose oldest links the retention job purged still verifies from its oldest kept link.

In Postgres there is one chain per tenant: `access_log.access_log_entries` is tenant-owned (`BelongsToTenant` and
`t.belongsToTenant()` from `@stackra/tenancy`), the unique `(tenant_id, sequence)` index keeps it linear, and a trigger
refuses every UPDATE. The driver writes in a transaction of its own (a rolled-back read keeps its record) inside
`withTenant(record.actor, ...)`; a writer that loses the race to the head reads the new head and retries, up to five
times. A call in no tenant cannot be stored there and is reported as `access_log_write_failed`.

## Retention

`PurgeAccessLogAction` (`access_log.access_log_entry.purge@1`) runs at 03:30 UTC once per tenant and deletes the
records older than `AccessLogConfig.retentionDays` (400 by default, about the thirteen months hot of ADR 0212 decision
6; at least 90). It is the only delete of the table.

## Not here

- The daily KMS-signed checkpoint, S3 Object Lock, cold storage and `stackra audit:verify` (ADR 0212 decisions 3 and 6):
  `findChainBreak` is what a verifier calls.
- The audit-trail resource and its search, the `read` and `purge` permission statics, and the `Queues.Maintenance`
  queue: they need `@stackra/panel`, `@stackra/iam` and gen's `#stackra/queues`, which are not built yet. The job uses
  the default queue and its derived permission.
