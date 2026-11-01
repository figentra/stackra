# Bug Specification: a package's lang catalogues are importable

**Feature Branch**: `figentra/sta-1798-lang-assets-export`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1798

**Clarifications status**: complete

**Input**: stackra-8a, from juristra's box gate (8 services on published 0.2.0): gen's `.stackra/gen/i18n.ts` imports
`@stackra/access-log/assets/lang/{ar,en}/access_log.json`, and tsc cannot find it (TS2307). access-log ships `assets`
in `files` but its `exports` has no `./assets/*`, so the exports map blocks the path. achievements has the same gap.
Every other package with `assets/lang/` exports `"./assets/*": "./assets/*"`.

## Impact

- **Apps touched**: none
- **Services touched**: none in core (juristra's services typecheck)
- **Packages touched**: `packages/security/access-log`, `packages/application/achievements` (`package.json` exports);
  `packages/developer/cli` (a `stackra validate --repository` check and its test)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (ADR 0305 rule 1: catalogues are `assets/lang/<locale>/<namespace>.json`, read by the host)
- **New dependencies**: none
- **Deploy modes**: all
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: bug
- **Change risk**: R1 (an added export per package; a validate check)

## Requirements

- **FR-001** access-log and achievements export `"./assets/*": "./assets/*"`.
- **FR-002** `stackra validate --repository` refuses a package with an `assets/lang/` folder whose `exports` lacks
  `./assets/*` or whose `files` leaves `assets` out, with a vitest test over fixtures and this checkout.

## Status history

- 2026-11-01 → Clarified (stackra-8a's gate finding)
