# @stackra/iam

## 0.33.1

### Patch Changes

- Updated dependencies [e885a38]
- Updated dependencies [bf2c6ea]
- Updated dependencies [e885a38]
  - @stackra/database@0.33.1
  - @stackra/contracts@0.33.1
  - @stackra/rules@0.33.1
  - @stackra/scope@0.33.1
  - @stackra/actions@0.33.1
  - @stackra/model@0.33.1
  - @stackra/ui@0.33.1
  - @stackra/container@0.33.1
  - @stackra/errors@0.33.1
  - @stackra/validation@0.33.1
  - @stackra/testing@0.33.1

## 0.33.0

### Minor Changes

- 93d63bb: `actors.customer()` and `actors.staff()` from `@stackra/iam/testing` now act in a test tenant by default: the new export `TEST_SCOPE_ID`, a fixed `scp_` id. A call through the pipeline then has a tenant and can write a tenant-owned row. Before, a test actor carried no scope, and `BelongsToTenant` writes failed with "Value for <Model>.tenantId is required" (about 23 os services).
  
  **Check your tests on this bump.** A test that relied on a user actor having no scope now runs inside `TEST_SCOPE_ID`. That includes a root or platform call, a check that a scopeless caller is refused, and an assertion on `actor` that has no `scopeId`. Such a test can flip. Pass `{ scopeId: null }` to keep the old behaviour, or name the scope the test expects.
  
  To use another tenant, pass `actors.staff(id, { scopeId })`. For a platform call at the root, pass `{ scopeId: null }`. Service, job, system and anonymous actors still carry no scope; a service claims a tenant through `onBehalfOf`.

### Patch Changes

- Updated dependencies [54aa1e7]
- Updated dependencies [4937622]
- Updated dependencies [93d63bb]
- Updated dependencies [628b60d]
- Updated dependencies [ad4e5bf]
- Updated dependencies [41a5ff0]
- Updated dependencies [246594d]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
- Updated dependencies [41a5ff0]
- Updated dependencies [22493bf]
  - @stackra/actions@0.33.0
  - @stackra/scope@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/rules@0.33.0
  - @stackra/testing@0.33.0
  - @stackra/model@0.33.0
  - @stackra/database@0.33.0
  - @stackra/ui@0.33.0
  - @stackra/errors@0.33.0
  - @stackra/container@0.33.0
  - @stackra/validation@0.33.0

## 0.32.0

### Patch Changes

- Updated dependencies [2c6be3c]
- Updated dependencies [54db249]
  - @stackra/scope@0.32.0
  - @stackra/ui@0.32.0
  - @stackra/actions@0.32.0
  - @stackra/database@0.32.0
  - @stackra/errors@0.32.0
  - @stackra/rules@0.32.0
  - @stackra/model@0.32.0
  - @stackra/testing@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [298af71]
- Updated dependencies [6473cf1]
- Updated dependencies [7179d1a]
  - @stackra/actions@0.31.0
  - @stackra/database@0.31.0
  - @stackra/ui@0.31.0
  - @stackra/rules@0.31.0
  - @stackra/scope@0.31.0
  - @stackra/model@0.31.0
  - @stackra/testing@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/errors@0.31.0
  - @stackra/validation@0.31.0

## 0.30.0

### Minor Changes

- 17fafdd: A ninth actor kind, `ActorKind.ApiClient` (`api_client`): a tenant's server calling with an API key. An action or query
  declares `public: true` or `public: { scopes, publishable }` to answer one; every other operation refuses it, and so
  does a call without a key. `CallOptions.credential` carries the verified key (id, scopes, publishable, version pin) onto
  the descriptor with `descriptor.public` (the required scopes and whether only exact keys count: L3 and above, approval
  or step-up). iam's `AccessControl` checks an `api_client` call's scopes (`keyCovers`: exact keys, or selectors below
  L3); a publishable key calls a public write only when it opts in.
- a426842: A tenant's deny rules bind an API key's caller: `PolicyDecisionPointService.denied` checks the deny rules of a
  principal's own snapshot (breakable ones too), and `IamAccessControlDriver` runs it for an `api_client` call after its
  scopes pass, in `require` and against the record in `authorize`. A key principal with no published snapshot is refused.

### Patch Changes

- f6a087c: A record policy's method is found by the name of the `Permission` static behind the call's permission
  (`static readonly confirmByCode` → `confirmByCode()`), so a multi-word verb's method runs. `registerPermissions`
  records each key's static name in `PERMISSION_MEMBERS`. For one release the old lookup by the key's last segment
  (`confirm_by_code`) is still tried when the policy has no method of the static's name.
- Updated dependencies [418e195]
- Updated dependencies [6005425]
- Updated dependencies [0394e56]
- Updated dependencies [85cd1b5]
- Updated dependencies [96b5241]
- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [0394e56]
- Updated dependencies [d8d78f0]
- Updated dependencies [7b5a381]
- Updated dependencies [0394e56]
- Updated dependencies [8c17109]
- Updated dependencies [8c17109]
- Updated dependencies [82dccb3]
- Updated dependencies [f6a087c]
- Updated dependencies [ef49e63]
- Updated dependencies [a3a3190]
- Updated dependencies [15dba8d]
- Updated dependencies [d3c8b27]
- Updated dependencies [d3c8b27]
  - @stackra/actions@0.30.0
  - @stackra/ui@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/database@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/container@0.30.0
  - @stackra/rules@0.30.0
  - @stackra/scope@0.30.0
  - @stackra/model@0.30.0
  - @stackra/validation@0.30.0
  - @stackra/testing@0.30.0

## 0.29.0

### Patch Changes

- Updated dependencies [3361957]
- Updated dependencies [b4b6422]
- Updated dependencies [09b2c41]
- Updated dependencies [8ad5f87]
- Updated dependencies [11a19a7]
- Updated dependencies [45afd22]
  - @stackra/actions@0.29.0
  - @stackra/container@0.29.0
  - @stackra/database@0.29.0
  - @stackra/scope@0.29.0
  - @stackra/rules@0.29.0
  - @stackra/model@0.29.0
  - @stackra/ui@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/testing@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [2b6f88c]
  - @stackra/actions@0.28.0
  - @stackra/rules@0.28.0
  - @stackra/database@0.28.0
  - @stackra/scope@0.28.0
  - @stackra/model@0.28.0
  - @stackra/ui@0.28.0
  - @stackra/testing@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Patch Changes

- Updated dependencies [4a4d817]
  - @stackra/database@0.27.0
  - @stackra/rules@0.27.0
  - @stackra/scope@0.27.0
  - @stackra/actions@0.27.0
  - @stackra/model@0.27.0
  - @stackra/ui@0.27.0
  - @stackra/testing@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Patch Changes

- 9cee75d: The memory `AccessControl` runs record policies: `ctx.authorize(record)` asks the record's policy, as
  `IamAccessControlDriver` does, once `@stackra/iam`'s testing plugin has connected them through the new
  `connectRecordPolicies`. A module's "refuses another customer" test now means it on memory drivers. The IAM driver's
  policy helpers move into `decidePolicy`, `policyRowOf` and `isAnonymousCall`, shared by the driver and the plugin.
- Updated dependencies [93e358e]
- Updated dependencies [9cee75d]
- Updated dependencies [a9f21b6]
- Updated dependencies [e5da198]
  - @stackra/database@0.26.0
  - @stackra/actions@0.26.0
  - @stackra/ui@0.26.0
  - @stackra/rules@0.26.0
  - @stackra/scope@0.26.0
  - @stackra/model@0.26.0
  - @stackra/testing@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/errors@0.26.0
  - @stackra/validation@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [1d7bbc1]
- Updated dependencies [dc9da69]
- Updated dependencies [8f8ddcf]
- Updated dependencies [3942ab1]
  - @stackra/database@0.25.0
  - @stackra/rules@0.25.0
  - @stackra/scope@0.25.0
  - @stackra/actions@0.25.0
  - @stackra/model@0.25.0
  - @stackra/ui@0.25.0
  - @stackra/testing@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/errors@0.25.0
  - @stackra/validation@0.25.0

## 0.24.0

### Patch Changes

- Updated dependencies [35959f6]
- Updated dependencies [f86dec4]
- Updated dependencies [2df7162]
- Updated dependencies [2df7162]
  - @stackra/actions@0.24.0
  - @stackra/database@0.24.0
  - @stackra/rules@0.24.0
  - @stackra/scope@0.24.0
  - @stackra/model@0.24.0
  - @stackra/ui@0.24.0
  - @stackra/testing@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/errors@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [12f4836]
- Updated dependencies [82238da]
- Updated dependencies [6edeee4]
- Updated dependencies [a2c8821]
- Updated dependencies [a42a80c]
- Updated dependencies [12f4836]
- Updated dependencies [dee48f0]
  - @stackra/database@0.23.0
  - @stackra/ui@0.23.0
  - @stackra/actions@0.23.0
  - @stackra/rules@0.23.0
  - @stackra/scope@0.23.0
  - @stackra/model@0.23.0
  - @stackra/testing@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/errors@0.23.0
  - @stackra/validation@0.23.0

## 0.22.0

### Patch Changes

- Updated dependencies [b394912]
- Updated dependencies [786848c]
  - @stackra/database@0.22.0
  - @stackra/actions@0.22.0
  - @stackra/rules@0.22.0
  - @stackra/scope@0.22.0
  - @stackra/model@0.22.0
  - @stackra/ui@0.22.0
  - @stackra/testing@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/errors@0.22.0
  - @stackra/validation@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0
  - @stackra/validation@0.21.0
  - @stackra/model@0.21.0
  - @stackra/database@0.21.0
  - @stackra/rules@0.21.0
  - @stackra/actions@0.21.0
  - @stackra/ui@0.21.0
  - @stackra/container@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/scope@0.21.0
  - @stackra/testing@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [667a3b5]
- Updated dependencies [80d121b]
- Updated dependencies [a7b7e58]
- Updated dependencies [19a9222]
- Updated dependencies [667a3b5]
  - @stackra/actions@0.20.0
  - @stackra/database@0.20.0
  - @stackra/container@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/rules@0.20.0
  - @stackra/scope@0.20.0
  - @stackra/model@0.20.0
  - @stackra/ui@0.20.0
  - @stackra/errors@0.20.0
  - @stackra/testing@0.20.0
  - @stackra/contracts@0.20.0

## 0.19.0

### Patch Changes

- 58e3066: `actingScopeId(actor)` and `claimedScopeIds(actor)` move to `@stackra/contracts`: the one answer to which tenant a call acts
  in (an agent's own `scopeId`, else the tenant of the human it acts for; any other actor's own `scopeId`). Every place
  that read `actor.scopeId` as the call's tenant now reads it: the pipeline's `CallDescriptor.scopeId` and `ctx.scopeId`
  (so rate limits, meters, idempotency, query cache keys, approvals and audit entries follow), the queue's job actor and
  unique key, IAM's node lookup, the automation principal check, the access-log outbox sink's `scopeId` stamp, and
  `PostgresAuditTrailDriver`, which now records an agent with no tenant of its own in its human's tenant instead of
  skipping it. A platform agent and every other actor kind are unchanged.
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
- Updated dependencies [d76d1ed]
- Updated dependencies [d2b3d22]
- Updated dependencies [6ec440d]
  - @stackra/contracts@0.19.0
  - @stackra/actions@0.19.0
  - @stackra/database@0.19.0
  - @stackra/rules@0.19.0
  - @stackra/model@0.19.0
  - @stackra/ui@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/scope@0.19.0
  - @stackra/testing@0.19.0

## 0.18.1

### Patch Changes

- @stackra/rules@0.18.1
  - @stackra/actions@0.18.1
  - @stackra/database@0.18.1
  - @stackra/model@0.18.1
  - @stackra/ui@0.18.1
  - @stackra/testing@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/validation@0.18.1
  - @stackra/scope@0.18.1

## 0.18.0

### Patch Changes

- @stackra/rules@0.18.0
  - @stackra/actions@0.18.0
  - @stackra/database@0.18.0
  - @stackra/model@0.18.0
  - @stackra/ui@0.18.0
  - @stackra/testing@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/validation@0.18.0
  - @stackra/scope@0.18.0

## 0.17.2

### Patch Changes

- @stackra/rules@0.17.2
  - @stackra/actions@0.17.2
  - @stackra/database@0.17.2
  - @stackra/model@0.17.2
  - @stackra/ui@0.17.2
  - @stackra/testing@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/validation@0.17.2
  - @stackra/scope@0.17.2

## 0.17.1

### Patch Changes

- @stackra/rules@0.17.1
  - @stackra/actions@0.17.1
  - @stackra/database@0.17.1
  - @stackra/model@0.17.1
  - @stackra/ui@0.17.1
  - @stackra/testing@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/validation@0.17.1
  - @stackra/scope@0.17.1

## 0.17.0

### Patch Changes

- @stackra/actions@0.17.0
  - @stackra/rules@0.17.0
  - @stackra/database@0.17.0
  - @stackra/model@0.17.0
  - @stackra/ui@0.17.0
  - @stackra/testing@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/validation@0.17.0
  - @stackra/scope@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/actions@0.16.0
  - @stackra/rules@0.16.0
  - @stackra/database@0.16.0
  - @stackra/model@0.16.0
  - @stackra/ui@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/scope@0.16.0
  - @stackra/testing@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- @stackra/scope@0.15.0
  - @stackra/rules@0.15.0
  - @stackra/actions@0.15.0
  - @stackra/database@0.15.0
  - @stackra/model@0.15.0
  - @stackra/ui@0.15.0
  - @stackra/testing@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/validation@0.15.0

## 0.14.4

### Patch Changes

- @stackra/rules@0.14.4
  - @stackra/actions@0.14.4
  - @stackra/database@0.14.4
  - @stackra/model@0.14.4
  - @stackra/ui@0.14.4
  - @stackra/testing@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/validation@0.14.4
  - @stackra/scope@0.14.4

## 0.14.3

### Patch Changes

- @stackra/actions@0.14.3
  - @stackra/rules@0.14.3
  - @stackra/database@0.14.3
  - @stackra/model@0.14.3
  - @stackra/ui@0.14.3
  - @stackra/testing@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/validation@0.14.3
  - @stackra/scope@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/actions@0.14.2
  - @stackra/rules@0.14.2
  - @stackra/database@0.14.2
  - @stackra/model@0.14.2
  - @stackra/ui@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/scope@0.14.2
  - @stackra/testing@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/actions@0.14.1
  - @stackra/rules@0.14.1
  - @stackra/database@0.14.1
  - @stackra/model@0.14.1
  - @stackra/ui@0.14.1
  - @stackra/testing@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/validation@0.14.1
  - @stackra/scope@0.14.1

## 0.14.0

### Patch Changes

- @stackra/actions@0.14.0
  - @stackra/rules@0.14.0
  - @stackra/database@0.14.0
  - @stackra/model@0.14.0
  - @stackra/ui@0.14.0
  - @stackra/testing@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/validation@0.14.0
  - @stackra/scope@0.14.0

## 0.13.0

### Patch Changes

- @stackra/actions@0.13.0
  - @stackra/rules@0.13.0
  - @stackra/database@0.13.0
  - @stackra/model@0.13.0
  - @stackra/ui@0.13.0
  - @stackra/testing@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/validation@0.13.0
  - @stackra/scope@0.13.0

## 0.12.0

### Patch Changes

- @stackra/actions@0.12.0
  - @stackra/rules@0.12.0
  - @stackra/database@0.12.0
  - @stackra/model@0.12.0
  - @stackra/ui@0.12.0
  - @stackra/testing@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/validation@0.12.0
  - @stackra/scope@0.12.0

## 0.11.1

### Patch Changes

- @stackra/actions@0.11.1
  - @stackra/rules@0.11.1
  - @stackra/database@0.11.1
  - @stackra/model@0.11.1
  - @stackra/ui@0.11.1
  - @stackra/testing@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/validation@0.11.1
  - @stackra/scope@0.11.1

## 0.11.0

### Patch Changes

- @stackra/actions@0.11.0
  - @stackra/rules@0.11.0
  - @stackra/database@0.11.0
  - @stackra/model@0.11.0
  - @stackra/ui@0.11.0
  - @stackra/testing@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/validation@0.11.0
  - @stackra/scope@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
- Updated dependencies [aea9b1d]
  - @stackra/contracts@0.10.0
  - @stackra/database@0.10.0
  - @stackra/actions@0.10.0
  - @stackra/ui@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/scope@0.10.0
  - @stackra/rules@0.10.0
  - @stackra/model@0.10.0
  - @stackra/container@0.10.0
  - @stackra/validation@0.10.0
  - @stackra/testing@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [e80a99b]
- Updated dependencies [2e43c48]
- Updated dependencies [b174a17]
- Updated dependencies [681d01a]
- Updated dependencies [f9c825d]
  - @stackra/validation@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/model@0.9.0
  - @stackra/ui@0.9.0
  - @stackra/container@0.9.0
  - @stackra/database@0.9.0
  - @stackra/actions@0.9.0
  - @stackra/rules@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/scope@0.9.0
  - @stackra/testing@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [928dcc0]
- Updated dependencies [7dd35b3]
  - @stackra/database@0.8.0
  - @stackra/container@0.8.0
  - @stackra/rules@0.8.0
  - @stackra/scope@0.8.0
  - @stackra/actions@0.8.0
  - @stackra/model@0.8.0
  - @stackra/ui@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/testing@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/rules@0.7.1
  - @stackra/actions@0.7.1
  - @stackra/database@0.7.1
  - @stackra/model@0.7.1
  - @stackra/ui@0.7.1
  - @stackra/testing@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/validation@0.7.1
  - @stackra/scope@0.7.1

## 0.7.0

### Minor Changes

- 1f5bf76: The IAM kit's first blocks (ADR 0504) in `@stackra/iam/react`. `Can` shows its children only while the signed-in
  session holds a permission (all or any of several, read through `usePermission`), with a `fallback` otherwise.
  `RolePicker` is a single-choice `EntityPicker` of roles whose `loadOptions` the host binds. `RolesPage` shows the
  built-in roles read-only and the custom roles editable on `PermissionsMatrix`, and saves through `onSave`. Every word
  comes from the host in `labels`. The showcase lists the three under Blocks.

### Patch Changes

- @stackra/rules@0.7.0
  - @stackra/actions@0.7.0
  - @stackra/database@0.7.0
  - @stackra/model@0.7.0
  - @stackra/ui@0.7.0
  - @stackra/testing@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/validation@0.7.0
  - @stackra/scope@0.7.0

## 0.6.1

### Patch Changes

- @stackra/actions@0.6.1
  - @stackra/rules@0.6.1
  - @stackra/database@0.6.1
  - @stackra/model@0.6.1
  - @stackra/testing@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/validation@0.6.1
  - @stackra/scope@0.6.1

## 0.6.0

### Minor Changes

- e250d4f: Gen writes one `registerActions([...])` in each member's `#stackra/registrations`, a row per action and query with its
  locked key, permission, risk, effects and input schema, so the pipeline validates input and checks the permission of
  every call. `IamAccessControlDriver` now refuses a call with no registered permission instead of letting it through,
  and lets an anonymous caller past `require` and `authorize` only for a class whose `actors` list `anonymous`; the
  manifest marks such a call `anonymous: true` and its OpenAPI operation takes no security. `stackra validate` lists
  every anonymous-callable call, and a test pins today's five (STA-2025).

### Patch Changes

- Updated dependencies [fb29d41]
  - @stackra/database@0.6.0
  - @stackra/rules@0.6.0
  - @stackra/scope@0.6.0
  - @stackra/actions@0.6.0
  - @stackra/model@0.6.0
  - @stackra/testing@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [4fa949b]
  - @stackra/database@0.5.1
  - @stackra/rules@0.5.1
  - @stackra/scope@0.5.1
  - @stackra/actions@0.5.1
  - @stackra/model@0.5.1
  - @stackra/testing@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- @stackra/rules@0.5.0
  - @stackra/actions@0.5.0
  - @stackra/database@0.5.0
  - @stackra/model@0.5.0
  - @stackra/testing@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/validation@0.5.0
  - @stackra/scope@0.5.0

## 0.4.0

### Minor Changes

- bb08f25: `MemoryDimensionValuesDriver` is the `memory` candidate of `DimensionValues`: a consuming service projects the values the owning service's events make live (`project`, `retire`); nothing is live until projected. Gen binds the workflow node's `ServiceAckService`, `AutomationService` and `ChecklistService` where a member injects them and registers their model partners, as it does `RuleSetService`.

### Patch Changes

- 1856ee0: `Risk`, `Permission`, `Permissions`, `registerPermissions`, `permissionKey` and `PermissionRegistration` now come from
  `@stackra/contracts` and `@stackra/container` and are re-exported from `@stackra/iam`, so every import keeps working and
  one registry is shared (STA-1890, ADR 0513). Evaluation, roles and the snapshot code stay in iam.
- 70e6c17: Fix declaration emit for the called form of `Policy` (STA-1680): `Policy<M>` is now an exported interface and the
  called form returns the new exported `PolicyClass<M>`, so `class XPolicy extends Policy<X>({ permissions }) {}` no
  longer fails with TS4094. Runtime behaviour and permission keys are unchanged.
- Updated dependencies [71b37fc]
- Updated dependencies [7a94bc4]
- Updated dependencies [a7eaed4]
- Updated dependencies [a8c358a]
- Updated dependencies [0b660e0]
- Updated dependencies [0b660e0]
- Updated dependencies [3ce01cf]
- Updated dependencies [9c8d108]
- Updated dependencies [3c30885]
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
  - @stackra/rules@0.4.0
  - @stackra/scope@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/database@0.4.0
  - @stackra/container@0.4.0
  - @stackra/model@0.4.0
  - @stackra/errors@0.4.0
  - @stackra/testing@0.4.0

## 0.3.0

### Minor Changes

- 23e556c: `hiddenColumns` hides a `credential` column even from the holder of its permission (STA-1677, ADR 0494).

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
  - @stackra/actions@0.3.0
  - @stackra/database@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/model@0.3.0
  - @stackra/rules@0.3.0
  - @stackra/scope@0.3.0
  - @stackra/testing@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Minor Changes

- 5fa1a15: Add the `RoleGrants` port to `@stackra/iam/contracts` (STA-1586): `grant(principal, grant)` gives a principal one role
  at one scope node unless already held and answers whether it wrote. The IAM service that owns grants binds it; it is
  the write half of the operator bootstrap. No driver ships here.

### Patch Changes

- 1a9259b: The integration tier runs (STA-1570). `@stackra/vitest-config/int` adds `intTier(config)` and `INT_TESTS`
  (`src/**/__tests__/**/*.int.test.{ts,tsx}` and gen's `.stackra/tests/**/*.int.test.ts`); `servicePreset`'s `int`
  project uses the same globs. The members with `.int.test.ts` files gain `vitest.int.config.ts` and a `test:int` script,
  which the new turbo task `test:int` and the Quality Gate run on a Testcontainers Postgres.
- Updated dependencies [2d5a888]
- Updated dependencies [cfdcdf8]
- Updated dependencies [2d5a888]
- Updated dependencies [1a9259b]
- Updated dependencies [9085c41]
  - @stackra/actions@0.2.0
  - @stackra/database@0.2.0
  - @stackra/errors@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/rules@0.2.0
  - @stackra/scope@0.2.0
  - @stackra/model@0.2.0
  - @stackra/testing@0.2.0
  - @stackra/container@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 6f2c1f7: Add the `HasMetadata` and `HasOwner` traits (ADR 0321 d4, data-layer gap mo18). `@stackra/database` exports
  `HasMetadata` (a `metadata` bag of string keys to string values, at most 16 KB), the blueprint's `t.metadata()` (with an
  optional GIN index), `MetadataSubscriber` and `MetadataInvalidError`; `CrudService` checks metadata on every write.
  `@stackra/iam/node` exports `HasOwner` (`ownerId`, the owner or assignee) and `OwnerMacro` (`t.owner()`).
- 67aa168: IAM is permission-only and knows no segments (ADR 0462 decision 1): `Audience` is `ScopeRef | RoleRef`, `Audience$`
  refuses `{ kind: "segment" }`, `PolicySnapshot` and `MemoryPolicyState` drop `segments` (an older snapshot event's
  `segments` key is ignored), and the decision point and visibility filter no longer match segment audiences. The
  `@stackra/segments` dependency is removed. `Permissions`, `Permission` and `Risk` stay in `@stackra/iam`.
- 82a533d: Add the existence-only query: `ExistenceQueryService.matching(model, where, { limit })` (`./node`) answers which records
  of a model match a check (a conflict check, a duplicate search) as existence-only hits (id and model key), reading the
  primary key only, counting nothing, at most `limit` hits, under the records the caller may see or only learn exist
  (`IamVisibilityFilterDriver.existenceConditionsFor`, `see` or `exists`, followed relations included). Add
  `assertFieldsReadable` (`.`): a count, sum or other aggregate over or filtered on a hidden field is refused, so filtered
  aggregates apply the same field policy as reads on top of the row policy `CrudService` already ANDs (STA-933).
- 2787c1e: Add `@stackra/iam`: the `Permissions`, `Permission` (L0 to L4, `.system()`), `Policy<M>` and `Role({ grants })` kinds,
  `Decision`, `Risk` and `SystemRole`, the embedded policy decision point (scoped grants that inherit downward, explicit
  deny with `@stackra/rules` conditions and audiences that name `@stackra/segments`' `SegmentRef`, record
  visibility and `visibleCondition`, the delegation bound), the action pipeline's
  `AccessControl` driver, the scope package's `GrantedScopes` driver, the record-visibility query filter
  (`IamVisibilityFilterDriver` for `@stackra/database`'s `VisibilityFilter` and `registerVisibility`, `./node`),
  `usePermission` (`./react`) and `actors` (`./testing`); `@stackra/clients` types an action ref's `risk` as `Risk`.
- 3312ef3: Add the production `StorePolicySourceDriver` over the new `PolicySnapshotStore` port (with
  `MemoryPolicySnapshotStoreDriver` and `decodePolicySnapshot` for event payloads); field-level rules (`FieldRule`,
  `FieldAccess`, `pdp.fieldAccess`, `redactFields`, `assertFieldsWritable`); conditions on dimensions another service owns
  (`registerDimensions`, the `DimensionValues` port, fail closed); time-boxed break-glass (`BreakGlassGrant`,
  `breakGlassGrant`, `AccessReason.BreakGlass`, `DenyRule.breakable`); existence-only hits (`Capability.Exists`,
  `existenceHit`); and restricted permissions that are never self-granted (`Permission.Lx.restricted()`,
  `Grant.grantedBy`, `canDelegate(..., { to })`).
- f0c9f64: Policy snapshots are tenant-scoped: `PolicySnapshotStore.read` and `write` take the tenant, and
  `StorePolicySourceDriver` reads under the actor's tenant. Add the durable `PostgresPolicySnapshotStoreDriver` in
  `./node` with its `iam.policy_snapshots` migration (forced tenant equality policy), and `PolicySnapshotIntakeService`,
  the body of the listener that decodes and stores the IAM service's snapshot event (STA-815). Roles may hold permission
  selectors: `@read` and `@risk:<level>`, optionally behind a prefix, never picking a system or restricted permission for
  a grant (STA-818, ADR 0407).
- 074d3e8: Report dimensions and measures take a `permission` and a `dataClass`. The report runner checks the caller's column
  permissions through the decision point and drops what it may not see (a classified column needs a permission; a formula
  over a hidden measure hides too); a filter on a hidden column is forbidden. `@stackra/iam` adds `hiddenColumns` and
  `ColumnRule`.
- 2babf37: Ship the `X$` schema of each contract type a shape field names (STA-1284): `Address$`, `ScopeRef$`, `Actor$`,
  `Signature$` and `SignerPublicKey$` from `@stackra/validation`; `IsoDate$`, `HijriDate$`, `WorkingWeek$` and the
  `WorkingWeek` type from `@stackra/calendar`; `CustomFieldDefinition$` and `CustomFieldValue$` from `@stackra/content`;
  `ImportChange$` and `RowError$` from `@stackra/data-transfer/contracts`; `PromotionDiff$` from
  `@stackra/settings/contracts`; `Audience$` from `@stackra/iam/contracts`. `Condition$` already ships from
  `@stackra/rules`.

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
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
- ca44233: Breaking renames for unique public names (STA-1383): `@stackra/rules` `Decision` is `RuleDecision` (iam's `Decision`
  is the allow or deny enum) and `Facts` is `RuleFacts` (ai's `Facts` is the facts kind base). Importers are updated.
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
- Updated dependencies [59ac846]
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
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [f7a2d36]
- Updated dependencies [67aa168]
- Updated dependencies [0a96532]
- Updated dependencies [49c3553]
- Updated dependencies [c21a223]
- Updated dependencies [2787c1e]
- Updated dependencies [ca44233]
- Updated dependencies [376a093]
- Updated dependencies [93fa8f1]
- Updated dependencies [89548ea]
- Updated dependencies [2787c1e]
- Updated dependencies [a31d463]
- Updated dependencies [158f6cf]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [fd13f0e]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [c3ff8a7]
- Updated dependencies [3e2fc84]
- Updated dependencies [5e8114b]
- Updated dependencies [2c0ea71]
- Updated dependencies [e344058]
- Updated dependencies [2787c1e]
- Updated dependencies [a65c6bc]
- Updated dependencies [ab9cc36]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/database@0.1.0
  - @stackra/model@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/scope@0.1.0
  - @stackra/testing@0.1.0
  - @stackra/validation@0.1.0
  - @stackra/rules@0.1.0

Written by Changesets on release; never edited by hand.
