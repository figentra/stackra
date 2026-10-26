# Feature Specification: release: rules, access-log, scope, market-packs, devices, collaboration and payments on the framework line

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-819

**Clarifications status**: complete

**Input**: Publish seven packages the OS catalog lacks and hand the OS its catalog rows.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/foundation/market-packs (package.json), .changeset
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none outside the workspace
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** A changeset puts the seven packages and `@stackra/segments` (a dependency of `@stackra/iam`, also missing from the catalog) on the framework version line.
- **FR-002** The OS catalog rows are handed over in the issue: each package at the framework version (`1.0.0`).

## Not built here

- `package.json` edits of rules, access-log, scope, devices, collaboration and payments: outside this build's folders. Their `files` and `publishConfig` already match the published packages; all of them, like every package, are still `"private": true`, so nothing publishes until the release flips that flag (owner decision, ADR 0289 decision 11).
- Editing figentra/os.
