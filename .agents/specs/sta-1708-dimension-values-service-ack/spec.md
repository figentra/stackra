# Feature Specification: DimensionValues memory driver and ServiceAckService binding

**Created**: 2026-10-30

**Status**: Clarified

**Linear**: STA-1708

**Clarifications status**: complete

**Input**: OS Services B: DimensionValues has no driver in core; ServiceAckService is not bound by gen wiring or PLATFORM_BINDINGS

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: @stackra/iam, @stackra/gen
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

iam ships MemoryDimensionValuesDriver (the memory candidate, fed by project/retire; nothing live until projected); gen binds ServiceAckService where injected and registers its ServiceAckSet partner

## Status history

- 2026-10-30: Draft → Clarified
