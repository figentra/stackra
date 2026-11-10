---
"@stackra/database": patch
"@stackra/settings": patch
"@stackra/storage": patch
"@stackra/identity": patch
---

A service no longer refuses to boot with "its drivers are X, Y, and no config field selects one" for six ports: each now has a config field that picks its driver, with a default. `DatabaseConfig.driver` selects `Database` (`postgres`; `memory` stays the testing driver a test picks with `useDrivers`). The new `SettingsConfig` (key `settings`) holds `store` for `SettingValueStore` and `floors` for `SettingFloorSource`, both `memory`. The new `StorageConfig` (key `storage`) holds `driver` for `Storage` (`memory`; an app still gets `web` or `native` from gen's per-runtime defaults, which come first). `IdentityConfig` gains `sessionStore` for `SessionStore` and `approvalChallenges` for `AppApprovalChallenges`, both `memory`. The ports `Database`, `Storage` and `AppApprovalChallenges` declare their keys, so `DriverName<…>` narrows to their drivers. Production sets `settings.store`, `settings.floors`, `storage.driver` and `identity.approval_challenges` in config to choose its own drivers.
