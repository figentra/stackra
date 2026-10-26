# Feature Specification: gen remainder (Encore cron jobs and queue subscriptions, egress as data)

**Feature Branch**: `figentra/sta-666-wave11`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-768

**Clarifications status**: complete

**Input**: Emit Encore CronJobs from the `encoreCronJobs()` rows and Pub/Sub subscriptions for a broker-delivered
queue; treat `{field}` hosts in managed-client base URLs as data in the egress allow-list; outcome kinds only if
`@stackra/rules` declares an outcome-kind form.

## Impact

- **Apps touched**: none
- **Services touched**: none (generated output only)
- **Packages touched**: packages/developer/gen
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (ADR 0148, 0266, 0308 govern)
- **New dependencies**: none
- **Deploy modes**: SaaS (Encore); on-prem runs `SchedulerService.run` and the Postgres queue
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** `emitEncoreCronJobs`: `.stackra/encore/<member>/cron.ts`, one CronJob per cron action (`cronJobId`) and
  the stored schedules' minute tick; `cron_job_collision`.
- **FR-002** `emitEncoreQueues`: `.stackra/encore/<member>/queues.ts`, a Topic and Subscription per queue, registered
  as `queue.<name>`, each delivery run through `QueueWorkerService.process`.
- **FR-003** `egressOf` and the manifest's `egress` entry per Integration; `egress_invalid`.

## Not built here

- Rule outcome kinds: `@stackra/rules` declares outcome kinds as runtime values (`Rules.create({ outcomes })`), not a
  form gen can read; needs a declared kind first.
- The Expo target and the edition bundle output (wait on a contract and ADR 0336 options).
- The broker-delivered `QueueDriver` that publishes to these topics (`@stackra/queue`), and the scheduler calling
  gen's `cronJobId` instead of its private copy.
- Tests, typecheck and build are written but not run (owner mode).

## Wave 12 remainder (figentra/sta-666-wave12)

- Done: `encoreCronJobs()` in @stackra/scheduler calls gen's `cronJobId` (its private copy is removed); the scheduler
  depends on `@stackra/gen` (workspace, lockfile link pending).
- Done: rule outcome kinds. `@stackra/rules` declares them with `RuleOutcome({ key, label, params })`; gen maps the base
  to `rule_outcome` and lists each kind in the manifest's `outcomes` section (ADR 0425 decision 1).
