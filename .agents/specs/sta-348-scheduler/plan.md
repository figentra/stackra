# Plan: `@stackra/scheduler` wave 6

**Spec**: `.agents/specs/sta-348-scheduler/spec.md`

## Design

- Four entries through stand-in barrels (STA-339 replaces them): `./contracts` from `src/contracts/` (the leaf: the
  `ScheduleDriver` and `CronScopes` ports, `Misfire`, `Schedule`), `.` from `src/core/` with `src/config/`, `./node`
  from `src/node/` (the Postgres driver and the migration), `./testing` from `src/testing/` (`tick` and its plugin).
- `parseCron` reads five fields into sets of values plus the two day-star flags; `cronRuns` steps minute by minute over
  `(after, until]`, reading each instant's wall clock in the time zone (UTC fields directly, other zones through one
  cached `Intl.DateTimeFormat`), and keeps the matches.
- `registerScheduledJobs` (gen's entry) records each job action both ways under its locked key and parses its cron at
  boot.
- `SchedulerService.tick(at)` runs `dispatch` under `Locks.tryWith("scheduler:tick", 1m)`: it reads the watermarks,
  walks the registered crons (UTC, the config's policy, `CronScopes` listed once when a per-scope cron is due) and the
  stored schedules (own scope, time zone and policy, from their creation), pushes each due run with
  `QueueService.push(type, input, { scope })`, and advances every evaluated key to `at` last. `run({ signal })` ticks at
  the start of each minute and logs a failed tick. `schedule` checks the action, cron and time zone and stores a
  `Schedule`; `unschedule` deletes one only from its scope.
- `MemoryScheduleDriver` and `MemoryCronScopesDriver` keep data in process memory; `PostgresScheduleDriver` keeps
  `scheduler.schedules` and `scheduler.watermarks` with raw, bound statements (one CTE deletes a schedule and its
  watermark; one upsert over a JSON array advances every key). `CreateSchedulesMigration` creates both tables and the
  `ltree` extension.
- `SchedulerConfig extends Config({ schema: SchedulerOptions })`, with `SchedulerConfig$` and the `DriverRegistry`
  entry beside it as `@stackra/queue` has them.

## Constitution Check

| Law                                   | Result | Note                                                                                                          |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/runtime/scheduler`; imports only `tier:lib` packages; no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged; the driver uses the service's own connection                             |
| Security                              | PASS   | every value is a bound parameter; a scope deletes only its own schedules; a schedule names code by key only   |
| HTTP and events                       | N/A    | no endpoint or event; the refusals are `Validation` refusals (400)                                            |
| Tenancy                               | PASS   | rows keyed by `scope_id`/`scope_path`; no RLS on the tick's cross-scope read (spec, for the data review)      |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) runs the tests        |
| Not built yet (ADR 0227)              | PASS   | Postgres and memory only; no external scheduler, no new dependency                                            |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                     |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                             |
| Deploy modes (ADR 0076)               | PASS   | one build in SaaS, on-prem and air-gapped                                                                     |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                            |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; ADR 0148 stands, the gaps are listed in the spec                    |

- Boundaries: runtime imports of actions, config, container, contracts, database, errors, locking, queue and
  validation; dev-only `@stackra/testing` and the tooling presets.
- Versions: catalogs and `workspace:*` only.
- Naming: drivers `<Name>Driver`, refusals end in `Error`, the migration `CreateSchedulesMigration`, no `define`
  prefix, no `@Cron`.

## Properties

- **P-001**: `package.json` names `@stackra/scheduler` at `packages/runtime/scheduler` and `exports` lists only `.`, `./contracts`, `./node` and `./testing` — Validates: FR-001
- **P-002**: each entry's `index.test.ts` lists exactly its values, with `SchedulerService` in `.`, `ScheduleDriver` in `./contracts`, `PostgresScheduleDriver` in `./node` and `tick` in `./testing` — Validates: FR-002
- **P-003**: `buildConfig(SchedulerConfig)` equals `SchedulerConfig$.parse({})`; a window under one minute or over one day and an unknown driver refuse — Validates: FR-003
- **P-004**: for every valid expression each field's set holds exactly the written values; for every malformed one the refusal names the failed field; for every range the runs are the matching whole minutes in `(after, until]` — Validates: FR-004
- **P-005**: for every pair of ticks in one minute the second pushes nothing; a tick while the lock is held reports `ran: false`; missed runs older than the window are never pushed — Validates: FR-005
- **P-006**: for every listed scope a per-scope cron pushes one job in it; a stored schedule's jobs carry its scope and no run precedes its creation — Validates: FR-006
- **P-007**: for every statement the placeholders equal the parameters and no value appears in the text; a delete binds the scope — Validates: FR-007
- **P-008**: `tick` rejects without a current scheduler and, on a compiled app, pushes the due run `drainQueue` runs — Validates: FR-008
- **P-009**: `grep -rn Cron\( packages/runtime/scheduler/src` finds no decorator, and every tenant word in `src` is the `perTenant` option `@stackra/actions` names — Validates: FR-009

## Deploy modes

| Mode       | Behaviour                                                                       |
| ---------- | ------------------------------------------------------------------------------- |
| SaaS       | the same build; gen's Encore CronJob calls `tick` each minute                   |
| On-prem    | identical build; `run({ signal })` is the timer with the Postgres advisory lock |
| Air-gapped | identical: needs no network; Postgres holds schedules, watermarks and the lock  |
