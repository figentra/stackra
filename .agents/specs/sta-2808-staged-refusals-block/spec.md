# Feature Specification: gen's staged refusals block everywhere

**Feature Branch**: `figentra/sta-2808-staged-refusals-block`

**Created**: 2026-11-26

**Status**: Implementing

**Linear**: STA-2808

**Clarifications status**: complete

**Input**: Five gen checks promised as hard errors by 0.20 still only warned unless `STACKRA_GEN_STRICT=1` was set,
which only the flow-preset gate did. An app could ship a write at L1, a client write with no idempotency, a
security-risk action with no step-up, or a tenant model with no row-security migration, and still pass gen.

## Impact

- **Apps touched**: none
- **Services touched**: none (every core member, service and worker already passes `stackra gen --check`)
- **Packages touched**: packages/developer/gen, packages/developer/repo-checks, packages/tooling flow-preset
- **Cross-service events**: none
- **Tenancy and data**: strengthens it: `model_tenancy_migration_missing` now refuses
- **Secrets**: none
- **ADR needed**: no: implements ADR 0099 (write floor), ADR 0136 decision 3 (idempotency), ADR 0406 (step-up),
  ADR 0239 decision 1 (tenancy migration)
- **New dependencies**: none
- **Deploy modes**: SaaS and on-prem alike
- **Lane**: lite
- **Change risk**: R2 (breaking for adopters whose code trips a refusal; the changeset says how to upgrade)

## Requirements

- **FR-001** `action_risk_below_write`, `query_above_l1`, `step_up_missing`, `idempotency_missing` and
  `model_tenancy_migration_missing` are refusals in every run; `STAGED_REFUSAL_CODES` and the `strict` option are
  removed.
- **FR-002** `STACKRA_GEN_STRICT` is gone everywhere (gen, repo-checks' `checkGenStrictEnv`, turbo env lists, the
  flow-preset gate, the runbook).
- **FR-003** The refusal golden snapshots record each of the five as a refusal.
- **FR-004** The changeset marks @stackra/gen and @stackra/repo-checks as breaking and lists the upgrade steps.

## Acceptance

- **AC-001** `stackra gen --check` passes for every core member and in each service and worker.
- **AC-002** A member that trips any of the five fails gen with that code, with or without `STACKRA_GEN_STRICT`.

## Not built here

- The template's own adoption (its example service already passes; template PR stackra-inc/stackra-template#62).
