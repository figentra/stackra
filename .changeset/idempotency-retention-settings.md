---
"@stackra/settings": minor
---

Two new platform-scope settings groups with their source drivers. `IdempotencySettings` (`idempotency.retentionHours`,
1 to 24, default 24, the cap of ADR 0136) is served by `SettingsIdempotencyRetentionSourceDriver`; `VersioningSettings`
(`versioning.supportMonths`, at least 1, default 12) is served by `SettingsVersionSupportSourceDriver`.
