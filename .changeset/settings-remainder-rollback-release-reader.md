---
"@stackra/settings": minor
---

Retire `SettingLiveReadOnlyError`: a write to read-only live configuration is the core `live_read_only` refusal. Add
promotion rollback (`Promotable.rollbackOf`, the replaced snapshot in `PromotionDiff.previous`), a change set's
minimum release (`PromotionReleaseTooOldError`), floor lifting in `SettingsReader#get`, the `settingsDiff` and
`settingsApply` runner with `RegisteredFloorGuardDriver`, and `fakeResolver` in `./testing` (ADR 0395).
