# Feature Specification: `@stackra/infra-gcp`: runway `cloud`, spend stop, Cloud SQL recovery, deploy roles, service account guard

**Feature Branch**: `figentra/sta-666-wave11`

**Created**: 2026-10-26

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-730

**Clarifications status**: complete

**Input**: Spend stop, Cloud SQL backups and point-in-time recovery, the runway `cloud` field, narrower deploy roles and the 30-character service account guard. The backup project and the project-per-product layout stay owner decisions.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/infrastructure/infra-gcp`
- **Cross-service events**: none
- **Tenancy and data**: none in code; every value is runway data or a tenant setting
- **Secrets**: none; ids are `ref:<path>` values from the stack config, CLIs use their own login
- **ADR needed**: ADR 0400, ADR 0401 (new)
- **New dependencies**: none
- **Deploy modes**: SaaS
- **Licence tier**: free (MIT)
- **Docs to update**: the package README
- **Lane**: lite
- **Change risk**: R3 (billing detach, IAM)

## Clarifications

### Session 2026-10-26

Owner mode (develop now, test later): code and tests are written, nothing is run; agents never run Pulumi, a deploy
CLI or anything that touches a cloud account.

## Requirements

- **FR-001**: `gcpDeploymentOf` resolves a deployment's project from `environments.<env>.cloud` (or a dedicated entry's), its region from its first GCP region (else `providers.gcp.region`), its prefix, ownership and labels; `providers.gcp.environments` is gone.
- **FR-002**: Every service account id is checked against 30 characters while the runway is read.
- **FR-003**: `stopNonProdAt` deploys a billing-detach Cloud Function on the budget topic, never where production runs.
- **FR-004**: `gcpRuntimeConfig` and `gcpRuntime`: Cloud SQL Postgres with backups in its region, retention, point-in-time recovery, deletion protection, private IP or connector-only TLS, and the data key when passed.
- **FR-005**: The infra service account holds `DEPLOY_ROLES`, never `roles/owner`.
- **FR-006**: `GcpHealthIndicatorDriver` checks the region's endpoint.

## Success Criteria

- **SC-001**: Every new symbol has a test beside it: `src/core/functions/__tests__/{gcp-baseline-config,gcp-runtime-config,service-account-id,parse-infra-runway}.function.test.ts`, `src/node/functions/__tests__/{gcp-baseline,gcp-runtime,spend-stop,ci-access}.function.test.ts`.
- **SC-002**: `pnpm verify` is green for the members (run in the separate testing workflow).

## Out of scope

Copies to a backup project (ADR 0186, owner); projects per product and region (ADR 0354 OQ2, owner); the Encore Cloud role on GCP (runtime undecided); the spend stop on a sandbox project (owner).

## Status history

- 2026-10-26 · — → Implementing · Claude (wave 11 builder) · spec written with the change (owner mode).
