# Feature Specification: The connectors package category

**Created**: 2026-10-30

**Status**: Clarified

**Linear**: STA-1719

**Clarifications status**: complete

**Input**: Leader: products put each provider connector in packages/connectors/<provider>; core's categories have no connectors, so the structure phase fails

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: @stackra/repo-checks, @stackra/skills, the registry Worker, docs
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

connectors is a package category (tier lib): one provider's Integration and Connection classes per package; the structure rules, pnpm new, the manifest schema, the registry browser and the docs list it; ADR 0127 gains an amendment

## Status history

- 2026-10-30: Draft → Clarified
