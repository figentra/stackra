# Feature Specification: `@stackra/access-log` wave 5, the access-log facet and its hash chain

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/access-log` (security, wave 5, registry row "`@AccessLogged` facet, hash-chain sink,
Explorer"), porting the template's golden sample `@acme/access-log` to the v3.1 shape: the class facet and its
Explorer, the `AccessLogSink` port with memory and Postgres drivers that store the records as a hash chain, the
append-only access record table with its migration and classification macro, the retention job, and the testing fake
and matcher.

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's commerce service adopts it once converted, STA-344)
- **Packages touched**: `packages/security/access-log` (new member)
- **Cross-service events**: none
- **Tenancy and data**: one tenant-owned table, `access_log.access_log_entries`, through @stackra/tenancy's
  `BelongsToTenant` and `t.belongsToTenant()` (forced equality policy on `tenant_id`), append-only by a trigger; one
  hash chain per tenant; ids only, never the data that was read
- **Secrets**: none
- **ADR needed**: no (ADR 0212, 0144 as amended by 0294, 0159 as amended, 0127 2026-10-24 note and 0323 decide it)
- **New dependencies**: none outside the workspace and the catalogs; runtime edges to actions, config, container,
  contracts, database, errors, model, tenancy and validation, and `zod` from the default catalog
- **Deploy modes**: same code in all
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/security/access-log/README.md`, `packages/security/access-log/AGENTS.md`; ADR 0212, 0144 and 0159 are cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R3 (audit evidence: a defect loses or forges access records)

## Clarifications

### Session 2026-10-25

The package follows ADR 0212, the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and
v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- ADR 0212 d3: the sinks chain the records (SHA-256 over the previous hash, the sequence and the record as canonical
  JSON); in Postgres one chain per tenant, kept linear by a unique (tenant, sequence) index; verification anchors on the
  oldest kept link, so retention does not break it
- `DataClassification` is `@stackra/contracts`' (its file names the access log as a reader), so it is imported, not
  redeclared; the template's `@acme/access-log/contracts` import moves to `@stackra/contracts`
- The sample deduplicated by `callId`, which drops the second record of a call that runs two logged methods (an action
  and the service it calls); records are not deduplicated, and `callId` ties the records of one call
- ADR 0323 d1: tenancy's trait and macro are used, not redeclared; no `tenant` identifier is declared here (R-59)
- The Postgres write runs in its own transaction inside `withTenant(record.actor, ...)`, because a new transaction does
  not carry the caller's tenant setting
- No `@stackra/iam`, `@stackra/panel` or generated `#stackra/queues` yet: the job's key is `access_log_entry.purge`, so
  its permission is derived; it runs on the default queue; the audit-trail resource and search wait for the panel
- ADR 0212 open question 1 stays as the sample has it: a failed record never blocks the read

## User Scenarios & Testing

### User Story 1 - Log every read of classified data (Priority: P1)

A service marks an action or a service `@AccessLogged({ classification, subjects })`; every call of a declared method
writes one record naming the call, the actor and the people whose data it touched.

**Independent Test**: `src/node/__tests__/access-log.explorer.test.ts`, `src/core/services/__tests__/access-log.service.test.ts`, `src/core/decorators/__tests__/access-logged.decorator.test.ts`.

**Acceptance Scenarios**:

1. **Given** a marked service in a booted container, **When** a declared method is called inside an action call,
   **Then** one record names `<Class>.<method>`, the call id, the actor and the subject ids.
2. **Given** a sink that fails, **When** a marked method is called, **Then** the call succeeds and
   `access_log_write_failed` is logged.
3. **Given** a facet with no `subjects`, **When** a service acting for a customer calls, **Then** the record names the
   customer.

### User Story 2 - Detect a tampered or missing record (Priority: P1)

An auditor reads a tenant's records in sequence order and calls `findChainBreak`; a changed, removed or reordered
record is found at its sequence.

**Independent Test**: `src/core/functions/__tests__/find-chain-break.function.test.ts`, `src/core/functions/__tests__/link-access-record.function.test.ts`, `src/core/drivers/__tests__/memory-access-log-sink.driver.test.ts`, `src/node/drivers/__tests__/postgres-access-log-sink.driver.test.ts`.

### User Story 3 - Keep records for the retention window only (Priority: P2)

The nightly job deletes each tenant's records older than `retentionDays`.

**Independent Test**: `src/node/actions/__tests__/purge-access-log.action.test.ts`, `src/config/__tests__/access-log.config.test.ts`.

### User Story 4 - Assert access in a host's tests (Priority: P2)

A host test overrides the sink with `AccessLogSinkFake` or uses the memory sink and asserts with `toHaveLoggedAccess`.

**Independent Test**: `src/testing/__tests__/to-have-logged-access.matcher.test.ts`, `src/testing/__tests__/access-log-sink.fake.test.ts`.

### Edge Cases

- A call that touched no subject: no record.
- A wrapped method called outside an action or query call: `RequestContext` throws (a missing context is a bug).
- Two writers read the same chain head: one loses on the unique index, reads the new head and retries, up to five times.
- A call in no tenant: the tenant column is NOT NULL, so the Postgres sink cannot store it; the failure is logged.
- A purge of a chain's oldest links: the rest still verifies from the oldest kept link.
- An UPDATE of a stored record: refused by the trigger.

## Requirements

- **FR-001**: The package SHALL be `@stackra/access-log` at `packages/security/access-log`, `tier:lib`, entries `.`,
  `./contracts`, `./node` and `./testing` only.
- **FR-002**: `@AccessLogged` SHALL be a class facet made with `createDecorator`, kind `access_logged`, allowed on
  actions, queries and services only.
- **FR-003**: `AccessLogExplorer` SHALL wrap every method the marked class declares at bootstrap, record each call
  after it settles (a throwing call against its arguments), keep a synchronous method synchronous, and list the same
  targets gen discovers.
- **FR-004**: `AccessLogService.record` SHALL resolve the subjects (the principal by default, else the distinct values
  of the named field among the arguments and the result), write nothing for none, and never reject.
- **FR-005**: `linkAccessRecord` and `findChainBreak` SHALL build and verify a SHA-256 hash chain over canonical JSON,
  the first link following 64 zeros, the first given link being the anchor.
- **FR-006**: `MemoryAccessLogSinkDriver` and `PostgresAccessLogSinkDriver` SHALL store each record as the next link
  of its chain, never forking it; the Postgres driver SHALL write in its own transaction under the record's tenant and
  refuse with `AccessLogWriteFailedError` after five lost races.
- **FR-007**: `CreateAccessLogEntriesMigration` SHALL compile with every column stated and commented, the tenant
  policy, the unique (tenant, sequence) index and the UPDATE-refusing trigger with its inverse; `DataClassificationMacro`
  SHALL write the checked classification column.
- **FR-008**: `PurgeAccessLogAction` SHALL be a system-only nightly per-tenant job that deletes the records older than
  `AccessLogConfig.retentionDays` (400 by default, at least 90) and reports how many.
- **FR-009**: `AccessLogSinkFake` and `toHaveLoggedAccess` SHALL record writes (failing on demand) and assert a
  matching record on the memory sink or the fake.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package and the validator reports nothing for it (owner mode: no
  typecheck here).

## Open items (for the owner, not blocking)

- Not built (outside this package or waiting on another): the daily KMS-signed checkpoint, S3 Object Lock and cold
  storage, `stackra audit:verify` (ADR 0212 d3, d6); the audit-trail resource and its search (`@stackra/panel`); the
  `AccessLogEntryPermissions` statics (`@stackra/iam`); `Queues.Maintenance` (gen's `#stackra/queues`).
- The generated schema exports of the sample's `./node` entry (`AccessLogEntry$`, `PurgeAccessLogInput$`,
  `PurgeAccessLogOutput$`, `PurgeAccessLogAction$`) and `DataClassification$` come from gen (STA-339).
- `CHANGELOG.md` is not written here: the repository hook reserves it for Changesets.

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · spec for a package written in owner mode (develop now, test later)
