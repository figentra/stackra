# Bug Specification: the ui native entry loads without Skia

**Feature Branch**: `figentra/sta-1791-ui-skia-optional-peer`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1791

**Clarifications status**: complete

**Input**: Owner-approved, through the leader (2026-11-01), for 0.2.2. `@stackra/ui` declares
`@shopify/react-native-skia` as an optional peer (`^2.6.2`, catalog `mobile` 2.6.2, the version Expo SDK 57's
`bundledNativeModules.json` names), but 22 native files import it statically and the `./native` barrel re-exports them,
so an app without Skia cannot load `@stackra/ui/native` at all. `victory-native`, also an optional peer, draws on Skia
and is imported statically by 10 files, so it must be lazy too.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/design-system/ui` (`native/skia/load-skia.function.ts`, the 22 Skia-backed native
  files, `tsdown.config.ts`, the 13 tests that mock Skia)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (the optional-peer pattern of STA-1722)
- **New dependencies**: none (the peer, its optional flag and the catalog entry exist)
- **Deploy modes**: client apps only
- **Licence tier**: free
- **Docs to update**: ui README
- **Lane**: bug
- **Change risk**: R2 (every Skia-backed native component changes how it reaches Skia)

## Requirements

- **FR-001** The peer stays optional (`peerDependenciesMeta`) at the Expo-SDK-57 version, catalog `mobile` 2.6.2.
- **FR-002** No native file imports a Skia or victory-native value statically; each reads it from `loadSkia()` or
  `loadVictoryNative()`, a lazy `require` in a try that returns an inert stand-in when the peer is missing (type imports
  stay).
- **FR-003** The build keeps the literal `require` (`optionalRequires`), so Metro bundles Skia and victory-native when the app has them.
- **FR-004** Tests that mock Skia keep working: each also routes `loadSkia()` to the mocked module; a `loadSkia` test
  covers the stand-in.

## Status history

- 2026-11-01 → Clarified (owner-approved item through the leader)
