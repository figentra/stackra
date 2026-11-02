# Feature Specification: figentra/billing as a trusted publisher of `@figentra`

**Feature Branch**: `figentra/sta-1886-billing-publisher`

**Created**: 2026-11-02

**Status**: Draft

**Linear**: STA-1886

**Clarifications status**: complete

**Input**: figentra/velora's gen refuses its calls to billing's services (`client_service_unknown`) until figentra/billing
publishes their contract packages (ADR 0511 decisions 1 to 5), as pay and invoicing do since 0008. figentra/billing's
release workflow gains the contract step in its own PR; it has no `publishers` row, so it cannot publish
`@figentra/billing-service-{billing,entitlements,usage}-contract`. The leader approved the row (2026-11-02).

## Impact

- **Apps touched**: `apps/docs` (the publisher table and one paragraph of ADR 0453)
- **Services touched**: none
- **Packages touched**: `workers/registry` (migration `0009_figentra_billing.sql`, its test, the README)
- **Cross-service events**: none
- **Tenancy and data**: one seed row in the registry's D1 (`publishers`); no schema change
- **Secrets**: none
- **ADR needed**: none; ADR 0453's 2026-11-02 amendment records the row (decision 10), ADR 0511 decision 5 asks for it
- **New dependencies**: none
- **Deploy modes**: the registry Worker; applied by the owner's "Deploy registry" run
- **Licence tier**: internal (`@figentra`)
- **Docs to update**: ADR 0453, `workers/registry/README.md`
- **Lane**: lite
- **Change risk**: R2 (production registry seed data)

## Requirements

- **FR-001** Migration `0009_figentra_billing.sql`, in the form of 0008: the `figentra/billing` (repository id 1440593571) publisher row for `@figentra`, owner 314302700, `.github/workflows/release.yml`, `refs/heads/main`,
  environment `release`. 0007 is figentra/figentra's (#197); no open PR takes 0009.
- **FR-002** A test beside the other publisher tests, and the existing lists of `@figentra` publishers name it.
- **FR-003** The README's Publishing section and layout table, and ADR 0453, name the publisher and the migration.

## Acceptance criteria

- **AC-001**: WHEN figentra/billing's release job on `main` in environment `release` exchanges its OIDC token for a
  `@figentra` name THE registry SHALL issue a publish token; from any other workflow, ref or environment, or a
  repository with another id, it SHALL refuse.

## Not built here

- billing's contract step (figentra/billing#20) and velora's catalog pins.
- The cross-app event relay (ADR 0511 decisions 12 and 15).
