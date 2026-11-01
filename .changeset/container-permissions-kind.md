---
"@stackra/container": minor
---

Add the `Permissions` kind base, `registerPermissions`, `permissionKey`, `PERMISSION_REGISTRY` and the
`PermissionRegistration` type, moved from `@stackra/iam` (STA-1890, ADR 0513), so a module can declare permissions
without depending on iam.
