# Feature Specification: stackra dev runs a product end to end

**Feature Branch**: `figentra/sta-2840-dev-end-to-end`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: CTO (technical stop, under the owner's delegation)

**Linear**: STA-2840

**Clarifications status**: complete

**Input**: Split out of STA-2664 (items 1, 2, 5, 8 and 9) in readiness batch 15. Root `stackra dev` fanned out one
`encore run` per service member though the dev topology is a monolith, so services in one product neither shared a
gateway nor reached each other's topics; relay and client URLs named member ports nothing served; no migration or
seeder ran, so a fresh clone booted with an empty database; the lane came only from `STACKRA_LANE`, so products side
by side all claimed gateway 4000; and Workers had no lane-aware dev port. Checked against origin/main on 2026-11-26:
every gap was still there, and two more blocked seeding in a service: `stackra db seed` ran a plain `tsdown` in a member
gen writes no tsdown config for, and `seederLedger` queried `seed_records` without the `database` schema migration
0003 creates it in.

### Sources

- `packages/developer/cli/src/node/dev-surface/constants/dev-command.constant.ts` (the dispatch)
- `packages/developer/cli/src/node/functions/tool-command.function.ts` (the root `turbo run dev` fan-out)
- `packages/developer/runway/src/node/functions/encore-deploy-tree.function.ts` (the one-app deploy tree it mirrors)
- `packages/developer/cli/src/node/functions/run-db-seed.function.ts`, `packages/data/database/src/node/functions/seeder-ledger.function.ts`
- ADR 0296 (decisions 1 and 3), ADR 0289 (decision 5), ADR 0091 (decision 2), ADR 0284, ADR 0190, ADR 0159

## Impact

- **Apps touched**: apps/docs (the CLI page, English and Arabic)
- **Services touched**: none
- **Packages touched**: packages/developer/cli, packages/developer/runway, packages/data/database
- **Public contract change**: yes, additive: `@stackra/runway` exports `devLane`, `syncDevEncoreApp`,
  `syncDevEncoreMember` and the `DevEncoreApp` and `DevEncoreAppRequest` types; `stackra dev` takes `--seed`; the dev
  facts file carries `infra` (its schema already allowed it)
- **Cross-service events**: none changed; in dev every service now runs in one Encore app, so topics reach their
  subscriptions as they do when deployed
- **Tenancy and data**: dev only: the local databases get their migrations and the chosen seed profile
- **Security and privacy**: the port forwards listen on loopback only; the data step migrates and seeds only a database
  on this machine; the database connection string is never printed
- **Secrets**: none; every member's dev secrets reach the one process as they reached each before
- **ADR needed**: no (implements ADR 0296 decision 3 for dev)
- **New dependencies**: none
- **Deploy modes**: dev only; SaaS, on-prem and air-gapped deploys unchanged
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `apps/docs/src/docs/cli.mdx`, `apps/docs/src/docs/cli.ar.mdx` (done)
- **Lane**: full
- **Change risk**: R2 (changes what root `stackra dev` starts; member mode and deploys unchanged)

## Acceptance criteria

- **AC-001**: WHEN `stackra dev` runs at a product root with a service member THE CLI SHALL start exactly one
  `encore run --port=<gateway> --browser=never`, in an app under `.stackra/dev/encore` holding every service member.
- **AC-002**: WHEN a service member's source changes during a root run THE CLI SHALL re-sync that member into the app.
- **AC-003**: WHEN a service member's runway names a dev port other than the gateway's THE CLI SHALL forward it to the
  gateway on loopback.
- **AC-004**: WHEN the gateway answers THE CLI SHALL run `stackra db migrate` and `stackra db seed --profile <seed>` for
  each service database, with `--seed none` running no seeder.
- **AC-005**: THE lane SHALL be `STACKRA_LANE` when set, else the repository's row of `lanes.repos` times
  `lanes.worktrees` plus `STACKRA_WORKTREE`, and the quick doctor SHALL check that lane's ports.
- **AC-006**: WHEN `stackra dev` runs a Worker with a dev port in the facts THE CLI SHALL pass it to `wrangler dev`.
- **AC-007**: WHEN `encore run` ends, the fan-out fails or the run gets SIGINT or SIGTERM THE CLI SHALL stop the
  other processes and the forwards.
- **AC-008**: WHEN `stackra db seed` runs in a member without a root tsdown config THE CLI SHALL build the seed entry
  alone, and the seeder ledger SHALL use `"database"."seed_records"`.
- **AC-009**: WHEN `stackra dev` forwards a member's dev port THE forward SHALL listen on 127.0.0.1 (and ::1 where the
  machine has it) only, never on a network address.
- **AC-010**: IF a service database's connection string is not local THEN THE data step SHALL refuse it by name,
  never printing the string, run no migration or seeder against it, and exit non-zero while the others still run
  (local: a loopback host, a Unix socket or no host).

## Compatibility and migration

- Root `stackra dev` in a product with service members used to start one `encore run` per member through turbo. It now
  starts ONE `encore run` of every service, in the generated app under `.stackra/dev/encore`, on the gateway port. A
  member's own dev port no longer has its own Encore process: it is a loopback forward to the gateway, so URLs that name
  it still answer. `stackra dev` inside one member, and every deploy, behave as before.
- Once the gateway answers, the root run now migrates every service database and seeds it with the `demo` profile by
  default. Pass `--seed none` to run no seeder (migrations still run), or `--seed minimal|test` for another profile.
  The step touches only a database on this machine (AC-010).
- The lane, and so every dev port, now comes from the product's row of `environments.dev.lanes.repos` when
  `STACKRA_LANE` is not set. A product listed there may get other ports than before; set `STACKRA_LANE` to keep a fixed
  lane. The quick doctor checks that lane's ports.
- Workers started by the root run get their lane's runway dev port passed to `wrangler dev`.
- `stackra db seed` in a service member builds the seed entry alone, as a service has no tsdown config; a member with
  its own tsdown config builds as before.
- `seederLedger` reads and writes `"database"."seed_records"`, the table migration 0003 creates; a database that seeded
  through the old unqualified name only worked when `database` was on the search path, and now works without it.

## Status history

- 2026-11-26 → Clarified (the audit's claims re-checked on origin/main; all open, plus the two seed faults)
- 2026-11-26 → Planned (plan.md)
- 2026-11-27 → Planned (plan.md) — Approved by Idris (CTO) 2026-11-27
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Implementing (built and proven end to end in a Linux container with two services; approval pending)
- 2026-11-27 → Implementing (CTO conditions: AC-009 loopback-only forwards with a test, AC-010 the data step refuses a
  database that is not local, the compatibility section, no internal machine names)
