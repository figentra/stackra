# Feature Specification: SettingsFake keeps array values

**Created**: 2026-10-30

**Status**: Clarified

**Linear**: STA-1700

**Clarifications status**: complete

**Input**: OS Services B: an array setting seeded through SettingsFake reads back as an object

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: @stackra/settings (testing entry)
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

SettingsFake.set flattens only plain-object sections; an array or date value is stored as one value

## Status history

- 2026-10-30: Draft → Clarified
