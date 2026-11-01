# Feature Specification: figentra/figentra as a trusted publisher of `@figentra`

**Feature Branch**: `figentra/sta-1861-figentra-publisher`

**Created**: 2026-11-01

**Status**: Draft

**Linear**: STA-1861

**Clarifications status**: complete

**Input**: Core's root aliases call the `figentra` CLI (STA-1748), and its catalog pins `@figentra/cli` 0.1.0. The CLI
lives in figentra/figentra (`packages/developer/cli`, ADR 0500 decisions 1 to 3). It has never been published, so core
runs the STA-1857 `tools/scripts` bridge. figentra/figentra's release workflow can publish it only when the registry
has a `publishers` row for that repository on `@figentra`. figentra/figentra#18 makes the package publishable.

## Impact

- **Apps touched**: `apps/docs` (one paragraph and the publisher table of ADR 0453)
- **Services touched**: none
- **Packages touched**: `workers/registry` (migration `0007_figentra_figentra.sql`, README)
- **Cross-service events**: none
- **Tenancy and data**: one seed row in the registry's D1 (`publishers`); no schema change
- **Secrets**: none
- **ADR needed**: none; a line in ADR 0453's 2026-11-01 amendment records the row (decision 10)
- **New dependencies**: none
- **Deploy modes**: the registry Worker; applied by the owner's "Deploy registry" run
- **Licence tier**: internal (`@figentra`)
- **Docs to update**: ADR 0453, `workers/registry/README.md`
- **Lane**: lite
- **Change risk**: R2 (production registry seed data)

## Requirements

- **FR-001** Migration `0007_figentra_figentra.sql`, in the form of 0004 to 0006: the `figentra/figentra` publisher
  row for `@figentra` (repository id 1435864013, owner 314302700, `.github/workflows/release.yml`,
  `refs/heads/main`, environment `release`, the environment of figentra/figentra's release job).
- **FR-002** The README's Publishing section and layout table, and ADR 0453, name the publisher and the migration.

## Acceptance criteria

- **AC-001**: WHEN figentra/figentra's release job on `main` in environment `release` exchanges its OIDC token for
  `@figentra/cli` THE registry SHALL issue a publish token; from any other workflow, ref or environment it SHALL
  refuse.

## Not built here

- Core's switch from the STA-1857 bridge to the published CLI (after the first publish).
- The same migration in figentra/figentra's copy of the Worker (STA-1733), which has no `0006` yet either.
