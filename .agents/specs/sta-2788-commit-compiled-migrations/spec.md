# Feature Specification: gen: commit the compiled migrations, and the apply path runs exactly the committed SQL

**Feature Branch**: `figentra/sta-2788-commit-compiled-migrations`

**Created**: 2026-11-25

**Status**: Tasked

**Tier**: feature

**Approver**: CTO (Idris), technical-only stop, under the owner's delegation

**Linear**: STA-2788

**Clarifications status**: complete

**Input**: stackra/verify's migration-lint (Squawk) reads migration SQL from a pull request's committed tree, but the
compiled migrations were gitignored, so it linted nothing. The CTO approved committing them on one condition: the
apply path runs the committed compiled SQL and never regenerates it at deploy, so what Squawk lints is what runs. A
later ruling put the packages' migrations in scope: they are what Stackra ships, and a host compiles them.

### Sources

- Linear STA-2788 (the CTO's condition) and the CTO's ruling of 2026-11-25 (packages in scope)
- `packages/developer/runway/src/node/functions/encore-deploy-tree.function.ts` (the Encore deploy commit)
- `packages/developer/gen/src/core/functions/emit-encore-database.function.ts` (Encore's `./migrations` folder)
- `packages/developer/gen/src/node/functions/compile-migrations.function.ts` (a host compiles a package's shipped
  source migrations)
- `.github/workflows/ci.yml` ("Committed manifests match gen", "Migration lint (Squawk)")

## Impact

- **Apps touched**: none
- **Services touched**: none (no service here has migrations)
- **Packages touched**: packages/developer/gen, packages/developer/runway; the 25 packages with migrations of their
  own gain their committed compiled SQL (generated files only, no migration source changes)
- **Public contract change**: gen writes and checks committed compiled SQL (`src/node/database/compiled-migrations`
  in a package, `.stackra/migrations` and `stackra-encore/<member>/migrations` in a service); a host's gen refuses a
  registry-installed package whose shipped SQL differs (`migration_package_drift`); runway's Encore deploy refuses a
  working tree whose compiled SQL differs from the commit's
- **Cross-service events**: none
- **Tenancy and data**: none; the compiled SQL is what was already applied, now committed
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no (ADR 0159's compiled stream, now committed)
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: gen README, `.github/workflows/README.md`
- **Lane**: full
- **Change risk**: R2 (the Quality Gate and the Encore deploy path)

## Acceptance criteria

- **AC-001**: THE compiled migrations a service applies and the compiled SQL of a package's own migrations SHALL be
  committed, and every other generated file SHALL stay ignored.
- **AC-002**: WHEN committed compiled SQL differs from what gen writes from the sources (changed, missing or
  leftover) THE `stackra gen --check` run and the Quality Gate's "Committed manifests match gen" step SHALL fail.
- **AC-003**: WHEN runway builds an Encore deploy commit THE deploy commit SHALL carry the source commit's compiled
  SQL byte for byte, and a working tree whose compiled SQL differs SHALL be refused before anything is committed.
- **AC-004**: WHEN a host compiles a registry-installed package's migrations to SQL other than the SQL the package
  ships THE host's gen SHALL refuse with `migration_package_drift`.
- **AC-005**: THE Quality Gate's Squawk step SHALL lint the committed compiled SQL of services and packages, with its
  transactional and online split.

## Status history

- 2026-11-25 → Clarified (CTO: commit on the condition that the apply path runs the committed SQL; packages in scope)
- 2026-11-25 → Planned (plan.md) — Approved by CTO 2026-11-25 (Linear STA-2788)
- 2026-11-25 → Tasked (tasks.md)
