# Feature Specification: crons, outbox relays and queue workers send their heartbeats

**Feature Branch**: `figentra/sta-2834-heartbeats`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: CTO (technical stop; not yet approved)

**Linear**: STA-2834 (sub-issue of STA-2796, readiness batch 11, item 11.1)

**Clarifications status**: complete

**Input**: The 26 November production-readiness audit, item 11.1: `@stackra/infra-observability` declares a Better
Stack heartbeat for every cron, outbox relay and queue worker (ADR 0184 decision 4) and hands each its URL as a
runtime secret, but nothing in the runtime sends the beats. In production the monitors would either fire all the time
or, left off, a dead scheduler or a stuck relay would go unnoticed.

### Sources

- `packages/infrastructure/infra-observability/src/node/functions/heartbeat-monitors.function.ts` ("Sending the beat is
  the job's (`@stackra/scheduler`, `@stackra/outbox`, `@stackra/queue`)")
- `packages/infrastructure/infra-observability/README.md` ("Not here: sending a heartbeat")
- `packages/infrastructure/infra-observability/src/core/enums/heartbeat-kind.enum.ts` (cron: one beat per run; relay:
  one beat per poll; worker: one beat per loop)
- ADR 0184 decision 4 ("Crons, relays and workers send heartbeats"; enforcement: "the heartbeat check runs in the
  scheduler"); ADR 0185 decision 1 (Better Stack runs on-call); ADR 0173 and its 2026-11-04 amendment (`@Secret`)
- `packages/runtime/{scheduler,outbox,queue}` on origin/main de40b3c75: no sender

## Impact

- **Apps touched**: none
- **Services touched**: none (a service turns beats on by setting the `STACKRA_HEARTBEAT_URLS` secret)
- **Packages touched**: packages/runtime/queue (sender, config, worker), packages/runtime/scheduler (tick, fire),
  packages/runtime/outbox (outbox and cross-app relays), packages/infrastructure/infra-observability (docs only)
- **Public contract change**: yes, additive: `@stackra/queue` exports `HeartbeatService`, `HeartbeatConfig`,
  `HeartbeatConfig$`, `HeartbeatOptions` and `heartbeatName`; its manifest gains the `queue.heartbeat` config, the
  `STACKRA_HEARTBEAT_URLS` secret (optional) and the `HeartbeatService` service. No signature changes.
- **Cross-service events**: none
- **Tenancy and data**: none; a beat carries no tenant, scope or row
- **Security and privacy**: the URL is a credential: it is a secret, never logged, never in config values; a failure
  log names the job and the status code or the error's name only
- **Secrets**: one new optional secret name, `STACKRA_HEARTBEAT_URLS` (no value anywhere in the repo)
- **ADR needed**: no (implements ADR 0184 decision 4)
- **New dependencies**: none (global `fetch`)
- **Deploy modes**: same in all three; air-gapped leaves the secret unset and sends nothing
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/runtime/queue/README.md` (Heartbeats), `packages/runtime/scheduler/README.md`
  (Heartbeats), `packages/runtime/outbox/README.md` (Relaying), `packages/infrastructure/infra-observability/README.md`
  (outputs table, Not here)
- **Lane**: full
- **Change risk**: R2 (new outbound request from every background loop; bounded, throttled and never throwing)

## Acceptance criteria

- **AC-001**: WHEN a queue worker loop pass reaches its store (a job run or none due) THE worker SHALL beat
  `queue-<queue>`; a pass whose store failed, `drain` and `process` SHALL NOT beat.
- **AC-002**: WHEN `OutboxRelayService.relay()` completes (whether it held the lock or not) THE relay SHALL beat
  `outbox-relay`; `CrossAppRelayService.relay()` SHALL beat `cross-app-relay`; a poll that throws SHALL NOT beat.
- **AC-003**: WHEN a scheduler tick runs THE scheduler SHALL beat the CronJob id (`cronJobId(key)`) of each cron whose
  due runs it pushed and, when no push failed, `scheduler-schedules`; WHEN `fire(key)` pushes its runs it SHALL beat
  `cronJobId(key)`; a tick another runner holds and a failed push SHALL NOT beat.
- **AC-004**: IF no URL is configured for a job (or the secret is unset) THEN no request SHALL be sent and no error
  raised.
- **AC-005**: A beat SHALL never throw, SHALL be abandoned after `timeout` (default 3 s), SHALL be sent at most once
  per `minInterval` (default 10 s) per job and never overlap; a refused, failed or slow beat SHALL be logged as
  `queue.heartbeat_failed` with the job name and the status code or the error's name, never the URL, and SHALL NOT
  count, so the next call tries again.
- **AC-006**: A malformed `STACKRA_HEARTBEAT_URLS` (not a JSON object of kebab-case job names to `https://` URLs)
  SHALL fail the configuration at boot without echoing the value.

## Status history

- 2026-11-26 · Draft → Clarified · Claude (STA-2834 session) · job names follow `@stackra/infra-observability`'s
  kebab-case plan; one secret per service holds every job's URL (the stack output `heartbeats.<env>.<service>`)
- 2026-11-26 · Clarified → Planned → Tasked · Claude (STA-2834 session) · plan.md and tasks.md written from the build
- 2026-11-26 · Tasked → Implementing · Claude (STA-2834 session) · T001 to T006 committed with tests; revert checks
  and a live HTTPS proof on box 2 recorded in the PR; awaiting the CTO's approval
