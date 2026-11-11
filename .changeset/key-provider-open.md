---
"@stackra/contracts": patch
"@stackra/tenancy": patch
---

A product can ship its own `KeyProvider` driver. `@stackra/tenancy` declared a closed `DriverRegistry` entry for the
port (`"ephemeral" | "kms"`), so a member's generated wiring that also names a product's driver failed with TS2717,
and the shipped `TenantKeysConfig$` refused the name at config parse.

- The `KeyProvider` port has no `~key` brand, and tenancy declares no registry entry for it: the member's generated
  wiring declares the names it has, as for identity's `AppApprovalChallenges`.
- `TenantKeysConfig$.driver` takes any non-empty driver name (default `ephemeral`); the container refuses a name no
  driver has when it resolves the port.
