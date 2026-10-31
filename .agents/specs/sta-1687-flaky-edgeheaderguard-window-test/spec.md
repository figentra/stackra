# Feature Specification: Flaky EdgeHeaderGuard window test

**Created**: 2026-10-30

**Status**: Clarified

**Linear**: STA-1687

**Clarifications status**: complete

**Input**: Leader report: edge-header.guard.test.ts:120 fails intermittently in STA-1665's gate

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: @stackra/app (test only)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: lite
- **Change risk**: R0

## Behaviour

The window test pins Date and checks just inside and just outside both edges, so it no longer depends on the real clock

## Status history

- 2026-10-30: Draft → Clarified
