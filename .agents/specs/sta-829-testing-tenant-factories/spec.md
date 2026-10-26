# Feature Specification: tenant id and tenant scope-ref factories in @stackra/testing

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-829

**Clarifications status**: complete

**Input**: OS gate-A gap 11 (services/audit and services/billing SPECs): tests write fixed `ten_` and `scp_` ids.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/testing
- **Cross-service events**: none
- **Tenancy and data**: none (test ids only)
- **Secrets**: none
- **ADR needed**: no (ADR 0269 decision 2 already covers generic helpers)
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** `tenantScopeRef(label?, { under })` returns a frozen `{ id, path }`, path `<under>.<label>` (default
  `platform`), id hashed exactly as `scopeRefOf` in @stackra/scope/testing; no label hands out `tenant_<n>`.
- **FR-002** `tenantId(label?, { under })` is `tenantScopeRef(...).id`.
- **FR-003** No workspace import (the hash is written out; `TestScopeRef` is structural).

## Not built here

- Tests, typecheck and build are written but not run (owner mode).
