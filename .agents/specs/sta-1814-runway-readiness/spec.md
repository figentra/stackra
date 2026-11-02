# Specification: Runway's deployment-readiness tier of the core train gate

**Feature Branch**: `figentra/sta-1814-runway-readiness`

**Created**: 2026-11-01

**Status**: Clarified <!-- open questions below carry proposed answers; the plan assumes them until the leader rules -->

**Linear**: STA-1814

**Clarifications status**: complete

**Input**: The leader's layer split of the core train gate (core-3b, 2026-11-01). Tiers 1 and 2 are `stackra
consumer-gate` (STA-1813): real products generate, typecheck and test against a core train. Flow orchestrates trains,
lanes, pins and release blocking (its own spec). Tier 3, this spec, is Runway's: is the train fit to run in production?
It runs nightly and per release candidate, never on every pull request.

## Decision

Tier 3 is one Runway command, `runway readiness`, that takes a train (core SHA), a product matrix and a target, brings
each gated product service up in an ephemeral environment, runs a fixed set of readiness checks, and writes two files
per product: `result.json` (each check's verdict and evidence) and `environment.json` (the environment record: what
actually ran). Flow stores both beside the train and decides whether the release is blocked; Runway only judges and
reports. The first target is `testbed-compose`: a Docker Compose environment on a testbed heavy slot (ADR 0484), built
from the product's `runway.yaml` files, which is also the Compose smoke ADR 0289 decision 8 asks for on every release.
Cloudflare Workers and Encore Cloud targets follow in later phases; Encore Cloud waits for STA-136, because `encore
deploy` is denied and the `encore-cloud` provider has no ephemeral environment today.

What exists today and is reused, not rebuilt:

| Today                                                                                   | Used as                                                      |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `@stackra/runway` `deploy`, `promote`, `rollback`, `RunwayProvider`, `DeployResult`     | the later cloud targets (phases 2 and 3) call these          |
| `smokePreview`, `SmokeDriver`, `SmokeResult`, `RunwaySmokeFailedError`                  | the shape of a check result; web surfaces reuse the driver   |
| `runway-smoke.yml`, `runway-cloudflare-workers.yml` (reusable, OIDC to Infisical `/ci`) | phase 2 calls the Workers one with a `readiness` environment |
| `stackra db migrate`, `stackra db rollback` (rollback refused outside dev/preview/test) | the migration checks, run with `--env test`                  |
| `stackra consumer-gate` scratch copy (core linked into a pinned product checkout)       | the product tree each readiness run builds from              |
| `stackra testbed run` (container per job, Docker socket, Infisical gate identity)       | the phase 1 host                                             |
| `ValkeyRealtimeFanoutDriver`, `PostgresQueueDriver`, `PostgresScheduleDriver`           | the multi-instance checks exercise these drivers             |

## Impact

- **Apps touched**: `apps/docs` (the readiness ADR, a section in `runbooks/release.mdx`, a row in
  `runbooks/test-infrastructure.mdx`)
- **Services touched**: `services/example` (a `readiness` probe module the multi-instance checks call; never deployed,
  see Q3)
- **Packages touched**: `packages/developer/runway` (`src/node/readiness/`: the command, the compose writer, the checks,
  the judge; `src/core/`: the `EnvironmentRecord` and `ReadinessResult` types and schemas; changeset);
  `packages/developer/cli` (one testbed preset, `readiness`)
- **Workflows touched**: new reusable `.github/workflows/runway-readiness.yml` (phase 1 dispatches a testbed job; phase
  2 adds the Workers job); no edit to `release.yml` or `ci.yml`
- **Cross-service events**: none new. The checks publish and consume the probe module's own test event on the broker
  driver; no product event contract changes
- **Tenancy and data**: no real tenant data. Each run seeds two synthetic tenants with the `test` seed-pack profile and
  asserts a cross-tenant read is refused; all data lives on tmpfs and is removed with the job
- **Secrets**: no value in git, a file, argv or a log. Phase 1: the testbed's existing shared gate identity
  (`INFISICAL_GATE_IDENTITY_ID`, `figentra-ci` `/ci`) for the install licence token (`UNIWIND_AUTH_TOKEN`)
  and product read access (`STACKRA_BOT_APP_ID`, `STACKRA_BOT_PRIVATE_KEY`); service secrets the
  product runways name get generated throwaway values inside the job. Phase 2: `CLOUDFLARE_API_TOKEN` from Infisical
  `/ci` over GitHub OIDC, only in the deploy step, as the reusable workflow already does. Phase 3: `ENCORE_API_KEY`, same
  path, once STA-136 opens a deploy path
- **ADR needed**: yes, one new ADR (proposed slug `deployment-readiness-tier`, reserved with `pnpm adr:reserve` before
  writing): the tier's cadence, targets, blocking classes and the environment record; it amends ADR 0500 (a fourth
  `runway` command) and fills the planned enforcement of ADR 0179 and ADR 0289 decision 8. See Q1
- **New dependencies**: none. Docker and `encore build docker` are already in the testbed job image; Compose files are
  written with `yaml`, already a dependency of `@stackra/runway`
- **Deploy modes**: internal CI tooling, not shipped to tenants. It is how the on-prem (Compose) and air-gapped modes
  of ADR 0076 and ADR 0179 are proven per train; see the plan's Deploy modes table
- **Licence tier**: free (part of `@stackra/runway`, MIT)
- **Docs to update**: the new ADR, `runbooks/release.mdx`, `runbooks/test-infrastructure.mdx`,
  `packages/developer/runway/README.md` and `AGENTS.md`, `.github/workflows/README.md`, `.agents/skills/test-infra/SKILL.md`
  (one row)
- **Lane**: full
- **Change risk**: R3 (the deploy tool, a gate that blocks releases, and from phase 2 a deploy credential path)

## User scenarios and testing

### US1: a deploy smoke of every gated service on the testbed (P1)

As the release lead, I want each gated product service brought up from the train in an ephemeral Compose environment,
so a train that builds but does not start never ships.

- **AC-1.1** Given a train SHA and the product matrix, when `runway readiness --target testbed-compose` runs on a
  testbed heavy slot, then every gated service is built into an image (`encore build docker` of its generated app),
  started with the engines its `runway.yaml` requires, and its `/readyz` answers 200 within the start budget.
- **AC-1.2** Given a service whose container exits or whose `/readyz` stays non-200, then its `deploy-smoke` check is
  `fail` with the last 200 log lines as evidence, and the run's exit code is 1.

### US2: migrations forward, from the previous release, and back (P1)

- **AC-2.1** Given an empty database, when the service's migrations run to head, then every migration applies and the
  schema matches the one the product's own test suite builds.
- **AC-2.2** Given the previous release's pin migrated and seeded (`test` profile, two tenants), when the train's
  migrations run, then they apply, the seeded rows are still readable through the service, and row counts per
  migrated table are unchanged except where a migration declares a backfill.
- **AC-2.3** Given the train at head, when `stackra db rollback --env test` reverts the last batch and migrate runs
  again, then both succeed and the schema equals head.
- **AC-2.4** Given a `pg_dump` taken before the upgrade, when the database is restored from it, then the previous pin
  starts against it and answers `/readyz` 200 (ADR 0179 decision 4: rollback by restore).

### US3: multi-instance behaviour (P1)

With two instances of the probe service on one Postgres and one Valkey:

- **AC-3.1** A job that fails twice then succeeds is retried and runs to success once; a job that always fails lands
  in the dead-letter state after its maximum attempts, with its last error.
- **AC-3.2** A job delivered twice (forced redelivery) runs its handler's side effect once, through the idempotency
  key.
- **AC-3.3** A cron job due once a minute, over five minutes with both instances running, runs exactly five times.
- **AC-3.4** A realtime client on instance A receives, in publish order, every frame published on instance B while it
  is connected; after instance A's Valkey connection is cut and restored, the client's resync converges to the
  publisher's final state. Frames lost during the cut are allowed (the driver is at most once).
- **AC-3.5** A request authenticated as tenant 1 for a tenant 2 record is refused on both instances.

### US4: an air-gapped run (P2)

- **AC-4.1** Given images and engines loaded before the run, when US1 and US2 run on a Compose network with no route
  out (`internal: true`), then they pass, and a probe container's attempt to reach a public host fails.
- **AC-4.2** Given a service that calls out at start (telemetry, licence, fonts), then the run records the attempted
  host from its logs and the `air-gapped` check fails.

### US5: an environment record beside every result (P1)

- **AC-5.1** Every run writes `environment.json` per product before any check runs; a run that fails early still
  leaves the record with what was known.
- **AC-5.2** The record holds no secret value and no URL with credentials; a test feeds a record with a planted value
  and the writer refuses it.

### US6: cloud targets (P3)

- **AC-6.1** Given a product Worker member, when the `cloudflare-workers` target runs, then `runway-cloudflare-workers.yml`
  deploys it to the `readiness` GitHub environment, its `smoke-url` answers 200, and the result carries the deployed
  SHA.
- **AC-6.2** Given STA-136 has opened an Encore deploy path, when the `encore-cloud` target runs, then the provider's
  apply and verify (`/readyz`) pass on an ephemeral environment that is deleted after the run.

### Edge cases

- **EC-001** A product with no `runway.yaml` for a gated service: the service runs with the root defaults and the
  record says `declared: none`; this is a warning, not a failure.
- **EC-002** No previous release exists (a first release): AC-2.2 and AC-2.4 are `skipped` with that reason, never
  `pass`.
- **EC-003** The testbed has no free heavy slot within the queue budget: the run ends `error` (exit 2), which Flow
  reads as "not judged", never as green.
- **EC-004** A check fails, then passes on its one automatic rerun: it is reported `flaky`; it does not block unless it
  is in an always-blocking class (FR-012), and the run opens a Linear issue through `pnpm linear create`.

## Requirements

- **FR-001** `runway readiness --train <sha> --matrix <file> --target <name> --out <dir> [--products a,b]
[--previous <file>]`, where the target is `testbed-compose`, `cloudflare-workers` or `encore-cloud`, runs the readiness checks and writes the results. Exit 0 when no
  blocking check failed, 1 when one did, 2 when the run could not judge (setup error, no slot, no image).
- **FR-002** The product list is the consumer-gate matrix (`tools/consumer-gate/matrix.yaml`, STA-1813): the same
  products, services and pins. `--previous` names the previous release's pins; Flow supplies both files.
- **FR-003** The `testbed-compose` target writes `.stackra/readiness/<product>/compose.yaml` from the product's root and
  member runways: one service per gated member (its image, its port, its `health` path), one engine container per
  `requires` engine (`postgres`, `valkey`; `s3` as MinIO only when required), engine images pinned by digest in one
  constant, data on tmpfs, and generated throwaway values for every secret name the runways list.
- **FR-004** `deploy-smoke` check: each service starts and `/readyz` answers 200 within 120 seconds, and the service's
  generated route list answers (no 404 on the health and the first query route of the manifest).
- **FR-005** `migrate-empty`, `migrate-upgrade`, `migrate-rollback` and `restore` checks, as AC-2.1 to AC-2.4, through
  `stackra db migrate` and `stackra db rollback` with `--env test`; the upgrade's row-count comparison reads only the
  module schemas of the service.
- **FR-006** `queue-retry`, `queue-duplicate`, `queue-dead-letter`, `scheduler-single-run`, `realtime-order` and
  `realtime-reconnect` checks, as AC-3.1 to AC-3.4, against two replicas of the `services/example` readiness probe
  module, with the Postgres queue, the Postgres scheduler and the Valkey realtime fan-out drivers selected.
- **FR-007** `tenant-isolation` check, as AC-3.5, on every gated product service as well as the probe: two seeded
  tenants, one cross-tenant read per service's first tenant-owned query, refused on each instance.
- **FR-008** `air-gapped` check, as AC-4.1 and AC-4.2: images are loaded with `docker load` from a saved archive, the
  Compose network is internal, an egress probe must fail, and any outbound attempt in the service logs fails the check.
- **FR-009** `environment.json` follows `ENVIRONMENT_RECORD_SCHEMA` (`@stackra/runway`, `.`): record version, train SHA
  and core version, product repository and SHA, target, mode (`compose`, `workers`, `encore-cloud`), egress (`open` or
  `blocked`), region (the testbed region, or the runway region a cloud target deployed to), topology mode of the root
  runway's environment, Node and pnpm versions (declared in `mise.toml`, actual in the image), Encore CLI version, per
  service its member, package version, image reference and digest and instance count, per engine the declared engine
  and version (from `requires` and `resources`) and the actual image digest and server version (`SELECT version()`,
  `INFO server`), the testbed AMI id, and start and end times.
- **FR-010** The record writer refuses a record in which any string equals a value it generated or read for a secret,
  or a URL carries user info; it lists secret names only.
- **FR-011** `result.json` follows `READINESS_RESULT_SCHEMA`: per check its name, class, verdict (`pass`, `fail`,
  `flaky`, `skipped`, `error`), duration, problems (one line each) and evidence paths under `--out`; plus the run's
  verdict and exit code. It reuses the `SmokeResult` field names where they overlap.
- **FR-012** Every check has one class. `security`, `tenant-isolation` and `data-integrity` always block, flaky or not.
  `deploy` and `migration` block. `multi-instance` and `air-gapped` block once the ADR's burn-in ends (Q5) and report
  until then. A `skipped` check never blocks and never counts as a pass.
- **FR-013** A run on the testbed finishes within 60 minutes for the seed matrix and is killed at 120 minutes (exit 2);
  each check has its own timeout in one constant.
- **FR-014** The `cloudflare-workers` target calls `runway-cloudflare-workers.yml` with environment `readiness`, the
  train SHA and the member's smoke URL, and reads its `deployed` and `sha` outputs into the result.
- **FR-015** The `encore-cloud` target uses `EncoreCloudProviderDriver` apply and verify on an environment named
  `readiness-<sha12>`, deleted after the run; it refuses to run until the root runway names a readiness branch (it does
  not exist before STA-136).
- **FR-016** `runway-readiness.yml` is a reusable workflow with inputs `train`, `matrix`, `previous` and `targets`; for
  `testbed-compose` it runs the testbed job, for `cloudflare-workers` it calls the Workers workflow. It never runs on
  `pull_request` or `push`.
- **FR-017** `stackra testbed run --preset readiness` exists, so the fallback workflow can run the tier on a
  GitHub-hosted runner when no box is healthy.

## Key entities

- **EnvironmentRecord**: what actually ran for one product in one run (FR-009). Plain data, no secret.
- **ReadinessResult**: every check's verdict and evidence for one product, and the run's verdict (FR-011).
- **ReadinessCheck**: name, class, timeout, and the function that judges it.

## Success criteria

- **SC-001** A nightly run of the seed matrix on one heavy testbed slot completes in under 60 minutes, five nights in a
  row.
- **SC-002** Each always-blocking class has at least one planted-failure test (a service that reads across tenants, a
  migration that drops rows, a secret in a record) that turns the run red.
- **SC-003** Every result Flow stores has an `environment.json` that validates against the schema.

## Assumptions

- STA-1813 lands its matrix file and scratch-copy mechanism first; until then readiness reads a matrix path it is
  given.
- `encore build docker` of a generated app works on the testbed job image without Encore Cloud credentials (the app id
  is blanked, as the testbed already does for `encore test`). Plan step 1 confirms it before anything else is built.
- Products' services expose `/readyz` through `@stackra/app` (the route the `encore-cloud` verify already reads).

## Out of scope

Helm and Zarf (they start with the first on-prem prospect, ADR 0289 decision 8); the shipped on-prem Compose bundle
and `stackra bundle` (ADR 0179, gen's); load and soak testing; mobile and web surface smoke (already `runway-smoke.yml`
after a preview deploy); storing results and blocking the release (Flow's spec).

## Open questions for the leader

Each has a proposed answer; the plan assumes it until told otherwise.

- **Q1** ADR: a new ADR for the tier, or a note on ADR 0500 and 0166? Proposed: one new ADR (cadence, targets,
  blocking classes, environment record), with amendment notes on 0500 (the `readiness` command) and 0179 (enforcement
  becomes real). Blocking policy is new, so a note alone is too small.
- **Q2** Who writes the Compose file: Runway now, or wait for gen's Compose emitter (ADR 0179 decision 1)? Proposed:
  Runway writes a readiness-only Compose file from the runways now; when gen ships the on-prem Compose bundle,
  readiness runs gen's file instead and Runway's writer is deleted. The two must not coexist.
- **Q3** Where the multi-instance probe lives: a `readiness` module in `services/example`, a new `services/readiness`,
  or inside product services? Proposed: a module in `services/example`. The queue, scheduler and realtime drivers are
  core's, so a core probe tests them without product logic; `example` is never deployed; a new service member costs a
  manifest, a runway and a validator row for no gain.
- **Q4** Which command name and home: `runway readiness` (ADR 0500's `runway` binary) or `stackra readiness` beside
  `consumer-gate`? Proposed: `runway readiness`: it deploys, reads runways and will call providers, which is Runway's
  scope in ADR 0500; consumer-gate stays in `stackra` because it only builds and tests.
- **Q5** Burn-in for `multi-instance` and `air-gapped`: block from day one, or report first? Proposed: report for the
  first 10 nightly runs or until five consecutive greens, whichever is later, then block. `security`,
  `tenant-isolation` and `data-integrity` block from day one.
- **Q6** Is a failed down-migration (`migrate-rollback`) a blocker, when production rolls forward? Proposed: yes, class
  `migration`: on-prem upgrades and preview environments depend on it, and the `restore` check is the production
  rollback path. Data loss found by either is `data-integrity`.
- **Q7** Engine versions: pinned in a Runway constant, or read from the root runway's `resources.postgres.version`?
  Proposed: the major comes from the root runway when it declares one, else from the constant; the record states which.
  Valkey has no version field in the schema today, so it comes from the constant.
- **Q8** Cadence and slot: nightly on one heavy slot plus once per release candidate; may a per-RC run take a second
  slot to halve wall time? Proposed: one slot nightly; per-RC may take two (products split across them).

## Status history

- 2026-11-01 → Clarified (drafted with proposed answers; leader to rule on Q1 to Q8)
