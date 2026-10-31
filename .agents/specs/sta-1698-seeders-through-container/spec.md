# Feature Specification: Seeders resolve through the container

**Created**: 2026-10-30

**Status**: Clarified

**Linear**: STA-1698

**Clarifications status**: complete

**Input**: Leader: OS identity's SessionsMinimalSeeder injects SettingsPackService and fails under .seed()

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: @stackra/database
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

The testing module's .seed() takes a seeder from the container when it is bound (its constructor dependencies injected), else builds it without arguments, as app.repository does

## Status history

- 2026-10-30: Draft → Clarified
