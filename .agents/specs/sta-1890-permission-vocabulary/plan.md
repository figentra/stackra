# Plan: permission vocabulary move (STA-1890)

1. contracts: move `Risk` and `Permission` with their tests; export from the barrel; README rows.
2. container: move the `Permissions` base, `registerPermissions`, `permissionKey`, `PERMISSION_REGISTRY` and
   `PermissionRegistration` with their tests; export from the barrel.
3. iam: re-export from the new homes, repoint internal imports, add the same-object test.
4. gen: `registerPermissions` from `@stackra/container`; update the emit tests.
5. tenancy: `ApprovalBindingPermissions`.
6. Changesets: contracts and container minor; iam, gen, tenancy patch. oxfmt and oxlint; the rest runs in CI.
