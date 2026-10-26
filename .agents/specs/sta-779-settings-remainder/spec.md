# Feature Specification: settings remainder (pack CLI, rollback, minimum release, floor-aware reader, lint rule)

**Feature Branch**: `figentra/sta-666-wave11`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-779

**Clarifications status**: complete

**Input**: `stackra settings:diff` and `settings:apply`; promotion rollback and a change set's minimum release (ADR
0359 d8, OQ6); gen wires a floor-aware reader; a `./testing` helper for `SettingsResolver`; `no-plan-targeting` on in
the presets; the live-read-only refusal code settled.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/state/settings, packages/developer/cli, packages/developer/gen
- **Cross-service events**: none
- **Tenancy and data**: the CLI apply writes sandbox revisions at a named scope node inside its scope session
- **Secrets**: none (the connection is the member's `DATABASE_URL`)
- **ADR needed**: yes, 0395 (Proposed: rests on ADR 0359's proposed decisions 6 and 8)
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R2

## Requirements

- **FR-001** `live_read_only` (core `LiveReadOnlyError`) replaces `setting_live_read_only`.
- **FR-002** `Promotable.rollbackOf`, `PromotionDiff.previous` and `.release`, `PromotionReleaseTooOldError`.
- **FR-003** `SettingsReader#get` lifts floors (`liftFloors`); gen binds the reader with `SettingFloorSource` and the
  resolver where injected.
- **FR-004** `fakeResolver` in `./testing`.
- **FR-005** `settingsDiff`, `settingsApply`, `RegisteredFloorGuardDriver` in `./node`; the two CLI commands.

## Not built here

- `feature-flags/no-plan-targeting` in the oxlint presets: the plugin loads only from the built `dist/lint.mjs` of
  @stackra/feature-flags, a config preset may take no workspace dependency, and the root `lint` task has no build
  dependency, so wiring it into `base.jsonc` broke every lint run on an unbuilt checkout (tried, reverted). Needs the
  owner to add `@stackra/feature-flags#build` before `lint` in the root `turbo.jsonc`, or a loader that reads source.
- Runway deploy locks for a settings apply (runway hand-off).
- The OS `SettingFloorSource` driver (tenant to market and date): OS tenancy.
- A floor-bearing group through the CLI: refused until the runner can see the holder's market.
- The ADR 0137 amendment naming `live_read_only` among the declared codes.
- Tests, typecheck and build are written but not run (owner mode).
