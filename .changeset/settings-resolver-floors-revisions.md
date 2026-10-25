---
"@stackra/settings": minor
---

Add the settings-layer resolver: `SettingsResolver` reads a group with the legal floors of the target's market pack
(`SettingFloorSource`, `settingFloorsOf` over `@stackra/market-packs`), refuses a write below a floor and lifts a value
when a floor rises, gives each key its provenance, refuses structural keys on live (`@Setting({ live })`, break-glass
with a reason), and records every write as a revision with four-eyes approval and schedules (`SettingRevisionStore`,
memory and Postgres drivers, `settings.stored_setting_revisions`). Add YAML settings packs with export, diff and apply
(`SettingsPackService`, `diffSettingsPacks`, `SettingsPack$`), developer and normal display modes
(`@Setting({ essential })`, `visibleSettingFields`), and the `Promotable` port homed here with `SettingsPromotableDriver`.
`SettingValueStore` gains `remove`, and each layer names its `holder`.
