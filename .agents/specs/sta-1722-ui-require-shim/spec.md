# Bug Specification: no require shim in a published dist

**Feature Branch**: `figentra/sta-1722-ui-require-shim-2`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1722

**Clarifications status**: complete

**Input**: Core 0.2.1 release task (leader, 2026-11-01). `@stackra/ui` 0.2.0's dist calls `__require("react")`, which
throws for every ESM consumer (stackra-pro #1). The first fix (27dcb797: react-dom an optional peer, and a build guard
against the shim) was red at f4 (sta-1722-gate, b71a79ab): the guard also fails ui and identity on the deliberate
lazy `require` of their optional expo peers in the native entry.

## Impact

- **Apps touched**: none (the mobile app's typecheck only needs ui's dist to build)
- **Services touched**: none
- **Packages touched**: `packages/tooling/tsdown` (`library()` guard, `optionalRequires`), `packages/design-system/ui`
  (react-dom peer, tsdown config), `packages/security/identity` (tsdown config)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (build output stays ADR 0025)
- **New dependencies**: none
- **Deploy modes**: build output of published packages only
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: bug
- **Change risk**: R2 (every library build runs the guard)

## Requirements

- **FR-001** ui keeps react and react-dom external (react-dom an optional peer).
- **FR-002** `library()` fails a chunk that calls `__require("x")`, for every package.
- **FR-003** `library({ optionalRequires })` rewrites rolldown's `__require("x")` back to a literal `require` for a listed
  name (`polyfillRequire: false` does not stop the shim, f4 gate 2026-11-01), so a native entry's lazy `require("x")`
  of a listed optional peer stays a literal call that Metro sees and bundles; a literal `require` of any other name
  still fails the build.
- **FR-004** ui lists expo-clipboard, expo-document-picker, expo-haptics, expo-image-picker and expo-video; identity
  lists expo-apple-authentication.

## Status history

- 2026-11-01 → Clarified (task from the leader for core 0.2.1, after f4's red gate)
