# Feature Specification: Preset views set fixed list-query inputs

**Created**: 2026-10-30

**Status**: Clarified

**Linear**: STA-1688

**Clarifications status**: complete

**Input**: Commerce frontend: a merged-customers view needs customer.list with includeMerged: true

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: @stackra/panel
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: lite
- **Change risk**: R1

## Behaviour

A preset view declares .input({...}) typed against the list query input; the list page draws preset views as tabs; tableInput merges the fixed input under the user's filters, sort, search and cursor

## Status history

- 2026-10-30: Draft → Clarified
