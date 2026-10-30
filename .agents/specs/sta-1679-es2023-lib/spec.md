# Feature Specification: typescript preset lib ES2023

**Created**: 2026-10-30

**Status**: Clarified

**Linear**: STA-1679

**Clarifications status**: complete

**Input**: Commerce labelling failed TS2550 on toSorted and toReversed (about 15 uses) where @types/node was absent: the presets' lib is ES2022, while Node 24 and every supported browser have the ES2023 array methods.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/tooling/typescript
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: a dated Note on ADR 0025
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Licence tier**: free
- **Docs to update**: ADR 0025 (Note)
- **Lane**: lite
- **Change risk**: R1 (compiler lib only; target and syntax unchanged)

## Behaviour

1. Every preset that pins ES2022 (base, library, react, decorators-react, service-worker) lists ES2023 instead; expo stays ESNext; target stays ES2022.
2. presets.test.ts checks every exported preset resolves a lib of ES2023 or newer.
3. ADR 0025 gets a dated Note beside STA-1656's.

## Status history

- 2026-10-30: Draft → Clarified
