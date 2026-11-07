# @stackra/tenancy

## 0.19.0

### Patch Changes

- 58e3066: `actingScopeId(actor)` and `claimedScopeIds(actor)` move to `@stackra/contracts`: the one answer to which tenant a call acts
  in (an agent's own `scopeId`, else the tenant of the human it acts for; any other actor's own `scopeId`). Every place
  that read `actor.scopeId` as the call's tenant now reads it: the pipeline's `CallDescriptor.scopeId` and `ctx.scopeId`
  (so rate limits, meters, idempotency, query cache keys, approvals and audit entries follow), the queue's job actor and
  unique key, IAM's node lookup, the automation principal check, the access-log outbox sink's `scopeId` stamp, and
  `PostgresAuditTrailDriver`, which now records an agent with no tenant of its own in its human's tenant instead of
  skipping it. A platform agent and every other actor kind are unchanged.
- e5ac3d0: Agents with no tenant of their own now run in the tenant of the human they act for. An agent actor with no `scopeId`
  (such as a background agent acting for its owner) used to run with `app.tenant_id = ''` and see none of its owner's
  tenant rows; `TenantIsolationService.withTenant` now sets its human's tenant, and `CallIsolationDriver` checks the scope
  and a running transaction's tenant against the same one. What products will see: `@stackra/panel` saved views now show
  that agent the human's tenant's views (it saw none before), and `@stackra/access-log` records of that agent's calls now
  store in the human's tenant (before, they had no tenant and were not stored). An agent with a tenant of its own keeps
  it, one with no tenant anywhere stays a platform call, and every other actor kind keeps its own `scopeId`.
- d2b3d22: A column can default to a transaction setting: `.defaultSetting("app.x")` writes
  `default nullif(current_setting('app.x', true), '')`, so a writer that names no value stores the call's setting and
  rows that predate the column stay null (refused on a `uuid` column for now). `t.belongsToTenant({ expand: true })` uses
  it for the expand step of an existing table: a nullable, indexed `tenant_id` filled from `app.tenant_id`, and no
  policy, so the table keeps the one it has until the contract step makes the tenant equality its one permissive policy
  (ADR 0347 decision 1; tenancy audit 2026-11-07, gap D).
- eafb209: `CallIsolationDriver` refuses an agent actor with a tenant (its own `scopeId`, or else that of the human it acts for)
  whose scope the tree does not show at that path, whose granted scopes are all unknown, or whose scope sits above every
  tenant (`tenant_scope_mismatch`), before any transaction or setting, the same as a tenant user. It used to run such a
  call in the agent's own tenant. An agent that carries only its human's tenant is now also refused in another tenant's
  scope. An agent with no tenant (acting for a platform user) stays a platform call; service actors are unchanged.
- d22e767: `CallIsolationDriver` refuses several granted scopes that span tenants with `tenant_scope_mismatch`. They are one
  session, so paths in two tenants (or in a tenant and above every tenant) read both through the ancestor policies.
  Several scopes that all resolve alike now follow the single-scope rules of the first: a job or system call takes
  their tenant, and a user is held to its own.
- e283a31: `CallIsolationDriver` refuses a user actor that claims a tenant but calls in a scope the tree shows above every
  tenant (the platform root, a product), with `tenant_scope_mismatch`, before the isolation transaction opens. Such a
  call kept its own `app.tenant_id` while its scope paths covered every tenant's ancestor-RLS rows. A platform user (no
  `scopeId`) in that scope stays a platform call, and job, system and agent actors keep their rules.
- 27f2b3f: `CallIsolationDriver` refuses a user with a tenant whose scope the scope tree does not show at that path
  (`tenant_scope_mismatch`), also when several granted scopes are all unknown. It used to run such a call in the user's own
  tenant, so a forged reference above the tenant (its own id with the path `platform`) set `app.scope_paths` over more
  than the tenant. A platform user (no `scopeId`) stays a platform call; job and system actors keep their
  `tenant_scope_unresolved` refusal. `asTenant` now shows each scope option in its tree as the tenant's own node or a
  branch under it, so a scoped `asTenant` call keeps running.
- 15d8a1b: A nested `TenantIsolationService.withTenant` flushes its own writes before it puts the enclosing tenant back. The ORM
  writes a savepoint's pending changes only after its callback returns, so they used to be checked by row security and
  read `app.tenant_id` as the enclosing tenant, which refused or misplaced a row the nested call created.
- bc5a0ab: `TenantIsolationService.withTenant` puts the enclosing tenant back when it runs inside a running transaction. A
  released savepoint keeps a `set_config(…, true)` until the outer transaction ends, so a nested call used to leave
  `app.tenant_id` on the inner tenant for the rest of the caller's transaction while `ACTIVE_TENANT` had reverted.
- Updated dependencies [58e3066]
- Updated dependencies [58a8fa5]
- Updated dependencies [b59aa22]
- Updated dependencies [bac874e]
- Updated dependencies [12f25aa]
- Updated dependencies [e5f5432]
- Updated dependencies [40fda23]
- Updated dependencies [0da5f7a]
- Updated dependencies [0921f1f]
- Updated dependencies [dd9427a]
- Updated dependencies [4a23af8]
- Updated dependencies [fc845f4]
- Updated dependencies [0e0de4f]
- Updated dependencies [0e0de4f]
- Updated dependencies [d2b3d22]
  - @stackra/contracts@0.19.0
  - @stackra/actions@0.19.0
  - @stackra/database@0.19.0
  - @stackra/model@0.19.0
  - @stackra/ui@0.19.0
  - @stackra/console@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/scheduler@0.19.0
  - @stackra/scope@0.19.0

## 0.18.1

### Patch Changes

- @stackra/scheduler@0.18.1
  - @stackra/actions@0.18.1
  - @stackra/database@0.18.1
  - @stackra/model@0.18.1
  - @stackra/ui@0.18.1
  - @stackra/console@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/validation@0.18.1
  - @stackra/scope@0.18.1

## 0.18.0

### Patch Changes

- @stackra/scheduler@0.18.0
  - @stackra/actions@0.18.0
  - @stackra/database@0.18.0
  - @stackra/model@0.18.0
  - @stackra/ui@0.18.0
  - @stackra/console@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/validation@0.18.0
  - @stackra/scope@0.18.0

## 0.17.2

### Patch Changes

- @stackra/scheduler@0.17.2
  - @stackra/actions@0.17.2
  - @stackra/database@0.17.2
  - @stackra/model@0.17.2
  - @stackra/ui@0.17.2
  - @stackra/console@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/validation@0.17.2
  - @stackra/scope@0.17.2

## 0.17.1

### Patch Changes

- @stackra/actions@0.17.1
  - @stackra/database@0.17.1
  - @stackra/model@0.17.1
  - @stackra/ui@0.17.1
  - @stackra/console@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/validation@0.17.1
  - @stackra/scheduler@0.17.1
  - @stackra/scope@0.17.1

## 0.17.0

### Patch Changes

- @stackra/actions@0.17.0
  - @stackra/database@0.17.0
  - @stackra/model@0.17.0
  - @stackra/ui@0.17.0
  - @stackra/console@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/validation@0.17.0
  - @stackra/scheduler@0.17.0
  - @stackra/scope@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/scheduler@0.16.0
  - @stackra/actions@0.16.0
  - @stackra/database@0.16.0
  - @stackra/model@0.16.0
  - @stackra/ui@0.16.0
  - @stackra/console@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/scope@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- @stackra/scope@0.15.0
  - @stackra/actions@0.15.0
  - @stackra/database@0.15.0
  - @stackra/model@0.15.0
  - @stackra/ui@0.15.0
  - @stackra/console@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/validation@0.15.0
  - @stackra/scheduler@0.15.0

## 0.14.4

### Patch Changes

- @stackra/actions@0.14.4
  - @stackra/database@0.14.4
  - @stackra/model@0.14.4
  - @stackra/ui@0.14.4
  - @stackra/console@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/validation@0.14.4
  - @stackra/scheduler@0.14.4
  - @stackra/scope@0.14.4

## 0.14.3

### Patch Changes

- @stackra/actions@0.14.3
  - @stackra/database@0.14.3
  - @stackra/model@0.14.3
  - @stackra/ui@0.14.3
  - @stackra/console@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/validation@0.14.3
  - @stackra/scheduler@0.14.3
  - @stackra/scope@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/actions@0.14.2
  - @stackra/database@0.14.2
  - @stackra/model@0.14.2
  - @stackra/ui@0.14.2
  - @stackra/console@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/scheduler@0.14.2
  - @stackra/scope@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/actions@0.14.1
  - @stackra/database@0.14.1
  - @stackra/model@0.14.1
  - @stackra/ui@0.14.1
  - @stackra/console@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/validation@0.14.1
  - @stackra/scheduler@0.14.1
  - @stackra/scope@0.14.1

## 0.14.0

### Patch Changes

- @stackra/actions@0.14.0
  - @stackra/database@0.14.0
  - @stackra/model@0.14.0
  - @stackra/ui@0.14.0
  - @stackra/console@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/validation@0.14.0
  - @stackra/scheduler@0.14.0
  - @stackra/scope@0.14.0

## 0.13.0

### Patch Changes

- @stackra/actions@0.13.0
  - @stackra/database@0.13.0
  - @stackra/model@0.13.0
  - @stackra/ui@0.13.0
  - @stackra/console@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/validation@0.13.0
  - @stackra/scheduler@0.13.0
  - @stackra/scope@0.13.0

## 0.12.0

### Patch Changes

- @stackra/actions@0.12.0
  - @stackra/database@0.12.0
  - @stackra/model@0.12.0
  - @stackra/ui@0.12.0
  - @stackra/console@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/validation@0.12.0
  - @stackra/scheduler@0.12.0
  - @stackra/scope@0.12.0

## 0.11.1

### Patch Changes

- @stackra/actions@0.11.1
  - @stackra/database@0.11.1
  - @stackra/model@0.11.1
  - @stackra/ui@0.11.1
  - @stackra/console@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/validation@0.11.1
  - @stackra/scheduler@0.11.1
  - @stackra/scope@0.11.1

## 0.11.0

### Patch Changes

- @stackra/actions@0.11.0
  - @stackra/database@0.11.0
  - @stackra/model@0.11.0
  - @stackra/ui@0.11.0
  - @stackra/console@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/validation@0.11.0
  - @stackra/scheduler@0.11.0
  - @stackra/scope@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
- Updated dependencies [aea9b1d]
  - @stackra/contracts@0.10.0
  - @stackra/database@0.10.0
  - @stackra/scheduler@0.10.0
  - @stackra/actions@0.10.0
  - @stackra/ui@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/scope@0.10.0
  - @stackra/model@0.10.0
  - @stackra/console@0.10.0
  - @stackra/container@0.10.0
  - @stackra/validation@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [be4a198]
- Updated dependencies [9bb5d55]
- Updated dependencies [e80a99b]
- Updated dependencies [2e43c48]
- Updated dependencies [b174a17]
- Updated dependencies [681d01a]
- Updated dependencies [f9c825d]
  - @stackra/console@0.9.0
  - @stackra/validation@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/model@0.9.0
  - @stackra/ui@0.9.0
  - @stackra/container@0.9.0
  - @stackra/scheduler@0.9.0
  - @stackra/database@0.9.0
  - @stackra/actions@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/scope@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [928dcc0]
- Updated dependencies [7dd35b3]
  - @stackra/database@0.8.0
  - @stackra/container@0.8.0
  - @stackra/scheduler@0.8.0
  - @stackra/scope@0.8.0
  - @stackra/actions@0.8.0
  - @stackra/model@0.8.0
  - @stackra/ui@0.8.0
  - @stackra/console@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/scheduler@0.7.1
  - @stackra/actions@0.7.1
  - @stackra/database@0.7.1
  - @stackra/model@0.7.1
  - @stackra/ui@0.7.1
  - @stackra/console@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/validation@0.7.1
  - @stackra/scope@0.7.1

## 0.7.0

### Minor Changes

- 1f5bf76: Four more tenancy kit blocks in `@stackra/tenancy/react`: `TenantPicker` (choose an organisation, by default from the
  signed-in person's memberships), `MemberPicker` (choose a member, from the host's search), `OrganizationPage` (read and
  save the organisation's profile, list its legal entities and domains) and `MembersPage` (list members, change a role,
  remove a member, invite, and list and revoke invitations, with the host's words for the last-owner and external-role
  refusals). The pages talk to the server through two new client ports in the new `@stackra/tenancy/contracts` entry,
  `TenantProfile` and `TenantMembers`, with memory drivers in `./testing`; the root entry adds the `LastOwnerRefusedError`
  and `ExternalRoleNotAllowedError` refusals. Every word comes from the host in `labels`. The showcase lists the four
  under Blocks.

### Patch Changes

- @stackra/actions@0.7.0
  - @stackra/database@0.7.0
  - @stackra/model@0.7.0
  - @stackra/ui@0.7.0
  - @stackra/console@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/validation@0.7.0
  - @stackra/scheduler@0.7.0
  - @stackra/scope@0.7.0

## 0.6.1

### Patch Changes

- @stackra/actions@0.6.1
  - @stackra/database@0.6.1
  - @stackra/model@0.6.1
  - @stackra/ui@0.6.1
  - @stackra/console@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/validation@0.6.1
  - @stackra/scheduler@0.6.1
  - @stackra/scope@0.6.1

## 0.6.0

### Minor Changes

- c64a55d: `TenantMenu`, the tenancy kit's membership switcher (ADR 0504), in `@stackra/tenancy/react` (a menu behind a
  button) and in the new `@stackra/tenancy/native` entry (a list for the app's own sheet). It reads the container's
  `TenantSwitcher` through `useTenant` and `useTenantSwitcher`, takes every word from the host in `labels`, and reports
  `onSwitched` (and `onError` on native).

### Patch Changes

- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [2256bf6]
- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [fb29d41]
- Updated dependencies [4fcb66d]
- Updated dependencies [d53d9d3]
- Updated dependencies [712fb89]
  - @stackra/console@0.6.0
  - @stackra/database@0.6.0
  - @stackra/ui@0.6.0
  - @stackra/scheduler@0.6.0
  - @stackra/scope@0.6.0
  - @stackra/actions@0.6.0
  - @stackra/model@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [4fa949b]
  - @stackra/database@0.5.1
  - @stackra/scheduler@0.5.1
  - @stackra/scope@0.5.1
  - @stackra/actions@0.5.1
  - @stackra/model@0.5.1
  - @stackra/console@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- 104d9f4: `@stackra/tenancy/node` exports `TENANCY_ENTITIES`, the committed entity list of its `ApprovalBinding` model, which a
  hosting service's generated registrations import (STA-1874).
- @stackra/actions@0.5.0
  - @stackra/database@0.5.0
  - @stackra/model@0.5.0
  - @stackra/console@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/validation@0.5.0
  - @stackra/scheduler@0.5.0
  - @stackra/scope@0.5.0

## 0.4.0

### Minor Changes

- 9c8d108: Packages contribute console commands, and gen collects them per member (STA-1731). `@stackra/console` audits a
  command declared `audit: true` through the `CommandAudit` port (refused before it runs when no sink is ready; secret
  values redacted). gen records commands in the manifest, merges hosted packages' commands, refuses
  `command_collision`, and writes `#stackra/commands` and a console entry that `stackra console <member>` runs. First
  commands: `db:migrate`, `db:rollback`, `db:status`, `db:seed`, `tenant:list`, `tenant:create` (with a
  `TenantDirectory` port), `cache:clear` (the `Cache` port gains `flush`), `queue:work`, `queue:failed` and
  `queue:retry`; `@stackra/access-log` stores command audit entries (`STACKRA_COMMAND_AUDIT_SCOPE`).
- dedaa81: Add the approval binding store for the approval stage (STA-1724, ADR 0509): the `ApprovalBinding` model and its first
  migration (`tenancy.approval_bindings`, `BelongsToTenant` with the forced tenant policy, insert-only with UPDATE revoked),
  `PostgresApprovalBindingStoreDriver` (insert, read by approval id, prune; no update) behind `@stackra/actions`'
  `ApprovalBindingStore` port, and `PruneApprovalBindingsAction`, the daily job that deletes a binding 24 hours plus `AUDIT_HOT_RETENTION` (397 days)
  after its `expiresAt`. The prune takes `PruneApprovalBindingsInput` and returns `PruneApprovalBindingsOutput` (`deleted`), so tenancy
  depends on `@stackra/validation` and `zod` (STA-1884).

### Patch Changes

- 1856ee0: Add `ApprovalBindingPermissions` with `prune = Permission.L4.system()` (`tenancy.approval_binding.prune`), which clears
  gen's `permission_unknown` for `PruneApprovalBindingsAction` (STA-1890, ADR 0513).
- a7eaed4: `CallIsolationDriver` takes the `ScopeTree` and resolves `app.tenant_id` from the call's scope for `job` and `system`
  actors (STA-1823, ADR 0495 note of 2026-11-01): the tenant is `tenantOf(tree, scope)`, a branch resolves to its parent
  tenant, and a scope the tree does not show is refused with the new `TenantScopeUnresolvedError`
  (`tenant_scope_unresolved`) instead of running with an empty tenant. Any other actor keeps its own `scopeId` and a scope
  of another tenant is refused with the new `TenantScopeMismatchError` (`tenant_scope_mismatch`). The constructor gains a
  third `ScopeTree` argument; `asTenant` supplies an empty tree and runs a platform call as a staff user.
- Updated dependencies [71b37fc]
- Updated dependencies [7a94bc4]
- Updated dependencies [a7eaed4]
- Updated dependencies [a8c358a]
- Updated dependencies [0b660e0]
- Updated dependencies [0b660e0]
- Updated dependencies [3ce01cf]
- Updated dependencies [9c8d108]
- Updated dependencies [3c30885]
- Updated dependencies [ef987d9]
- Updated dependencies [a8c358a]
- Updated dependencies [c9cf778]
- Updated dependencies [1856ee0]
- Updated dependencies [ca7d004]
- Updated dependencies [eccdaf0]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [4f3f1ed]
- Updated dependencies [e070131]
- Updated dependencies [d675b4d]
- Updated dependencies [3df2c07]
- Updated dependencies [2d6bb63]
- Updated dependencies [7dc74f6]
- Updated dependencies [d9bf3c2]
- Updated dependencies [90f55b1]
- Updated dependencies [1c22c33]
- Updated dependencies [688cf0c]
- Updated dependencies [ff56870]
- Updated dependencies [e219411]
- Updated dependencies [5fc0db7]
- Updated dependencies [36dbd49]
- Updated dependencies [2bbc0e8]
  - @stackra/actions@0.4.0
  - @stackra/validation@0.4.0
  - @stackra/scope@0.4.0
  - @stackra/console@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/database@0.4.0
  - @stackra/container@0.4.0
  - @stackra/model@0.4.0
  - @stackra/scheduler@0.4.0
  - @stackra/errors@0.4.0

## 0.3.0

### Minor Changes

- a60f4e9: Add `CallIsolationDriver` to `./node` (STA-1699, ADR 0495): the `CallIsolation` of the action pipeline and of every
  background unit, which sets the scope and the tenant settings transaction-locally in one transaction, read-only for a
  query. Add `asTenant(tenantId, work)` to `./testing`, which runs the real isolation on the current database, and the
  `test:int` tier with real-Postgres isolation tests under a role without `BYPASSRLS`.

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- Updated dependencies [a60f4e9]
- Updated dependencies [c4443b5]
- Updated dependencies [b00096a]
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [23e556c]
- Updated dependencies [be75ede]
- Updated dependencies [f05c8e5]
  - @stackra/actions@0.3.0
  - @stackra/database@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/model@0.3.0
  - @stackra/scheduler@0.3.0
  - @stackra/scope@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [cfdcdf8]
- Updated dependencies [2d5a888]
- Updated dependencies [1a9259b]
- Updated dependencies [9085c41]
  - @stackra/actions@0.2.0
  - @stackra/database@0.2.0
  - @stackra/errors@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/scheduler@0.2.0
  - @stackra/scope@0.2.0
  - @stackra/model@0.2.0
  - @stackra/container@0.2.0

## 0.1.0

### Minor Changes

- 37e1aa8: Round C. gen: lazy catalogue loaders and `loadMessages(locale)` in the generated I18n (only runtime dependencies bring
  lang); event wire names stay `<module>.<name>.v<n>` and a prefixed name is refused (`event_name_prefixed`); a service
  subscribes its own topics into its inbox for local listeners; the coverage-audit refusals (`checkConventions` and
  friends). i18n: `loadMessages` with the ar-SA, ar, en fallback chain. Packages that ship `assets/lang` export
  `./assets/*`. tenancy: `belongsToTenant({ nullable: true })` compiles through `equalsOrUnset`. workflow: `ServiceAcked`
  carries `KeptRecords` (migration 0008). identity: app-approval sign-in and step-up with number matching and QR.
  filesystem: `readStream` on every disk. content: custom fields per runtime subtype (migration 0004); `ContentModule`
  exports `RevisionService`. actions: `RateLimitBudget` port sizes the area bucket. licensing: `LicenceIssuer` port with
  Keygen and memory drivers, install key signer and signed usage reports.
- f746759: Row-level security conformance (stackra-258). `@stackra/database/testing` adds `assertRowSecurity` (every table
  holding the owner column has forced row-level security and its `pol_<table>_<column>` policy, the service role does
  not bypass it, and a rolled-back two-owner probe sees and moves nothing) and `usePostgres({ migrationsDirectory })`.
  `@stackra/tenancy/testing` adds `tenantIsolationOptions()`. Gen refuses a service model that is neither owned nor
  `Model.global` (`model_tenancy_missing`), records `global` on manifest models, and writes
  `.stackra/tests/tenant-isolation.int.test.ts` for a service with owned models.
- f7a2d36: Add `BelongsToTenantOrPlatform` and `t.belongsToTenant({ nullable: true })` (a `NULL` tenant is the platform's, under an
  `equalsOrUnset` policy), `TenantTokenService` over the `TenantTokens` port (opaque `ttk_` tokens stored by SHA-256,
  resolved per purpose, for anonymous calls such as iCal feeds), the `TenantBillingContacts` port with its memory driver,
  and a new `./testing` entry with `fakeTenantId`, `tenantActor` and `runAsTenant`.
- 2787c1e: Add `@stackra/tenancy`: tenant isolation in Postgres (`BelongsToTenant`, the `t.belongsToTenant()` macro with its
  equality policy on `tenant_id`, and `TenantIsolationService.withTenant` in `./node`), the tenant level as scope data
  with the tenancy step of the resolver chain, the scheduler's per-tenant `TenancyCronScopesDriver`, and the client's `TenantSwitcher` with `useTenant` and `useTenantSwitcher`.
- a45c902: Add sandbox tenants (`TenantEnvironment`, `SandboxTenantService`, the `SandboxTenants` port and its memory driver; a
  membership may carry `environment`) and consented cross-tenant shares from ADR 0343 (`TenantShareService` with
  propose, accept, decline, revoke, `flows` and cross-region `release` under the `TransferCheck` port, `revocationPlan`,
  the `TenantShares` port and its memory driver, and the `ShareTransitionInvalidError`, `TransferRefusedError` and
  `SandboxNotFoundError` refusals).
- 2c0ea71: Placement (stackra-310). `@stackra/database` adds the `ConnectionResolver` port and `PRIMARY_CONNECTION`
  (`./contracts`), the free one-pool `PrimaryConnectionResolverDriver` (`./node`) and `DatabaseConfig.region`, the runway
  region key of the deployment. `@stackra/tenancy` adds the placement map: the `Placement` type (a tenant's `region` and
  `cell`), the `TenantPlacement` port with `MemoryTenantPlacementDriver`, `tenantOf`, `RegionGuardDriver` (a
  `TenancyCheck` that refuses `region_mismatch` with `RegionMismatchError` when a call's tenant is placed in another
  region, and fails closed without a placement or a region key) and `TenantPlacementConnectionResolverDriver`, which names
  the tenant's cell.

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [f81699d]
- Updated dependencies [f7fb4ad]
- Updated dependencies [e7a388a]
- Updated dependencies [68dd2a5]
- Updated dependencies [e0f2fc8]
- Updated dependencies [2787c1e]
- Updated dependencies [df3f38b]
- Updated dependencies [4413118]
- Updated dependencies [a6ec591]
- Updated dependencies [38fb3e2]
- Updated dependencies [bc4acfc]
- Updated dependencies [99665bb]
- Updated dependencies [8ead1a8]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [94ae85f]
- Updated dependencies [dddbbcd]
- Updated dependencies [856995c]
- Updated dependencies [e7ee0a4]
- Updated dependencies [ca85d59]
- Updated dependencies [d72a734]
- Updated dependencies [9841d79]
- Updated dependencies [f6d1a76]
- Updated dependencies [c196bc6]
- Updated dependencies [49ab0e6]
- Updated dependencies [d156aa8]
- Updated dependencies [6d46e5e]
- Updated dependencies [2787c1e]
- Updated dependencies [38a5501]
- Updated dependencies [e0f2fc8]
- Updated dependencies [62c7ae1]
- Updated dependencies [c868bad]
- Updated dependencies [0d36f0d]
- Updated dependencies [a701ccb]
- Updated dependencies [a526605]
- Updated dependencies [da8bdbd]
- Updated dependencies [763e901]
- Updated dependencies [936fcb1]
- Updated dependencies [f11cbe8]
- Updated dependencies [f7a2d36]
- Updated dependencies [6bb8ea8]
- Updated dependencies [e45cd73]
- Updated dependencies [6006b78]
- Updated dependencies [483eb44]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [6f2c1f7]
- Updated dependencies [3d080e7]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [d5e5ff8]
- Updated dependencies [9841d79]
- Updated dependencies [d156aa8]
- Updated dependencies [2787c1e]
- Updated dependencies [c580aa4]
- Updated dependencies [7e60fa9]
- Updated dependencies [b62c042]
- Updated dependencies [e52a367]
- Updated dependencies [914465a]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [9fc14fd]
- Updated dependencies [0a20a9f]
- Updated dependencies [d5f5acf]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [ae9621e]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [fbaaba0]
- Updated dependencies [22ffbbf]
- Updated dependencies [2787c1e]
- Updated dependencies [376a093]
- Updated dependencies [93fa8f1]
- Updated dependencies [89548ea]
- Updated dependencies [2787c1e]
- Updated dependencies [a31d463]
- Updated dependencies [158f6cf]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [e756399]
- Updated dependencies [c3ff8a7]
- Updated dependencies [3e2fc84]
- Updated dependencies [5e8114b]
- Updated dependencies [2c0ea71]
- Updated dependencies [ab9cc36]
- Updated dependencies [f04fec9]
- Updated dependencies [8a1be69]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/database@0.1.0
  - @stackra/model@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/scheduler@0.1.0
  - @stackra/scope@0.1.0

Written by Changesets on release; never edited by hand.
