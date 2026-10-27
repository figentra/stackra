---
"@stackra/gen": minor
---

`stackra gen` writes `#stackra/settings` (`.stackra/gen/settings.ts`): `Settings = settingKeys({...})`, one typed key
per setting field of each settings class (sections flattened), with its type, default, scopes, bounds, nullability,
`@Setting` flags, section, earlier name and label key. New `emitSettings` export. A class extending
`Settings.pick([...])` now compiles an `X$` over the picked keys of the member's own settings classes; a key gen cannot
resolve is refused as `settings_key_unresolved`.
