# gen: a local `literal` shadows the `literal` helper

**Linear**: STA-1868
**Status**: implementing
**Clarifications status**: complete

## Problem

The Quality Gate's Lint step fails on main in `@stackra/gen` with one error: `emit-schemas.function.ts:223`,
`eslint(no-shadow)`: `'literal' is already declared in the upper scope`. The consolidation (STA-1829) merged STA-1695's
array-default code, whose boolean is named `literal`, into `fieldOf`, beside the module-level `literal()` helper that
writes a rule option as a TypeScript literal. Every other member lints clean (oxlint over all members of main).

## Change

Rename the boolean to `isLiteral` (booleans take `is`, ADR 0231). Behaviour is unchanged.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: @stackra/gen
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: none
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: bug
- **Change risk**: R0
