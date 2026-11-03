---
"@stackra/gen": minor
"@stackra/settings": minor
---

Settings fields are never dropped: gen refuses a field no setting type holds with `settings_unsupported_type`, and writes an enum or driver name as a `choice` key and a string or enum array as a `list` key (`SettingType.Choice`, `SettingType.List`, `SettingKeyInput.options`, and `readonly string[]` as a `SettingValue`). Gen derives the group key from the class name as the runtime does (`AccountSettings` is `Settings.account`), refuses `settings_scope_widened`, `settings_too_deep`, `settings_group_key_empty` and `settings_group_conflict`, and records every group and key in a `settings` section of `stackra.manifest.json`; a group or key rename needs `@Renamed`. An enum setting field is now `choice` with its `options`, not `string`, and a group whose key is not its module's carries the group in its label key. Regenerate with `stackra gen`.
