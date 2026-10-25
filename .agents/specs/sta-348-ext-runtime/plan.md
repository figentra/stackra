# Plan: runtime package extensions (STA-348 ext-runtime)

**Spec**: `.agents/specs/sta-348-ext-runtime/spec.md`

## Design

- **actions**: `PipelineStage.Approval` between flag and idempotency over the optional `ApprovalGate` port
  (`ApprovalRequiredError`, `CallOptions.approvalId`); `Effect` enum on `ActionRegistration` and `CallDescriptor`;
  `structural` option checked in the tenancy step through the required `LiveConfigurationGuard`; `meter` option writing
  `UsageRecorded` through `EventOutbox` inside the unit of work; `OutboxAuditTrailDriver` writing `AuditEntryRecorded`;
  `OfflineCap.amountField`; `StoresConfig` with Valkey idempotency (claim script, `KEEPTTL`) and rate-limit (token
  bucket script) drivers in `./node`.
- **outbox**: `BrokerEventPublisherDriver` over `BrokerPublisher`; Postgres device-sequence (upward-only upsert),
  offline-cap (prune then sum) and replica-log (partition advisory lock, `ltree` scope containment) drivers with
  migration 0003.
- **queue**: `BrokerPublisher` port, `BrokerConfig`, memory, topic (structural topics from `registerBrokerTopics`) and
  Valkey-stream drivers.
- **scheduler**: `encoreCronJobs()`, `SchedulerService.fire(key)`, `tick(at, { crons })`.
- **locking**: `ValkeyLockDriver` with acquire, renew and release scripts and a token counter key.
- **realtime**: `RealtimeFanout` port, local and Valkey pub/sub drivers (new `./node` entry), `RealtimeRelay`,
  `RealtimeRooms` with caps and `RoomLimitReachedError`, `REALTIME_ROOM_PATH`, config `fanout` and `rooms`.
- **collaboration**: `RoomTokens` port, `openRoom` helper, realtime presence and sync drivers, Postgres snapshot store
  and migration (new `./node` entry), `presenceHeartbeatSeconds`.
- **query**: `OfflineCap` aliases actions' type.
- **config**: Infisical (fetch, universal auth) and AWS Secrets Manager (SDK, new `./node` entry) secret stores with
  their configurations; both load into a private map.
- **errors**: `LiveReadOnlyError`, `SentryErrorReporterDriver` (envelope over fetch) with `SentryConfig`.
- **logger**: `OtlpLogReporterDriver` (batched OTLP/JSON over fetch) with `OtlpConfig`.
- **contracts**: `Tracer` port with `TraceSpan` and `TraceAttributes`; `AesGcmFieldCipherDriver`,
  `MemoryKeyProviderDriver`, `NoopTracerDriver`.

## Constitution Check

| Law                       | Result | Note                                                                                   |
| ------------------------- | ------ | -------------------------------------------------------------------------------------- |
| Boundaries                | PASS   | no app, service or `encore.dev` import; actions still imports no database or tenancy   |
| Secrets (ADR 0173)        | PASS   | every credential is a `@Secret` name or read through `SecretStore`; canary tests       |
| Configuration, not code   | PASS   | approval rules, environments, quotas and secret lists are data the drivers read        |
| Raw SQL (ADR 0160)        | PASS   | every value bound, rows read through zod, each statement with a `raw-sql:` reason      |
| Tenancy                   | PASS   | rooms keyed by the session's tenant; offline stores bind device, partition, scope path |
| Test placement (ADR 0022) | PASS   | tests in `src/**/__tests__/` beside each subject                                       |
| Versions and catalogs     | PASS   | `catalog:` and `workspace:*` only; one catalog entry to add (spec open item)           |
