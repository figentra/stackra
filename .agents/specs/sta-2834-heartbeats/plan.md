# Implementation Plan: crons, outbox relays and queue workers send their heartbeats

**Spec**: `.agents/specs/sta-2834-heartbeats/spec.md` · **Linear**: STA-2834 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2834-heartbeats/spec.md`

## Summary

`@stackra/queue` gains `HeartbeatService` (`beat(job)`), configured by `HeartbeatConfig` (key `queue.heartbeat`): the
`STACKRA_HEARTBEAT_URLS` secret (a JSON object of job name to `https://` URL), `minInterval` and `timeout`. The queue
worker, both outbox relays and the scheduler resolve the service from their container when it is bound and beat their
job name after each loop pass, poll or run. Queue is the home because the scheduler and the outbox already depend on
it; no new package edge is added.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/runtime/queue`, `packages/runtime/scheduler`, `packages/runtime/outbox`,
  `packages/infrastructure/infra-observability` (docs)
- **Testing**: vitest in `src/**/__tests__/`; a live HTTPS proof on box 2 (Linux)
- **Storage**: none
- **Runtime target**: node (Encore services, on-prem processes)

## Constitution Check

| Law                                   | Result | Note                                                            |
| ------------------------------------- | ------ | --------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | scheduler and outbox already import `@stackra/queue`            |
| Secrets (ADR 0009, 0173)              | PASS   | `@Secret("STACKRA_HEARTBEAT_URLS")`; no value; never logged     |
| Security                              | PASS   | `https://` only, no redirect followed, bounded by a timeout     |
| HTTP and events                       | PASS   | one `GET` to the configured URL; no event changes               |
| Tenancy                               | N/A    | a beat carries no tenant or scope                               |
| Delegation                            | PASS   | Claude only                                                     |
| Not built yet (ADR 0011)              | PASS   | Better Stack is the adopted on-call tool (ADR 0185)             |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/` beside each file                          |
| Versions and catalogs                 | PASS   | no dependency; minor changesets for queue, scheduler and outbox |
| Deploy modes (ADR 0076)               | PASS   | unset secret sends nothing (air-gapped, dev, preview)           |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                       |
| Docs and ADRs                         | PASS   | four READMEs; ADR 0184 decision 4 implemented, no new ADR       |

## Deploy modes

| Mode       | Behaviour                                                                    |
| ---------- | ---------------------------------------------------------------------------- |
| SaaS       | beats when the service's `STACKRA_HEARTBEAT_URLS` secret is synced from sops |
| On-prem    | the same, from the customer's secret store                                   |
| Air-gapped | the secret is unset: nothing is sent                                         |

## Correctness properties

- **P-001**: a worker loop pass that returns from `next` beats `queue-<queue>`, and its attempt beats it every
  `minInterval` while it runs; one that throws does not — Validates: AC-001
- **P-002**: a relay's `relay()` that took the lock and resolves beats its name; one that found the lock held or
  rejects does not — Validates: AC-002
- **P-003**: a tick beats exactly the due crons not in its failed set, then `scheduler-schedules` when the set is
  empty; `fire` beats after its pushes only — Validates: AC-003
- **P-004**: no URL, no `fetch` call — Validates: AC-004
- **P-005**: `beat` resolves for every answer, error and timeout; two calls within `minInterval` or in flight send
  one request, and after a failure none goes out before the retry gap; a network error, 408 or 5xx is tried at most
  three times in one call, a 4xx once; at most one log line per job per `minInterval`; the log carries no URL —
  Validates: AC-005
- **P-006**: the schema refuses every malformed value with a fixed message — Validates: AC-006

## Architecture overview

Each loop resolves `HeartbeatService` through the container it already holds (`SchedulerService`'s `Container`, the
relays' and the worker's connected `Resolver`), exactly as they resolve `CallIsolation` and `Logger`. Loops do not
wait for the beat (`void`); the scheduler awaits it, since an Encore CronJob invocation ends with `fire`/`tick`, and
the beat is bounded by `timeout`. A relay beats only when `Locks.tryWith` reports it ran, like the scheduler's tick, so
only the lock holder beats and a holder stuck inside the lock is not hidden by its replicas. The worker wraps a loop's
attempt in `HeartbeatService.during`, an interval of `minInterval` cleared when the attempt settles, so a job longer
than the heartbeat's period (its floor is 30 s plus a fifth in grace) keeps it up. The service keeps, per job, when the
next beat is due, the in-flight set, and when it last logged a failure with the count since.

## Components and responsibilities

- `HeartbeatService` (queue, `.`): reads the URLs once, throttles, sends, logs failures.
- `HeartbeatConfig` / `HeartbeatOptions` / `HEARTBEAT_CONFIG_SCHEMA` (queue): the secret and the two durations.
- `heartbeatUrls` (queue, internal): the one reader of the secret's shape.
- `heartbeatName` (queue, `.`): the kebab formula, the same as gen's `cronJobId`.
- `QueueWorkerService.loop` (queue, `./node`), `OutboxRelayService.relay`, `CrossAppRelayService.relay` (outbox,
  `./node`), `SchedulerService.tick` / `fire` (scheduler, `.`): the callers.
- `SCHEDULES_JOB_NAME` (scheduler, internal), `RELAY_HEARTBEATS` (outbox, internal): the names.

## Files and folders

```text
packages/runtime/queue/
  src/config/heartbeat.config.ts
  src/core/constants/heartbeat-config-schema.constant.ts
  src/core/schemas/heartbeat-options.schema.ts
  src/core/functions/heartbeat-urls.function.ts
  src/core/functions/heartbeat-name.function.ts
  src/core/services/heartbeat.service.ts
  src/core/constants/queue-log-events.constant.ts
  src/core/index.ts
  src/node/services/queue-worker.service.ts
  stackra.manifest.json
  README.md
packages/runtime/scheduler/
  src/core/constants/schedules-job-name.constant.ts
  src/core/functions/encore-cron-jobs.function.ts
  src/core/services/scheduler.service.ts
  README.md
packages/runtime/outbox/
  src/core/constants/relay-heartbeats.constant.ts
  src/node/services/outbox-relay.service.ts
  src/node/services/cross-app-relay.service.ts
  README.md
packages/infrastructure/infra-observability/
  src/node/functions/heartbeat-monitors.function.ts (comment)
  README.md
.changeset/background-job-heartbeats.md
```

## Data models and migrations

none

## Contracts

Additive exports of `@stackra/queue` (see the spec's Impact). The manifest of `@stackra/queue` gains the config row,
the optional secret row and the service row (regenerated by `stackra gen`).

## Error handling

A beat never throws: a network error, a 408 or a 5xx is tried again twice within the timeout; what still fails (any
non-2xx answer, a network error, a refused redirect, the timeout) is logged as `queue.heartbeat_failed` (`warn`) at
most once per `minInterval` per job, and the next call waits the retry gap (at most 2 s), so a refused or rate-limited
URL is neither hammered nor flooding the logs. A malformed secret fails `buildConfig` at boot.

## Security and tenancy

The URL is the credential; it is read only from the secret store, sent only over `https://` with redirects refused,
and never logged: the failure log carries the job name and a status code or an error's `name`.

## Testing strategy

- AC-001: `queue-worker.service.test.ts` (heartbeats describe).
- AC-002: `outbox-relay.service.test.ts`, `cross-app-relay.service.test.ts` (heartbeats describes).
- AC-003: `scheduler.service.test.ts` (heartbeats describe).
- AC-004, AC-005: `heartbeat.service.test.ts` (stubbed `fetch`, moved clock, a real `AbortSignal.timeout`).
- AC-006: `heartbeat.config.test.ts`, `heartbeat-urls.function.test.ts`.
- Revert checks: removing each beat call (worker, scheduler, both relays) and the throttle fails its tests; beating
  a held-lock poll, dropping the worker's `during`, and the sender without the retry gap, in-call retries and log
  throttle each fail the review-fix tests.
- Live proof: a real worker loop against a local HTTPS endpoint on box 2 (Linux): beats every `minInterval`, a 503
  logged without the URL and retried on the next pass.

## Rollout

Minor changesets for queue, scheduler and outbox, a patch for infra-observability. Nothing is sent until a service's
`STACKRA_HEARTBEAT_URLS` secret holds its stack output `heartbeats.<env>.<service>` (an owner step per service).

## Delegation and risk plan

Claude only; one wave; R2.

## ADRs

ADR 0184 decision 4 (implemented), ADR 0185 decision 1, ADR 0173.

## Docs

The four READMEs listed in the spec.

## Complexity tracking

none
