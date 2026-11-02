# Feature Specification: figentra/pay and figentra/invoicing as trusted publishers of `@figentra`

**Feature Branch**: `figentra/sta-1905-pay-invoicing-publishers`

**Created**: 2026-11-01

**Status**: Draft

**Linear**: STA-1905

**Clarifications status**: complete

**Input**: Gen 0.3.0 refuses billing's and tamo's calls to services in other repositories (`client_service_unknown`)
until each producer publishes its contract package (ADR 0511 decisions 1 to 5): `@figentra/<service-package>-contract`,
`stackra.kind` `contract`, the manifest, `openapi.json` and the lang catalogue, released by the producer's own
`release.yml` through GitHub OIDC. figentra/os already publishes `@figentra` (0006). figentra/pay and
figentra/invoicing have no `publishers` row, so their release workflows cannot publish
`@figentra/pay-service-payments-contract` and `@figentra/invoicing-service-invoicing-contract`. The leader approved the
row for both (2026-11-01).

## Impact

- **Apps touched**: `apps/docs` (the publisher table and one paragraph of ADR 0453)
- **Services touched**: none
- **Packages touched**: `workers/registry` (migration `0008_figentra_pay_invoicing.sql`, its test, the README)
- **Cross-service events**: none
- **Tenancy and data**: two seed rows in the registry's D1 (`publishers`); no schema change
- **Secrets**: none
- **ADR needed**: none; ADR 0453's 2026-11-01 amendment records the rows (decision 10), ADR 0511 decision 5 asks for them
- **New dependencies**: none
- **Deploy modes**: the registry Worker; applied by the owner's "Deploy registry" run
- **Licence tier**: internal (`@figentra`)
- **Docs to update**: ADR 0453, `workers/registry/README.md`
- **Lane**: lite
- **Change risk**: R2 (production registry seed data)

## Requirements

- **FR-001** Migration `0008_figentra_pay_invoicing.sql`, in the form of 0004 to 0007: the `figentra/pay` (repository
  id 1435861177) and `figentra/invoicing` (repository id 1440593616) publisher rows for `@figentra`, owner 314302700,
  `.github/workflows/release.yml`, `refs/heads/main`, environment `release`. 0007 is figentra/figentra's (#197).
- **FR-002** A test beside the other publisher tests, and the existing lists of `@figentra` publishers name both.
- **FR-003** The README's Publishing section and layout table, and ADR 0453, name the publishers and the migration.

## Acceptance criteria

- **AC-001**: WHEN figentra/pay's or figentra/invoicing's release job on `main` in environment `release` exchanges its
  OIDC token for a `@figentra` name THE registry SHALL issue a publish token; from any other workflow, ref or
  environment, or a repository with another id, it SHALL refuse.

## Not built here

- The contract packs and publishes in pay, invoicing and os (their own PRs), and billing's and tamo's catalog pins.
- The cross-app event relay (ADR 0511 decisions 12 and 15), which billing's listeners also need.
