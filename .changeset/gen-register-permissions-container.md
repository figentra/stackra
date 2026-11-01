---
"@stackra/gen": patch
---

The generated entry imports `registerPermissions` from `@stackra/container`, so a member that declares permissions but no
roles no longer imports `@stackra/iam`; `registerRoles` still comes from iam (STA-1890, ADR 0513).
