# Implementation Plan: Runway's deployment-readiness tier

**Spec**: `.agents/specs/sta-1814-runway-readiness/spec.md` · **Linear**: STA-1814 · **Branch**:
`figentra/sta-1814-runway-readiness`

Nothing here deploys to a cloud before phase 2, and phase 2 waits for the owner's yes on the `readiness` GitHub
environment. Builds and tests run on testbed boxes through `stackra testbed run`; a workstation runs only oxfmt and
oxlint.

## Summary

Phase 1 is everything that runs on a testbed heavy slot today with no cloud deploy and no new credential: the
environment record, the Compose target, the deploy smoke, the migration checks, the multi-instance checks, tenant
isolation and the air-gapped run. Phase 2 adds the Cloudflare Workers target through the existing reusable workflow.
Phase 3 adds Encore Cloud once STA-136 opens a deploy path. Phase 4 is Flow's: storing results and blocking the release.

## Build order

| Step | Phase | What                                                                                                                                                                                                                                | Gate                                    |
| ---- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 0    | -     | ADR reserved and written (Q1), spec and plan                                                                                                                                                                                        | **leader rules Q1 to Q8; owner on ADR** |
| 1    | 1     | Spike on a box: `encore build docker` of billing's generated app with the app id blanked, then `docker run` with Postgres and Valkey and `/readyz`. Answers the plan's one load-bearing assumption                                  | result on STA-1814                      |
| 2    | 1     | US5: `ENVIRONMENT_RECORD_SCHEMA`, `READINESS_RESULT_SCHEMA`, types, the record writer and its secret refusal (`src/core/`, `src/node/readiness/`)                                                                                   | unit tests on a box                     |
| 3    | 1     | US1: `runway readiness` parsing, the Compose writer (FR-003), image build, start, `deploy-smoke`, the judge and exit codes                                                                                                          | unit tests; one real run on a box       |
| 4    | 1     | US2: the four migration checks, the seed of two tenants, the row-count comparison                                                                                                                                                   | unit tests; real run against billing    |
| 5    | 1     | US3: the `services/example` readiness probe module (one action that enqueues, one flaky job, one always-failing job, one cron, one realtime room, one tenant-owned query) and the six multi-instance checks plus `tenant-isolation` | unit tests; real run, two replicas      |
| 6    | 1     | US4: `docker save` and `docker load`, the internal network, the egress probe and the log scan                                                                                                                                       | real run, egress blocked                |
| 7    | 1     | `readiness` testbed preset, `runway-readiness.yml` (testbed job only), runbook sections, the test-infra skill row, changesets                                                                                                       | `pnpm verify` via the testbed           |
| 8    | 2     | US6: `cloudflare-workers` target calling `runway-cloudflare-workers.yml` with environment `readiness`                                                                                                                               | **owner: the `readiness` environment**  |
| 9    | 3     | US6: `encore-cloud` target, ephemeral environment create, verify and delete                                                                                                                                                         | **blocked by STA-136**                  |

One pull request per user story (ADR 0120 decision 8): steps 2, 3, 4, 5, 6 and 7 are six PRs in that order; 8 and 9
are one each later.

## Design notes

- **Where it runs.** Flow dispatches `runway-readiness.yml` nightly and per release candidate. The workflow's testbed
  job runs `stackra testbed run "<run> readiness" <dir> "runway readiness ..."` on a heavy slot; the job's container
  reaches the host Docker through the socket (ADR 0484 decision 5), so Compose projects carry the job label and are
  removed at `job end`.
- **Product trees.** Each product is the consumer-gate scratch copy at its pin with core linked in (STA-1813 FR-002).
  The previous release is a second scratch copy at the previous pin. Readiness never clones; the caller provides both.
- **Images.** `encore build docker <product>-<service>:<sha12>` in the generated `.stackra/encore` of each service. The
  digest goes into the record. Engines are pulled by digest from the one constant before the run, then saved to an
  archive the air-gapped step loads.
- **Compose.** One project per product, `readiness-<product>-<sha12>`. A service gets its runway's port, `health`
  path and env vars; `DATABASE_URL` and `REALTIME_VALKEY_URL` point at the engine containers; every other secret name
  gets a random value generated in the job and handed to Compose through the environment, never written to the file.
- **Migrations.** `stackra db migrate --env test` and `stackra db rollback --env test` run inside a one-off container
  of the service image, so they use the member's own `@stackra/database/node` (the CLI holds no driver). Row counts are
  `SELECT count(*)` over the tables of the service's module schemas, before and after.
- **Multi-instance.** The probe module selects drivers by config: `queue: postgres`, `scheduler: postgres`, `realtime:
valkey`. Redelivery is forced by stopping the instance that holds a job mid-handler (`docker kill`), so the second
  instance picks it up after the lease; the side effect is a row keyed by the job's idempotency key. The scheduler
  check counts runs in a table over five minutes. The realtime checks connect a WebSocket client to instance A, publish
  numbered frames on instance B, cut A's Valkey with `docker network disconnect`, reconnect, and compare.
- **Air-gapped.** A second Compose project with `networks.default.internal: true`, images from `docker load`, and a
  `busybox` probe whose `wget https://example.com` must fail. The service logs are scanned for connection attempts to
  hosts outside the project.
- **Judge.** A pure function from check outcomes to the result, the run verdict and the exit code (FR-011, FR-012),
  tested without Docker. A failed check reruns once; pass on rerun becomes `flaky`.

## Budget (seed matrix: billing 3 services, pay 2, invoicing 1, tamo 1)

| Part                         | Per product | Seed matrix                     |
| ---------------------------- | ----------- | ------------------------------- |
| Images (cached turbo, build) | 3 to 5 min  | 20 min                          |
| Deploy smoke                 | 2 min       | 8 min                           |
| Migrations (four checks)     | 3 min       | 12 min                          |
| Multi-instance (probe, once) | -           | 10 min                          |
| Air-gapped (smoke + migrate) | 2 min       | 8 min                           |
| **Total**                    |             | **about 58 min, killed at 120** |

## Constitution Check

| Law                       | Result | Note                                                                                                                                |
| ------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (ADR 0003)     | PASS   | runway imports no service; the probe module lives in `services/example` and is reached only over HTTP and WebSocket                 |
| Tenancy                   | PASS   | synthetic tenants only, on tmpfs; the tier adds a tenant-isolation check rather than touching tenant code                           |
| Secrets                   | PASS   | names only in files; throwaway values generated in the job; cloud tokens from Infisical `/ci` over OIDC; the record refuses a value |
| Not built yet (ADR 0227)  | PASS   | Compose is allowed by ADR 0179; no Kafka, no separate observability service, no microVM; no new dependency                          |
| Test placement (ADR 0022) | PASS   | `packages/developer/runway/src/**/__tests__/`, `services/example/src/**/__tests__/`                                                 |
| Versions and catalogs     | PASS   | no catalog change; engine images pinned by digest in one constant                                                                   |
| HTTP conventions          | PASS   | the probe module's actions and queries follow the endpoint convention; no hand-written Encore                                       |

## Deploy modes

| Mode       | Behaviour                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| SaaS       | not shipped; phases 2 and 3 deploy each train to an ephemeral cloud environment the way SaaS releases deploy  |
| On-prem    | not shipped; the `testbed-compose` target is the Compose smoke ADR 0289 decision 8 requires on every release  |
| Air-gapped | not shipped; the `air-gapped` check is the egress-blocked run ADR 0076 decision 6 and ADR 0179 plan (STA-141) |

## Correctness properties

- **P-001**: Exit code is 0 iff no blocking check failed, 1 iff one did, 2 iff the run could not judge — Validates: FR-001, FR-013
- **P-002**: The run's product, service and pin set equals the matrix's, filtered by `--products` — Validates: FR-002
- **P-003**: The Compose file has one service per gated member and one engine per required engine, every image pinned by digest, and no secret value — Validates: FR-003
- **P-004**: A service whose `/readyz` is not 200 within the budget yields `deploy-smoke` fail with log evidence — Validates: FR-004
- **P-005**: The four migration checks pass on a good fixture and fail on a planted dropped-row migration and a planted broken down-migration — Validates: FR-005
- **P-006**: Over a run with two replicas, each queue job's side effect exists exactly once, a poisoned job ends dead-lettered, and a minutely cron ran once per minute — Validates: FR-006
- **P-007**: Realtime frames received while connected are in publish order, and state converges after reconnect — Validates: FR-006
- **P-008**: A planted cross-tenant read turns `tenant-isolation` red on every instance — Validates: FR-007
- **P-009**: With the network internal the egress probe fails, and a planted outbound call at start turns `air-gapped` red — Validates: FR-008
- **P-010**: Every written record validates against `ENVIRONMENT_RECORD_SCHEMA`, and a record with a planted secret value or a credentialed URL is refused — Validates: FR-009, FR-010
- **P-011**: The judge maps outcomes to verdicts by class: always-blocking classes block even when flaky, `skipped` never counts as a pass — Validates: FR-011, FR-012
- **P-012**: The Workers target passes environment `readiness` and the train SHA and reads `deployed` and `sha` back — Validates: FR-014
- **P-013**: The Encore target refuses to run without a readiness branch in the root runway and deletes its environment on every exit — Validates: FR-015
- **P-014**: The workflow has only `workflow_call` and `workflow_dispatch` triggers, and the `readiness` preset is accepted by `stackra testbed` — Validates: FR-016, FR-017

## Contracts and events

`@stackra/runway` `.` gains `ENVIRONMENT_RECORD_SCHEMA`, `READINESS_RESULT_SCHEMA`, `EnvironmentRecord`,
`ReadinessResult`, `ReadinessCheckClass` (enum); `./node` gains `runReadiness(request)` and the `readiness` subcommand
of `runRunway`. The probe module's actions and queries are internal to `services/example` and listed in its manifest.
No integration event crosses a service.

## Data and tenancy

Two synthetic tenants seeded by the `test` seed-pack profile per run; tmpfs only; removed with the job.

## Delegation and risk plan

R3. Steps 2 and the judge in step 3 are lead-only (they decide what blocks a release). Steps 4 to 6 may go to
builders one story at a time, each reviewed by the lead. Step 8 and 9 touch credential paths: lead only, owner review.

## Risks

- **`encore build docker` without Encore Cloud** (step 1). If it needs a cloud login, the fallback is to run the
  generated app with `encore run` inside the job container per instance; slower, same checks.
- **Realtime timing flake.** The reconnect check is the most timing-sensitive; it gets the one rerun and reports
  `flaky` until burn-in ends (Q5).
- **Matrix dependency.** STA-1813 has not merged; step 3 reads a matrix path and does not import consumer-gate code.
- **Box time.** A 60-minute heavy job each night holds one of the pool's heavy slots; Q8 asks before a second slot.

## ADRs

New ADR (Q1), amending 0500 and noting 0179 and 0289 decision 8. Read: 0076, 0159, 0166, 0179, 0289, 0296, 0352, 0400,
0435, 0484, 0500.

## Docs

The ADR; `runbooks/release.mdx` (what tier 3 checks, how to read a result); `runbooks/test-infrastructure.mdx` (the
preset); the runway README and AGENTS.md; `.github/workflows/README.md`; `.agents/skills/test-infra/SKILL.md`.

## Project structure

```text
packages/developer/runway/src/
  core/constants/environment-record-schema.constant.ts
  core/constants/readiness-result-schema.constant.ts
  core/enums/readiness-check-class.enum.ts
  core/types/environment-record.type.ts
  core/types/readiness-result.type.ts
  node/readiness/            # command, compose writer, checks, judge, record writer, each with __tests__/
services/example/src/modules/readiness/
packages/developer/cli/src/node/constants/testbed-presets.constant.ts   # + "readiness"
.github/workflows/runway-readiness.yml
```
