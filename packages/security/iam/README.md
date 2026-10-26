# @stackra/iam

Stackra IAM: who may do what, where, and on which records. Permissions and their risk are declared per model, record
rules live in a policy per model, module roles bundle permissions, and an embedded policy decision point answers every
check in process from the principal's policy snapshot (ADR 0208, 0132, 0333).

**Tier:** `tier:lib` (`packages/security/iam`). Entries `.`, `./contracts`, `./node`, `./react` and `./testing`.
Depends on `@stackra/actions`, `@stackra/container`, `@stackra/contracts`, `@stackra/errors`, `@stackra/rules`,
`@stackra/scope`, `@stackra/segments` (its `./contracts` only, for the `SegmentRef` audience) and, for `./node` only,
`@stackra/database`, `@stackra/model` and `@stackra/validation`.

## What is here

| Entry         | Symbol                                                                                  | Use                                                                       |
| ------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `.`           | `Permissions`, `Permission`                                                             | a model's permission set: one `static readonly <verb> = Permission.Lx`    |
| `.`           | `Policy`, `Decision`                                                                    | record rules per model, methods named after verbs                         |
| `.`           | `Role`                                                                                  | a module's system role: `Role({ grants })`                                |
| `.`           | `Risk`, `SystemRole`, `AccessReason`                                                    | the L0 to L4 scale, the built-in role codes, why a check decided          |
| `.`           | `PolicyDecisionPointService`                                                            | `check`, `explain`, `visibility`, `visibleCondition`, `canDelegate`       |
| `.`           | `IamAccessControlDriver`                                                                | the action pipeline's permission step and `ctx.authorize(record)`         |
| `.`           | `IamGrantedScopesDriver`                                                                | `@stackra/scope`'s `GrantedScopes`: where a principal holds grants        |
| `.`           | `MemoryPolicySourceDriver`                                                              | a policy held in memory (tests, local runs)                               |
| `.`           | `StorePolicySourceDriver`, `MemoryPolicySnapshotStoreDriver`, `decodePolicySnapshot`    | production source over the event-fed store; decode an event's snapshot    |
| `.`           | `redactFields`, `assertFieldsWritable`, `FieldPermissions`                              | apply `pdp.fieldAccess`: drop hidden fields, refuse read-only writes      |
| `.`           | `breakGlassGrant`                                                                       | open a time-boxed emergency grant (reason, window, longest duration)      |
| `.`           | `registerDimensions`, `DimensionRegistration`                                           | which fields carry a dimension another service owns (ADR 0351)            |
| `.`           | `existenceHit`, `SearchHit`                                                             | full record, existence-only hit, or nothing                               |
| `./contracts` | `PolicySnapshotStore`, `DimensionValues`, `FieldRule`, `FieldAccess`, `BreakGlassGrant` | the event-fed store, the dimension projection, field and break-glass data |
| `.`           | `PermissionSnapshotService`                                                             | the client's UI permissions snapshot                                      |
| `.`           | `registerPermissions`, `registerRoles`, `registerPolicies`, `connectPolicies`           | what gen's entry tells the runtime                                        |
| `.`           | `permissionKey`                                                                         | the locked key of a `Permission` static                                   |
| `./contracts` | `PolicySource`                                                                          | the port snapshots come from                                              |
| `./node`      | `IamVisibilityFilterDriver`                                                             | `@stackra/database`'s `VisibilityFilter`: visibility rules in reads       |
| `./node`      | `PostgresPolicySnapshotStoreDriver`                                                     | the durable `PolicySnapshotStore`: one row per tenant and principal       |
| `.`           | `PolicySnapshotIntakeService`, `PolicySnapshotEvent`                                    | the body of the listener that stores the IAM service's snapshot events    |
| `./node`      | `registerVisibility`, `VisibilityRegistration`                                          | what gen's entry tells the query filter about each declaring model        |
| `./contracts` | `PolicySnapshot`, `Grant`, `DenyRule`, `VisibilityRule`, `Audience`, `Capability`       | the policy as data                                                        |
| `./react`     | `usePermission`                                                                         | `const can = usePermission(); can(OrderPermissions.create)`               |
| `./testing`   | `actors`, `IAM_TESTING_PLUGIN`                                                          | test callers; the plugin that opens the memory policy                     |

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
3. A grant applies at its scope node and every node below, until it expires. The pipeline driver checks at the call's
   `scope` (`ctx.scope`); a call without one acts at the node its caller's credential names, read from `ScopeTree`,
   or at the root when there is none.
4. A role's permissions come from its module class (`registerRoles`) or from the snapshot (custom and provisioned
   roles). A wildcard (`orders.*`, `*`) counts only in a system role. A selector counts in any role: `@read` holds every
   registered L0 and L1 permission, `@risk:l2` every one at that risk, each narrowed by a prefix (`orders.@read`); a
   selector never picks a system or restricted permission, except in a deny (ADR 0407).
5. An explicit deny beats every grant. A deny with a `@stackra/rules` condition is tested only against a record, and
   denies when the record's model registered no fact source.
6. Every link of the actor chain must hold the permission: a service and the user it acts for.

`ctx.authorize(record)` runs the record's policy method named after the permission's verb (any deny wins), then the
check again with the record. Visibility (`visibility(actor, capability, model, record)`) answers `Deny` over `Allow`,
and `Abstain` when no rule matches: the default for such a record is not decided (ADR 0333 decision 7).

## Record visibility in reads

A model declares visibility with `@stackra/model`'s facet, and every read of it carries the rules in force for the
caller (ADR 0333 decisions 1 and 4), on top of row-level security and never instead of it:

```ts
// src/modules/catalogue/models/product.model.ts
@Visibility({ attributes: ["collection", "status"] }) // each attribute needs an index
export class Product extends Model.with(HasPublicId("prd"), BelongsToTenant) {}

// src/modules/legal/models/document.model.ts: visible only when its matter is
@Visibility({ follows: ["matter"] })
export class Document extends Model.with(HasPublicId("doc"), BelongsToTenant) {
  @ManyToOne(() => Matter)
  matter!: Ref<Matter>;
}

// gen's entry (server)
registerVisibility([
  {
    model: Product,
    key: "catalogue.product",
    rules: PRODUCT_RECORD_RULES,
    unmatched: Decision.Deny,
  },
]);
connectVisibilityFilter(container); // with IamVisibilityFilterDriver bound to VisibilityFilter
```

- `visibleCondition(actor, capability, model, options)` settles each rule's audience for the principal (a scope node
  at or above where the call acts, a segment it belongs to, a role it holds there) and returns one `@stackra/rules`
  condition: no deny rule's condition holds and, unless `unmatched` is `Allow`, an allow rule's does. Each stored
  condition is checked against the model's attributes first; without registered attributes a conditional allow
  matches nothing and a conditional deny everything.
- `IamVisibilityFilterDriver` turns that condition into the read's filter for the `see` capability, at the running
  call's scope node and instant, so `CrudService` lists, single reads, counts and aggregates and `GraphQuery` meet only
  visible rows. A missing value matches `is_not_set` only, as in `evaluate`. A followed relation nests the related
  model's filter under it; a record without the related record is not governed by it.
- `unmatched` has no default: ADR 0333 decision 7 is open, so the registration states what a record no rule matches
  gets. No principal (a listener, a job runner or a seeder outside every call) is the platform, as a system or job
  actor is, and sees every row its row-level security allows. A model that declares the facet without a row fails its
  reads. Nothing skips the filter.
- `registerVisibility` refuses a row whose rules are not exactly the facet's attributes under `record`, a geo
  attribute (a read cannot test one yet), or a followed relation that is not a many-to-one to a declaring model.

## Restricted permissions, break-glass, fields, dimensions

- `Permission.L3.restricted()`: a grant of a role holding it counts only when `grantedBy` is someone else, and
  `canDelegate(..., { to: self })` refuses it. For safeguarding, medical data and client funds.
- A `BreakGlassGrant` in the snapshot holds a permission no regular grant does, only inside its window, and passes only
  denies marked `breakable` (an ethical wall a reviewed emergency may cross); the explanation says `break_glass`. The
  longest duration is a setting passed to `breakGlassGrant`.
- `pdp.fieldAccess(actor, model, { record })` answers the `FieldRule`s in force: hidden and read-only fields.
- A condition on a field `registerDimensions` names is checked against `DimensionValues` (the event-fed projection): a
  value not live fails an allow and holds a deny; `visibleCondition` pushes the live values into the read.
- `Capability.Exists` lets an audience learn only that a record exists; `existenceHit` shapes the search result.

## Wiring

Gen's entry calls `registerPermissions`, `registerRoles` (after the permissions), `registerPolicies` and, on the
server, `registerVisibility` for every model with `@Visibility`, then `connectPolicies(container)` and database's
`connectVisibilityFilter(container)` once the container is booted, with `IamVisibilityFilterDriver` bound to
`VisibilityFilter`. The server binds a `PolicySource` driver fed by the IAM
service's events; `MemoryPolicySourceDriver` is for tests and local runs. On the client, the session's owner sets the
held keys on `PermissionSnapshotService`; `usePermission` reads them.

## Testing

`import { actors } from "@stackra/iam/testing"` registers the plugin: every compiled testing app has its policies
connected, and a memory policy source opened to "everyone is owner at the root", so a module's tests exercise its
policies and handlers. Replace it with `app.get(PolicySource).load({...})` for exact grants.

## Not here

- The IAM service: grant writes, the admin API, the explain query, snapshot events and the server `PolicySource`.
- The `list` and `use` capabilities in reads: the query filter applies `see`, since the `VisibilityFilter` port does not
  say whether a read is a list; `use` is `visibility` on one record, in the action that buys or uses it.
- A rule shown as existence only (a masked placeholder, ADR 0333's amendment) and the break-glass read log: the read
  path and the access log, not built.
- Relationship-based access, separation-of-duties pairs and access-review campaigns: paid entitlements (ADR 0208
  decision 5), not built.
