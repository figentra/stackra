# Feature Specification: runtime package extensions (wave 10, STA-348 ext-runtime)

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete (defaults recorded below; the owner questions are under Open items)

**Input**: Build the rows of `notes/handover/stackra-package-needs.md` for twelve existing packages: actions, outbox,
queue, scheduler, locking, realtime, collaboration, query, config, errors, logger and contracts, applying the
Recommended option of every conflict and the owner's "configuration, not code" principle.

## Impact

- **Apps touched**: none
- **Services touched**: none (OS services bind the new ports and drivers in their wiring)
- **Packages touched**: `packages/application/actions`, `packages/runtime/{outbox,queue,scheduler,locking,realtime}`,
  `packages/experience/collaboration`, `packages/state/query`, `packages/foundation/{config,errors,logger,contracts}`
- **Cross-service events**: `audit_entry.recorded` and `usage.recorded` (from every service, through the outbox)
- **Tenancy and data**: three tables in the outbox schema (`device_sequences`, `offline_cap_uses`, `replica_changes`,
  read by the caller's device, partition and scope path) and one in the collaboration schema (`snapshots`, isolated by
  scope); rooms keyed by the session's tenant
- **Secrets**: by name only: `LOCKING_VALKEY_URL`, `QUEUE_BROKER_VALKEY_URL`, `REALTIME_VALKEY_URL`,
  `ACTIONS_VALKEY_URL`, `SENTRY_DSN`, `OTEL_EXPORTER_OTLP_HEADERS`, `INFISICAL_CLIENT_ID`, `INFISICAL_CLIENT_SECRET`
- **ADR needed**: the config secret-store drivers (row says "ADR needed"); the `live_read_only` and `approval_required`
  codes need an amendment of ADR 0137; listed under Open items, none written here
- **New dependencies**: `@aws-sdk/client-secrets-manager` (catalog entry needed, optional peer of config); `iovalkey`
  (default catalog, now also used by actions, locking, queue and realtime)
- **Deploy modes**: same code everywhere; Valkey drivers are options beside the Postgres and memory defaults
- **Licence tier**: free (MIT)
- **Docs to update**: each package's README and AGENTS (done)
- **Lane**: lite
- **Change risk**: R2 (new public contracts; one pipeline stage added)

## Clarifications

### Session 2026-10-25 (defaults taken, owner mode)

- Configuration, not code: which calls need approval, which environments are live, meter quotas and prices, and which
  secrets a deployment reads are data the drivers and runway read; code holds only the mechanism.
- Actions "Postgres stores": the port docblock and the dependency direction (database depends on actions) put the
  durable idempotency and rate-limit stores in `@stackra/database`; the offline-queue stores (device sequence, offline
  cap, replica log) go to `@stackra/outbox/node`, the package whose row names them.
- Effect tags are snake_case machine codes (ADR 0231): `external_communication`, not `external-communication`.
- The approval stage sits after flag and before idempotency (ADR 0098 decision 3); the gate sees the validated input.
- `structural: true` is the option name for a live-read-only action (ADR 0359 decision 5 left the name open).
- "Broker publisher" (queue): a `BrokerPublisher` port with memory, generated-topic and Valkey-stream drivers; the
  outbox's broker `EventPublisher` publishes through it.
- "Encore CronJob driver": one CronJob per cron action (`encoreCronJobs`, `fire`) plus a minute CronJob for stored
  schedules (`tick({ crons: false })`); no `encore.dev` import.
- Realtime fan-out over Valkey pub/sub; rooms (ADR 0346) built in realtime so collaboration's realtime drivers exist.
- Contracts drivers are plain subclasses (contracts sits below container).
- Sealed payloads are the client's (`@stackra/query` `PayloadSeal`, `@stackra/storage`), already built in wave 9.

## User Scenarios & Testing

### User Story 1 - Approval, effects, live configuration and meters in the pipeline (Priority: P1)

**Independent Test**: `packages/application/actions/src/core/services/__tests__/action-pipeline.service.test.ts`
(governance block).

### User Story 2 - Shared stores across instances (Priority: P1)

Valkey drivers for locks, idempotency, rate limits, the broker and the realtime fan-out.

**Independent Test**: each `valkey-*.driver.test.ts`.

### User Story 3 - Events and offline sync leave the service durably (Priority: P1)

The broker `EventPublisher`; the Postgres device-sequence, offline-cap and scoped replica-log stores.

**Independent Test**: `packages/runtime/outbox/src/**/__tests__/`.

### User Story 4 - Live co-editing over the network (Priority: P2)

Rooms in realtime; realtime presence and sync drivers and a Postgres snapshot store in collaboration.

**Independent Test**: `realtime-rooms.service.test.ts`, `realtime-presence-channel.driver.test.ts`,
`realtime-sync-transport.driver.test.ts`, `postgres-snapshot-store.driver.test.ts`.

### User Story 5 - Telemetry and secrets in production (Priority: P1)

Sentry and OTLP reporters, the Tracer port, field encryption, Infisical and AWS Secrets Manager stores.

**Independent Test**: the driver tests in errors, logger, contracts and config.

### Edge Cases

- A viewer's `update` is refused `forbidden` and the member stays; a member over a cap is dropped.
- A secret store `get` before `load` throws, so a missing load never reads as a missing secret.
- A replica read below the oldest kept position refills.
- A stale lock lease never renews or frees its successor's key.

## Requirements

- **FR-001**: Each new public symbol SHALL be exported from its entry's stand-in barrel and listed in that entry's
  `index.test.ts`.
- **FR-002**: Every driver SHALL take secrets by name only and never log, list or return a value in an error.
- **FR-003**: No code SHALL hard-code a country, price, rate, provider choice or business policy.
- **FR-004**: Existing public API SHALL keep working (fields and options added, none removed).

## Success Criteria

- **SC-001**: Spec, plan, tasks and one changeset per touched package exist.
- **SC-002**: Every new public symbol has a test beside it; the tests run in the separate testing workflow (owner mode,
  2026-10-24: not run here).

## Open items (for the owner)

- An ADR for the secret-store drivers of `@stackra/config` (Infisical, AWS Secrets Manager): which one each deploy
  mode binds, and how the bootstrap credential reaches the runtime.
- An amendment of ADR 0137 for the refusal codes `live_read_only` (errors) and `approval_required` (actions).
- The `structural` option name (ADR 0359 decision 5 left it undecided).
- Effect tag spelling: snake_case `external_communication` (ADR 0231) against ADR 0099's `external-communication`.
- `@aws-sdk/client-secrets-manager` needs a catalog entry (pin with `@aws-sdk/client-s3` 3.1149.0).
- Health indicators: each infra package ships its own (port docblock); none is added to `@stackra/contracts`.
- The SSE fallback and the `collaboration.room.publish` action path of ADR 0346 decision 5 are not built.

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · owner mode: develop now, test later
