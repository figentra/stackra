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
- **Packages touched**: packages/state/settings, packages/developer/cli, packages/developer/gen, packages/developer/runway
- **Cross-service events**: none
- **Tenancy and data**: the CLI apply writes sandbox revisions at a named scope node inside its scope session
- **Secrets**: none (the connection is the member's `DATABASE_URL`)
- **ADR needed**: yes, 0395 (Proposed: rests on ADR 0359's proposed decisions 6 and 8); 0435 (Proposed: one apply per
  environment)
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
- **FR-006** `withDeployLock`, `DeployLock` and `RunwayLockedError` in @stackra/runway: one apply per environment at a
  time under `runway:deploy:<project>:<environment>`, held through the caller's `Locks`; a held lock refuses at once.
- **FR-007** The Postgres action stores are selected by name in runway's config layer
  (`config: { "actions.stores": { idempotency: postgres, rateLimit: postgres } }`, or the root's
  `defaults.service.config`): `postgres` is in `STORE_DRIVERS` (G1) and runway's config values stay open, so
  `parse-runway.function.test.ts` asserts it passes through unchanged.

- **FR-008** (wave 12) `feature-flags/no-plan-targeting` is an error in `base.jsonc`, the plugin loaded from its source
  file by a relative path, so lint needs no build (ADR 0421).
- **FR-009** (wave 12) `settingsApply({ market })` takes the holder's resolved pack; `MarketPackSettingFloorSourceDriver`
  checks a floor-bearing group with it (ADR 0419 decision 3).

## Not built here

- Wrapping `settings:apply` (and the deploy commands) in `withDeployLock` in @stackra/cli: the lock exists in runway;
  the CLI call site is outside the wave 12 boundary.
- Registering the `postgres` store drivers in @stackra/database (outside the wave 12 boundary).
- The OS `SettingFloorSource` driver (tenant to market and date): OS tenancy.
- The CLI's `--market` flag that resolves the holder's pack and passes it to `settingsApply` (@stackra/cli, outside the
  wave 12 boundary); until then the CLI refuses a floor-bearing group.
- The ADR 0137 amendment naming `live_read_only` among the declared codes.
- Tests, typecheck and build are written but not run (owner mode).
