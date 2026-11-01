# The permission vocabulary moves to contracts and container

**Linear**: STA-1890
**Status**: implementing
**Clarifications status**: complete

## Problem

`@stackra/tenancy` must declare a `Permissions` class for `tenancy.approval_binding.prune`, or gen refuses
`PruneApprovalBindingsAction` with `permission_unknown`. The vocabulary lives in `@stackra/iam`, and iam depends on
tenancy at runtime (iam, rules, ai, tenancy), so tenancy cannot import it without a package cycle. ADR 0513 (owner
decision of 2026-11-01) moves the vocabulary below iam.

## Change

1. `Risk` and `Permission` move to `@stackra/contracts` (`enums/`, `values/`); the README table gains two rows.
2. The `Permissions` kind base, `registerPermissions`, `permissionKey`, `PERMISSION_REGISTRY` and the
   `PermissionRegistration` type move to `@stackra/container`, with their tests.
3. `@stackra/iam` re-exports every moved public name from the new homes (one registry, no copies), imports the rest
   from them, and keeps `coversPermission`, `selectsPermission`, the snapshot code and `registerRoles`.
4. gen's `emit-registrations` imports `registerPermissions` from `@stackra/container`.
5. tenancy declares `ApprovalBindingPermissions` with `prune = Permission.L4.system()`: an irreversible delete of audit
   evidence, never grantable to tenant roles.

## Acceptance

- `stackra gen` writes `@stackra/tenancy` with no refusal.
- Iam's re-exports are the same objects as the contracts and container exports (a test).
- A member declaring permissions but no roles gets no `@stackra/iam` import in its generated entry (a test).

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: @stackra/contracts, @stackra/container, @stackra/iam, @stackra/gen, @stackra/tenancy
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no; it implements ADR 0513
- **New dependencies**: none
- **Deploy modes**: none
- **Licence tier**: free
- **Docs to update**: contracts README
- **Lane**: feature
- **Change risk**: R2
