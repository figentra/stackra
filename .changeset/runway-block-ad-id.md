---
"@stackra/runway": minor
---

`capabilityConfig` now always lists `com.google.android.gms.permission.AD_ID` in `blockedPermissions`, so a build does
not declare the advertising id that Play Services merges in. An app keeps it only by enabling a template capability
(an ads or attribution flag) whose `android.permissions` lists it (STA-1577).
