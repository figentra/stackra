# Feature Specification: the k6 load tier, its first soaks and the capacity numbers

**Feature Branch**: `figentra/sta-317-k6-load-tier`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: the CTO (technical-only stop; the approval is recorded by the CTO, not by this branch)

**Linear**: STA-317

**Clarifications status**: complete

**Input**: STA-317 and the production-readiness audit (batch 14, item 14.3): there was no load or soak test and no
capacity number, so the first traffic spike would have been the first test. ADR 0182 accepted a `.load` tier and weekly
k6 load tests (decisions 1 and 4); nothing implemented them. The outbox relay is one lock-holding loop per service
(`OutboxRelayService`, ADR 0149), so its ceiling is the ceiling of every service's event delivery, and nobody had
measured it.

### Sources

- ADR 0182 (decisions 1 and 4: the `.load` tier, weekly k6 load tests)
- ADR 0078 decision 4 and ADR 0149 (the relay, one runner under a lock); ADR 0221 decision 5 (under five seconds of lag)
- ADR 0148 (the queue and its workers); ADR 0473 (the pool budget of a service); ADR 0138 (the action pipeline)
- `packages/runtime/outbox/src/node/services/outbox-relay.service.ts`,
  `packages/runtime/queue/src/node/services/queue-worker.service.ts`,
  `packages/application/actions/src/core/services/action-pipeline.service.ts`
- The int tier as the model: `intTier`, `emitIntTierConfig`, `hasIntTests`, `stackra test --tier int` (STA-1819)

## Impact

- **Apps touched**: none
- **Services touched**: none (a service that adds a `.load.test.ts` gets the generated load config on its next gen)
- **Packages touched**: packages/developer/testing (new `./node` entry); packages/tooling/vitest (new `./load`
  entry); packages/developer/gen (writes `.stackra/vitest.load.config.ts`); packages/developer/cli
  (`stackra test --tier load`); packages/application/actions, packages/runtime/queue, packages/runtime/outbox (a
  `test:load` script and their soaks)
- **Public contract change**: additive. `@stackra/testing/node` exports `serveLoadTarget`, `runK6`, `k6Args`,
  `readK6Summary`, `K6_SCENARIO_SCRIPT`, `k6Binary`, `soakLoad`, `writeLoadReport`, `summariseLatencies`, `percentile`
  and the types `LoadScenarios`, `LoadTarget`, `LatencySummary`, `K6Load`, `RunK6Options`, `K6Result`.
  `@stackra/vitest-config/load` exports `loadTier`, `LOAD_TESTS`, `LOAD_TEST_TIMEOUT_MS`. `stackra test` accepts
  `--tier load`. The root gains the turbo task `test:load` and the script `pnpm test:load`. No export is removed or
  renamed and no existing signature changes
- **Cross-service events**: none
- **Tenancy and data**: none in production. The soaks write owned rows in two tenants as the NOBYPASSRLS service role in
  a throwaway database, so row security is on under load
- **Security and privacy**: the load target listens on 127.0.0.1 only and reads no body; k6 is spawned without a shell;
  the reports hold figures only
- **Secrets**: none (the weekly workflow decrypts no scope and uses no repository secret)
- **ADR needed**: no (implements ADR 0182 decisions 1 and 4 as written)
- **New dependencies**: none in a package. k6 1.3.0 is a binary the load tier runs, pinned in `load.yml`
  (`mise install aqua:grafana/k6@1.3.0`), not in `mise.toml`
- **Deploy modes**: same in all three (test tooling only)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `apps/docs/src/docs/runbooks/capacity.mdx` (new: the capacity numbers and how to remeasure),
  `apps/docs/src/docs/runbooks/test-infrastructure.mdx` (the load tier), `apps/docs/src/config/docs.config.ts` (nav),
  `.github/workflows/README.md` (`load.yml` row), `packages/developer/testing/README.md` and `AGENTS.md` (`./node`),
  `packages/tooling/vitest/README.md` (`./load`), the changeset
- **Lane**: full
- **Change risk**: R1 (test tooling and a scheduled advisory workflow; no runtime code changes)

## Acceptance criteria

- **AC-001**: THE `@stackra/testing/node` entry SHALL serve named scenarios over loopback HTTP, answering 204 for a unit
  that resolves and 500 with its message for one that throws, and SHALL time each unit on the server side.
- **AC-002**: THE `runK6` function SHALL run k6 without a shell against a target with an executor and thresholds, SHALL
  answer the run's summary with `passed: false` and the crossed thresholds named when k6 exits 99, and SHALL throw with
  k6's error output when k6 could not finish the run.
- **AC-003**: WHERE `STACKRA_LOAD_RATE` or `STACKRA_LOAD_DURATION` is set THE `soakLoad` function SHALL use it in place of
  the test's figure, and SHALL refuse a malformed value.
- **AC-004**: WHEN no k6 is installed (`STACKRA_K6` unset and none on `PATH`) THE load tests SHALL skip, as an int test
  skips without `TESTBED_POSTGRES_HOST`.
- **AC-005**: WHEN a package or service has a `.load.test.ts` under `src/` THE generator SHALL write
  `.stackra/vitest.load.config.ts`, which runs only those files, one file and one test at a time, with no retry; and
  SHALL write none for a member without one.
- **AC-006**: WHEN `stackra test --tier load` runs in a member THE CLI SHALL run that config, SHALL refuse in an app or a
  member without it, and at the workspace root SHALL run `turbo run test:load --concurrency=1`, so two members'
  soaks never share the box.
- **AC-007**: THE unit tier SHALL never run a `.load.test.ts`.
- **AC-008**: WHILE k6 drives the action pipeline at a fixed arrival rate THE soak SHALL check every request ran `handle`
  exactly once, none failed, no iteration was dropped, and the pipeline's own p95 and heap growth stay under their
  ceilings.
- **AC-009**: WHILE k6 queues jobs in two tenants on Postgres THE queue soak SHALL check every job ran exactly once, none
  is left on the queue, the backlog drains within 60 s of the load stopping and the queue-to-run lag stays under 5 s at
  p95; and a backlog test SHALL measure the drain rate of one instance's workers.
- **AC-010**: WHILE two relays on one lock deliver event messages THE outbox soak SHALL check every message k6 wrote
  in two tenants on Postgres was published exactly once, none is left in the outbox, and the write-to-publish lag stays
  under ADR 0221's 5 s at p95; and a backlog test SHALL measure the drain rate of the one relay a service runs.
- **AC-011**: THE `load.yml` workflow SHALL run the load tier weekly and on demand (duration and rate as inputs passed as
  environment values), with k6 pinned and a throwaway Postgres, and SHALL upload the reports; it SHALL hold no secret.
- **AC-012**: THE capacity runbook SHALL record the numbers measured on a named machine, what each covers, what limits
  them, and how to remeasure.

## Compatibility and migration

- Additive: new entries, a new tier, a new script. A member without a `.load.test.ts` sees no change; gen writes nothing
  new for it.
- `pnpm verify` and the Quality Gate do not run the load tier (as with `test:e2e`).

## Risks

- Numbers measured on one machine are that machine's: the runbook names it, and the soaks assert correctness (exactly
  once, nothing left) with generous ceilings, never a throughput figure, so a slower runner still passes.
- A hosted runner is noisy: the weekly run is advisory, never a required check.
- The soaks found a real limit: the queue's reservation (`queue.reserve_job`) costs time in proportion to the jobs
  waiting, so its drain rate falls from about 160 to 67 a second as the backlog grows from 3,000 to 20,000, and 100 jobs
  a second for ten minutes breaks the 5 s lag ceiling. The queue soak runs at 50 a second (which holds for ten minutes)
  and STA-2875 tracks the fix; the capacity runbook records both.
- k6's own CPU shares the box with the subject; at the rates used it is a small share, and the server-side latency is
  reported beside k6's.

## Status history

- 2026-11-26 · — → Draft · Claude (builder) · STA-317 and audit item 14.3
- 2026-11-26 · Draft → Clarified · Claude (builder) · scope from ADR 0182 decisions 1 and 4 (no open question)
- 2026-11-26 · Clarified → Implementing · Claude (builder) · plan and tasks; built in this branch on box 2
