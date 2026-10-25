# @stackra/iam

Stackra IAM: who may do what, where, and on which records. Permissions and their risk are declared per model, record
rules live in a policy per model, module roles bundle permissions, and an embedded policy decision point answers every
check in process from the principal's policy snapshot (ADR 0208, 0132, 0333).

**Tier:** `tier:lib` (`packages/security/iam`). Entries `.`, `./contracts`, `./react` and `./testing`. Depends on
`@stackra/actions`, `@stackra/container`, `@stackra/contracts`, `@stackra/errors`, `@stackra/rules` and
`@stackra/scope`.

## What is here

| Entry         | Symbol                                                                            | Use                                                                    |
| ------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `.`           | `Permissions`, `Permission`                                                       | a model's permission set: one `static readonly <verb> = Permission.Lx` |
| `.`           | `Policy`, `Decision`                                                              | record rules per model, methods named after verbs                      |
| `.`           | `Role`                                                                            | a module's system role: `Role({ grants })`                             |
| `.`           | `Risk`, `SystemRole`, `AccessReason`                                              | the L0 to L4 scale, the built-in role codes, why a check decided       |
| `.`           | `PolicyDecisionPointService`                                                      | `check`, `explain`, `visibility`, `canDelegate`                        |
| `.`           | `IamAccessControlDriver`                                                          | the action pipeline's permission step and `ctx.authorize(record)`      |
| `.`           | `IamGrantedScopesDriver`                                                          | `@stackra/scope`'s `GrantedScopes`: where a principal holds grants     |
| `.`           | `MemoryPolicySourceDriver`                                                        | a policy held in memory (tests, local runs)                            |
| `.`           | `PermissionSnapshotService`                                                       | the client's UI permissions snapshot                                   |
| `.`           | `registerPermissions`, `registerRoles`, `registerPolicies`, `connectPolicies`     | what gen's entry tells the runtime                                     |
| `.`           | `permissionKey`                                                                   | the locked key of a `Permission` static                                |
| `./contracts` | `PolicySource`                                                                    | the port snapshots come from                                           |
| `./contracts` | `PolicySnapshot`, `Grant`, `DenyRule`, `VisibilityRule`, `Audience`, `Capability` | the policy as data                                                     |
| `./react`     | `usePermission`                                                                   | `const can = usePermission(); can(OrderPermissions.create)`            |
| `./testing`   | `actors`, `IAM_TESTING_PLUGIN`                                                    | test callers; the plugin that opens the memory policy                  |

## Declaring access

```ts
// src/modules/orders/access/order.permissions.ts
export class OrderPermissions extends Permissions {
  static readonly read = Permission.L0;
  static readonly cancel = Permission.L2;
  static readonly expire = Permission.L2.system(); // only the platform holds it
}

// src/modules/orders/access/order.policy.ts
export class OrderPolicy extends Policy<Order> {
  read(actor: Actor, order: Order): Decision {
    const subject = actor.onBehalfOf ?? actor;
    return subject.realm === Realm.Customer && order.customerId !== subject.id
      ? Decision.Deny
      : Decision.Abstain;
  }
}

// src/modules/orders/access/order-clerk.role.ts
export class OrderClerkRole extends Role({
  grants: [OrderPermissions.read, OrderPermissions.cancel],
}) {}
```

Keys are derived, never written: `orders.order.cancel` comes from the module, the class minus `Permissions` and the
static. An action takes its risk from its permission. A policy whose permission set has another stem names it:
`Policy<StockLevel>({ permissions: StockPermissions })`.

## How a check decides

1. A system or job actor is the platform and passes.
2. A system permission is held by the platform only (a service acting for no one counts); no role grants it.
3. A grant applies at its scope node and every node below, until it expires. A call with no scope acts at the root.
4. A role's permissions come from its module class (`registerRoles`) or from the snapshot (custom and provisioned
   roles). A wildcard (`orders.*`, `*`) counts only in a system role.
5. An explicit deny beats every grant. A deny with a `@stackra/rules` condition is tested only against a record, and
   denies when the record's model registered no fact source.
6. Every link of the actor chain must hold the permission: a service and the user it acts for.

`ctx.authorize(record)` runs the record's policy method named after the permission's verb (any deny wins), then the
check again with the record. Visibility (`visibility(actor, capability, model, record)`) answers `Deny` over `Allow`,
and `Abstain` when no rule matches: the default for such a record is not decided (ADR 0333 decision 7).

## Wiring

Gen's entry calls `registerPermissions`, `registerRoles` (after the permissions) and `registerPolicies`, then
`connectPolicies(container)` once the container is booted. The server binds a `PolicySource` driver fed by the IAM
service's events; `MemoryPolicySourceDriver` is for tests and local runs. On the client, the session's owner sets the
held keys on `PermissionSnapshotService`; `usePermission` reads them.

## Testing

`import { actors } from "@stackra/iam/testing"` registers the plugin: every compiled testing app has its policies
connected, and a memory policy source opened to "everyone is owner at the root", so a module's tests exercise its
policies and handlers. Replace it with `app.get(PolicySource).load({...})` for exact grants.

## Not here

- The IAM service: grant writes, the admin API, the explain query, snapshot events and the server `PolicySource`.
- The per-model visibility filter on queries (ADR 0333 decision 4): model and database, wave 9.
- Relationship-based access, separation-of-duties pairs and access-review campaigns: paid entitlements (ADR 0208
  decision 5), not built.
