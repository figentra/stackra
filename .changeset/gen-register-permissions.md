---
"@stackra/gen": patch
---

The generated registrations call `registerPermissions` for every `Permission` static (`.system()` and `.restricted()` ones included) and then `registerRoles` for every module role, so a real boot knows which permissions are system-only or restricted and what each module role holds. `Permission.Lx.restricted()` statics are now read into the manifest too.
