# Plan: `stackra db seed`

**Spec**: `.agents/specs/sta-1709-db-seed/spec.md`

## Design

1. **Runner, `@stackra/database/node`.** `runSeeders({ container, member, seeders, profile, module?, again, ranBy })`
   picks the seeders of the profile's folders (`minimal`, then `demo` or `test`), optionally one module, in list
   order. For each one, the checksum is the SHA-256 of the seeder class's source (`type.toString()`), so a changed
   seeder runs again with no gen-side hashing. A seeder whose ledger row holds the same checksum is skipped unless
   `again`. Otherwise it is resolved through the container (`has ? get : construct`, the STA-1698 rule) and runs in one
   `Database.current().transaction`, which also upserts its ledger row in `seed_records` (pack `seeder:<member>`, kind
   `seeder`, key `<module>.<profile>`, `hash` the checksum, `rows` `[{ ranBy, at }]`). No new migration: the table is
   migration 0003's. A failing seeder rolls back alone; the runner stops there and throws an error naming it.
   `runSeedEntry({ container, member, seeders, argv })` parses `--profile`, `--module`, `--again` and `--ran-by` and
   prints what ran and what was skipped.
2. **Gen.** `emitBoot` takes `options.url` (else the Encore database, now imported lazily) and `options.relay`
   (`false`: no relay loop). For a service with seeders, gen writes `.stackra/entry/seed.ts`. The entry loads the
   registrations, calls `bootApp(wiring, { roots: [Root], env })` and `boot(container, { signal, url:
directDatabaseUrl(), relay: false })`, then `runSeedEntry` with the seeder list (key, profile, module, class),
   then aborts and closes the container. The service's tsdown config builds it like any other entry.
3. **CLI.** `stackra db seed [--profile minimal|demo|test] [--env <environment>] [--module <key>] [--again]
[--allow-production]` refuses an unknown profile, and on `production` refuses `demo`, `test` and `--again` without
   `--allow-production`. It builds the member (its own `tsdown`), then runs `node dist/seed.mjs` with the flags and
   `--ran-by` (`STACKRA_ACTOR`, else `GITHUB_ACTOR`, else the OS user). On production it prints who ran it. No
   seed entry means "no seeders" and exit 0.
4. **seed-pack.** After writing the records, `stackra seed-pack` runs the same `db seed` step with its profile and
   environment when the member has a seed entry, so runway's `previewSeedStep` and the testbed's console job change
   nothing.
5. **Tenancy.** The runner opens no tenant; a tenant-owned write is refused by RLS until `CallIsolation` lands. The
   per-tenant run comes in a follow-up issue, filed when this lands.

## Tests

- database: `runSeeders` over a testing app, using a seeder that injects a service and a memory ledger stand-in for
  the order, skip, `--again`, module filter, failure stop and checksum cases. The SQL ledger is covered by the gate's
  Postgres tier.
- gen: the seed entry for a service with seeders, none without, and boot's `url` and `relay` options.
- cli: the profile check, the production guard, the actor and the no-entry path. The child process is replaced.
- seed-pack: it runs the seed step after the records.

## Constitution Check

| Law                       | Result | Note                                                              |
| ------------------------- | ------ | ----------------------------------------------------------------- |
| Boundaries (ADR 0003)     | PASS   | the CLI loads nothing of the member; the member runs its own code |
| Secrets (ADR 0173)        | PASS   | the connection is `directDatabaseUrl()`, never an argument        |
| Security                  | PASS   | production guard; RLS stays on, so tenant rows are refused        |
| Not built yet (ADR 0227)  | PASS   | nothing new                                                       |
| Test placement (ADR 0022) | PASS   | `__tests__/` beside each subject                                  |
| Versions and catalogs     | PASS   | no dependency change                                              |
