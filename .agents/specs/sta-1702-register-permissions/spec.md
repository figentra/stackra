# Feature Specification: Gen registers permissions and module roles at boot

**Created**: 2026-10-30

**Status**: Clarified

**Linear**: STA-1702

**Clarifications status**: complete

**Input**: OS Services B: no gen emit of registerPermissions; a real boot runs with empty permission and role registries

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: @stackra/gen
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: lite
- **Change risk**: R2

## Behaviour

The generated registrations call registerPermissions for every Permission static (system and restricted recognised) and registerRoles for every module role, permissions first

## Status history

- 2026-10-30: Draft → Clarified
