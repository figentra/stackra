# Plan: settings resolver, revisions, packs, Promotable; feature-flags lint

**Spec**: `.agents/specs/sta-348-ext-settings-config/spec.md`

## Design

- `./contracts`: ports `SettingFloorSource`, `SettingRevisionStore`, `Promotable`; enums `SettingEnvironment`,
  `SettingRevisionStatus`, `SettingSource`; types `SettingFloor`, `SettingRevision`, `SettingsPack`, `PromotionDiff`.
  `SettingLayer.holder` (optional) and `SettingValueStore#remove` added.
- `.`: `SettingsResolver(store, floors, revisions, clock)`: `get`, `resolve`, `write`, `applyChange`, `approve`,
  `reject`, `applyDue`, `history`. `SettingsPackService(store, resolver)`: `exportPack`, `applyPack`, `applyChanges`.
  `SettingsPromotableDriver(packs)`. Memory floor and revision drivers. `settingFloorsOf`, `diffSettingsPacks`, YAML
  helpers, `visibleSettingFields`, `SettingsMode`, five refusals, `SettingsPack$`, `SettingsChange$`.
- `./node`: `StoredSettingRevision` (`ssr`), migration 0002, `StoredSettingRevisionService`,
  `PostgresSettingRevisionStoreDriver`; value driver gains `holder` and `remove` (`StoredSettingService#drop`).
- `@stackra/feature-flags/lint`: `FEATURE_FLAGS_LINT_PLUGIN` with `no-plan-targeting`.

## Constitution Check

| Law                       | Result | Note                                                            |
| ------------------------- | ------ | --------------------------------------------------------------- |
| Boundaries (ADR 0003)     | PASS   | `tier:lib` imports `tier:lib` only                              |
| Configuration over code   | PASS   | floors from market packs; live/essential/floor declared per key |
| Versions and catalogs     | PASS   | `catalog:` and `workspace:*`                                    |
| Test placement (ADR 0022) | PASS   | `src/**/__tests__/`                                             |
