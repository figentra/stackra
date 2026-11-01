---
"@stackra/iam": patch
---

`Risk`, `Permission`, `Permissions`, `registerPermissions`, `permissionKey` and `PermissionRegistration` now come from
`@stackra/contracts` and `@stackra/container` and are re-exported from `@stackra/iam`, so every import keeps working and
one registry is shared (STA-1890, ADR 0513). Evaluation, roles and the snapshot code stay in iam.
