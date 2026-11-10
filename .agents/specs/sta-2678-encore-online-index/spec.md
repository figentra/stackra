# Feature Specification: Encore's migration copy builds online indexes in its one transaction

**Feature Branch**: `figentra/sta-2678-encore-online-index`

**Created**: 2026-11-10

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2678

**Clarifications status**: complete

**Input**: STA-2664 (j), 0.33.1 item 4. Every service declares `@stackra/database`, whose migration 0006
(`database.0006_add_isolation_scope`) builds four indexes with `create index concurrently`, each in its own
non-transactional step. Gen copies the compiled files into the Encore service's `migrations/` folder, and Encore's
runner (`cli/daemon/sqldb/migrate.go`) appends its `schema_migrations` insert to each file and sends the two as one
query, so Postgres runs them in an implicit transaction and the build fails (SQLSTATE 25001). No service starts under
`encore run`.

### Sources

- `packages/developer/gen/src/node/functions/generate.function.ts` (the Encore copy of the compiled migrations)
- `packages/developer/gen/src/core/functions/emit-migrations.function.ts` (the `-- stackra:transactional=false` header)
- `packages/data/database/src/node/database/migrations/0006-add-isolation-scope.migration.ts` (frozen)
- ADR 0159, the 2026-10-24 amendment (STA-408: Encore's runner has no non-transactional path)

## Impact

- **Apps touched**: none
- **Services touched**: none (a service's Encore `migrations/` copy changes on the next gen)
- **Packages touched**: packages/developer/gen (a helper, the Encore copy, a test)
- **Public contract change**: none; `.stackra/migrations` is unchanged
- **Cross-service events**: none
- **Tenancy and data**: none; the same indexes are built, blocking writes to the table while they build
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: yes, an amendment note on ADR 0159 (which path each environment uses)
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: ADR 0159
- **Lane**: full
- **Change risk**: R2 (the SQL Encore applies to a service's database)

## Acceptance criteria

- **AC-001**: WHEN gen copies a non-transactional step into the Encore service's `migrations/` folder THE copy SHALL
  write each concurrent statement (`create [unique] index`, `drop index`, `reindex`, `refresh materialized view`) in
  its plain form, which runs inside Encore's transaction.
- **AC-002**: THE transactional steps' Encore copies and every file in `.stackra/migrations` SHALL stay byte-identical
  to the compiled output, so `stackra db migrate` keeps the online form.
- **AC-003**: THE ADR 0159 amendment SHALL state which path each environment uses: dev and staging apply Encore's
  copy (the blocking build is accepted there); production applies `stackra db migrate` with the online form, or runs
  Encore's copy only after an explicit owner decision.

## Status history

- 2026-11-10 → Clarified (Encore's runner has no non-transactional path; the leader chose the plain form in its copy)
- 2026-11-10 → Planned (plan.md) — Approved by leader 2026-11-10 (0.33.1 item 4)
- 2026-11-10 → Tasked (tasks.md; built in the same branch, stacked on STA-2667)
