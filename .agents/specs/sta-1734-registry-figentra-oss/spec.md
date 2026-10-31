# Feature Specification: the `@figentra-oss` registry scope

**Feature Branch**: `figentra/sta-1734-registry-figentra-oss`

**Created**: 2026-10-31

**Status**: Implementing <!-- owner approved through the leader, 2026-10-31 -->

**Linear**: STA-1734

**Clarifications status**: complete

**Input**: Figentra Flow is MIT and cannot publish to `@figentra` (internal, commercial). The owner chose a new open
scope, `@figentra-oss`, with `figentra/flow` as its trusted publisher.

## Impact

- **Apps touched**: `apps/docs` (ADR 0453 amendment of 2026-10-31)
- **Services touched**: none
- **Packages touched**: `workers/registry` (migration `0005_figentra_oss.sql`, README)
- **Cross-service events**: none
- **Tenancy and data**: two seed rows in the registry's D1 (`scopes`, `publishers`); no schema change
- **Secrets**: none
- **ADR needed**: an amendment of ADR 0453 (decision 10 asks for one before another scope)
- **New dependencies**: none
- **Deploy modes**: the registry Worker; applied by the owner's "Deploy registry" run
- **Licence tier**: free (open scope, anonymous reads)
- **Docs to update**: ADR 0453, `workers/registry/README.md`
- **Lane**: lite
- **Change risk**: R2 (production registry data, seed rows only)

## Requirements

- **FR-001** Migration `0005_figentra_oss.sql` in the form of 0003 and 0004: the scope row (`open`, `open-source`) and
  the `figentra/flow` publisher row (repository id 1432855858, owner 314302700, read from the GitHub API on 2026-10-31).
- **FR-002** The README's scope, publisher and migration lists and ADR 0453's scope table name the new scope.
