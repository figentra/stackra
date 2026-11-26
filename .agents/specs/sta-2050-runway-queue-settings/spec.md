# Feature Specification: a service runway sizes the Encore subscriptions its jobs ride

**Feature Branch**: `figentra/sta-2050-runway-queue-settings`

**Created**: 2026-11-26

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-2050

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: A service declares each job queue under `environments.<env>.queues.<name>` in its `runway.yaml`, with a
`visibilityTimeoutSeconds` and a `dlq` switch (ADR 0296). In SaaS the jobs ride the Encore Pub/Sub topic and
subscription gen writes per queue (`.stackra/encore/<member>/queues.ts`, ADR 0148 decisions 3 and 6), but gen never read
those settings: every subscription kept Encore's default ack deadline of 30 seconds, so a job that runs longer was
handed to a second worker, and a `dlq: false` was silently ignored. Gen audit finding H-25 and the Linear split of
2026-11-03 (runway keeps its schema; gen applies the settings to the subscription).

### Sources

- `packages/developer/gen/src/core/functions/emit-encore-queues.function.ts` (the subscriptions with no settings before
  this change)
- `packages/developer/gen/src/node/functions/runway-queues.function.ts` (`queue_unprovisioned`, STA-1727: it checks that
  each job queue has a runway entry, never its values)
- `packages/developer/runway/src/core/constants/service-environment-schema.constant.ts` and
  `packages/developer/runway/schema/service.json` (the queue settings)
- Encore `encore.dev/pubsub` `SubscriptionConfig` (`ackDeadline` at least 1 s, default 30 s, may be clamped by the
  target cloud; a TypeScript subscription refuses a negative `maxRetries`, so a message always ends in the dead-letter
  queue once its retries run out)
- ADR 0148 (decisions 1, 3 and 6), ADR 0296 (decision 1), ADR 0091, ADR 0124
- FR-001 to FR-005: the branch's diff against `main` and its tests

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none (every generated service gets the settings on its next gen run)
- **Packages touched**: packages/developer/gen (`MemberIR.queueSettings`, the new `QueueSettings` type export,
  `emitEncoreQueues`, discovery, the full run's warnings); packages/developer/runway (doc comment of
  `SERVICE_ENVIRONMENT_SCHEMA` only)
- **Public contract change**: additive. `MemberIR` gains the optional `queueSettings`; `@stackra/gen` exports the type
  `QueueSettings`; a full run may return the new warning `queue_dlq_unsupported`. The generated `queues.ts` gains an
  `ackDeadline` on a subscription whose queue has a runway `visibilityTimeoutSeconds`. Nothing is removed or renamed;
  the runway schema is unchanged.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none; no personal data, no secret
- **Secrets**: none
- **ADR needed**: no (applies ADR 0296 queue sizing to the ADR 0148 Encore queues, as the Linear split of 2026-11-03
  proposed)
- **New dependencies**: none (gen reads the runway file with its own `yamlValue`, so it does not depend on
  `@stackra/runway`)
- **Deploy modes**: SaaS (Encore) only; on-prem queues ride Postgres and are unchanged
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/developer/gen/README.md`, `packages/developer/gen/AGENTS.md`, the runway schema doc
  comment, `.changeset/sta-2050-queue-subscription-settings.md` (minor `@stackra/gen`, patch `@stackra/runway`)
- **Lane**: full (generated runtime behaviour and an exported type)
- **Change risk**: R1 (a service whose runway sets a visibility timeout gets that ack deadline on its next deploy)

## Glossary _(full lane)_

- **Job queue**: a queue a job action of the manifest names (`jobQueues`).
- **Ack deadline**: how long an Encore subscription waits for a delivery to finish before it hands the message out
  again; SQS calls it the visibility timeout.
- **Queue settings**: `environments.<env>.queues.<name>` of a service runway: `visibilityTimeoutSeconds`, `dlq`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A long job is not handed to a second worker (Priority: P1)

A service owner sets `visibilityTimeoutSeconds: 300` on the `billing` queue in production. After gen, the queue's
Encore subscription has `ackDeadline: "300s"`, so a four-minute job is not redelivered while it still runs.

**Why this priority**: today every job queue keeps 30 seconds whatever the runway says.

**Independent Test**: emit the queues file for the billing fixture with queue settings and read the subscription;
parse the generated file with Encore and read its metadata.

**Acceptance Scenarios**:

1. **Given** dev sets 30 and production 300 for a queue, **When** gen writes `queues.ts`, **Then** the subscription
   carries `ackDeadline: "300s"`.
2. **Given** no environment sets a timeout, **When** gen writes `queues.ts`, **Then** the subscription has no
   `ackDeadline` and Encore's 30 seconds apply.

---

### User Story 2 - A setting Encore cannot honour is reported (Priority: P2)

A service owner sets `dlq: false` on a job queue. Encore always dead-letters a message once its retries run out, so
the full gen run warns `queue_dlq_unsupported`, naming the environment and queue, and still writes.

**Why this priority**: the setting is silently ignored today; it is a warning, not an outage.

**Independent Test**: run `checkQueueSettings` on the billing fixture with queue settings.

**Acceptance Scenarios**:

1. **Given** `dlq: false` on a job queue in dev and staging, **When** gen runs in full, **Then** it returns two
   warnings, `dev.<queue>` and `staging.<queue>`, sorted by environment.
2. **Given** `dlq: true`, an unset `dlq`, or `dlq: false` on a queue no job names, **When** gen runs, **Then** no
   warning.

---

### Edge Cases

- **EC-01**: Encore reads a subscription's settings when it builds the app, so one value serves every environment; the
  largest timeout is used, so no environment hands out a job still running.
- **EC-02**: `visibilityTimeoutSeconds: 0` becomes 1 second, the least Encore accepts.
- **EC-03**: A malformed value (not a whole number of seconds from 0, not a boolean) is left out; runway's own schema
  refuses it at deploy, so gen neither refuses nor repairs it.
- **EC-04**: A queue named with no settings (`default: {}`) stays known with none.
- **EC-05**: A member that is not a service, or a service with no runway file or no `queues` block, gets no
  `queueSettings` and no warning.
- **EC-06**: The target cloud may clamp the deadline to its range (Google Cloud Pub/Sub at most 10 minutes).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: WHEN gen discovers a service member THE discovery SHALL read each environment's `queues` block of its
  `runway.yaml` into `MemberIR.queueSettings`, keeping only well-formed `visibilityTimeoutSeconds` and `dlq` values.
- **FR-002**: WHEN any environment sets `visibilityTimeoutSeconds` for a job queue THE `emitEncoreQueues` output SHALL
  set that queue subscription's `ackDeadline` to the largest such value in seconds, at least 1.
- **FR-003**: WHEN no environment sets a timeout for a job queue THE `emitEncoreQueues` output SHALL leave
  `ackDeadline` unset.
- **FR-004**: IF an environment sets `dlq: false` on a job queue of a service THEN THE full gen run SHALL return one
  `queue_dlq_unsupported` warning per environment and queue, and still write its files.
- **FR-005**: THE `@stackra/gen` entry SHALL export the type `QueueSettings`.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a service runway sets a queue's visibility timeout THE generated Encore subscription SHALL carry the
  largest one as its ack deadline, and Encore SHALL parse it as that deadline.
- **AC-002**: WHEN no timeout is set THE generated subscription SHALL keep Encore's default.
- **AC-003**: WHEN a job queue sets `dlq: false` THE full run SHALL warn `queue_dlq_unsupported` once per environment.
- **AC-004**: WHEN gen discovers a service with a runway `queues` block THE IR SHALL carry its well-formed settings.

## Success Criteria _(mandatory)_

- **SC-001**: `emit-encore-queues.function.test.ts`, `queue-ack-deadline.function.test.ts`,
  `check-queue-settings.function.test.ts` and `read-runway-queues.function.test.ts` prove AC-001 to AC-004, and the
  emit and discovery tests fail with the change reverted — verified by: unit
- **SC-002**: Encore 1.58.8 parses the generated `queues.ts` with `ack_deadline` 300 s (30 s without the line) —
  verified by: manual (`encore debug meta` inside the stackra-demo container)
- **SC-003**: the `@stackra/gen` and `@stackra/runway` tests, typecheck, oxlint and oxfmt pass — verified by: manual

## Compatibility and migration

- A service with no queue settings is unchanged. One with `visibilityTimeoutSeconds` gets that ack deadline on its next
  gen and deploy; nothing else is needed.
- `dlq: false` stays valid runway; it is a warning, not a refusal.

## Risks

- **R-1**: A large timeout in one environment raises every environment's deadline (EC-01); a crashed worker's job then
  waits longer before redelivery. Accepted: redelivering a job that still runs is the worse failure.
- **R-2**: `infra-aws-runtime` still provisions an SQS queue (and dead-letter queue) per runway queue, which no queue
  driver consumes. Removing it waits on the owner's gate 1 of the Linear split ("jobs ride Encore topics, not SQS").

## Out of scope

- The infra-aws-runtime SQS removal (R-2, owner gate).
- `maxConcurrency` and `retryPolicy` on the subscription: the runway schema has no such setting yet.
- A topic for the implicit `default` queue (gen findings H-12 and H-13, separate items).

## Assumptions

- Encore keeps reading subscription settings at build time, one value for every environment.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-2050 session) · created from the branch diff and gen audit H-25
- 2026-11-26 · Draft → Clarified · Claude (STA-2050 session) · clarifications complete (Encore subscription docs, Linear split of 2026-11-03)
- 2026-11-26 · Clarified → Planned · Claude (STA-2050 session) · plan.md
- 2026-11-26 · Planned → Tasked · Claude (STA-2050 session) · tasks.md
- 2026-11-26 · Tasked → Implementing · Claude (STA-2050 session) · T001 to T008 on the branch
