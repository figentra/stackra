# Feature Specification: extend `@stackra/settings` and `@stackra/feature-flags` for the configuration model

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Clarifications status**: complete (defaults applied in owner mode; see Open items)

**Input**: rows of `notes/handover/stackra-package-needs.md`: `@stackra/settings` (revisions, packs, diff and apply,
schedules, four-eyes; developer and normal visibility; ADR 0213 d4-d5, 0359), "Settings-layer resolver with floors"
(config-model section 3), the `Promotable` port (ADR 0280, 0359 d6; homed in settings by the brief), and
`@stackra/feature-flags` (plan-targeting lint rule).

## Impact

- **Packages touched**: `packages/state/settings`, `packages/state/feature-flags`
- **Tables**: `settings.stored_setting_revisions` (new, migration 0002), no RLS policy, as `stored_settings`
- **New dependencies**: none outside catalogs (`yaml` and `zod` from the default catalog, `@stackra/market-packs`)
- **ADR needed**: the plan-targeting rule (row says ADR needed); `live_read_only` code (ADR 0359 open question 5)
- **Change risk**: R2 (new public contracts; one abstract method added to `SettingValueStore`)

## Requirements

- FR-001 Floors: platform floor < product default < tenant < user; a write below a floor is refused
  (`setting_below_floor`); a stored value or default below a floor reads as the floor, reported with `source: floor`.
- FR-002 Live vs sandbox per key (`@Setting({ live })`); live refuses structural keys (`setting_live_read_only`),
  break-glass needs a reason; setup and sandbox accept all; a user's own preferences are live.
- FR-003 Provenance per key: default, holder, or floor with law and market.
- FR-004 Revisions for every write; four-eyes for `approval` keys; scheduled changes with `applyDue`.
- FR-005 YAML packs: export a holder's own values, diff, apply.
- FR-006 `Promotable` port (export, diff with live content hash, apply refusing a stale base) and the settings driver.
- FR-007 Developer and normal modes (`@Setting({ essential })`, `visibleSettingFields`).
- FR-008 `feature-flags/no-plan-targeting` oxlint rule.

## Open items

- ADR for the plan-targeting rule; registering it in `@stackra/oxlint-config` (another package).
- Refusal code `live_read_only` vs the class-derived `setting_live_read_only` (ADR 0359 OQ5, ADR 0137 amendment).
- Rollback (ADR 0359 d8, proposed) and change-set release ordering (OQ6) not built.
- `stackra settings:diff|apply` CLI commands and runway deploy locks belong to `@stackra/cli` and runway.
