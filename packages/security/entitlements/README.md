<!--
Stackra file contract:
Purpose: the reader guide of @stackra/entitlements: entries, declaring, the pipeline check, grant by class or key, sources, testing.
Boundary: documentation of packages/security/entitlements only.
Runtime: none
Governing contract: ADR 0215; ADR 0294; STA-1225 (grant by key); ADR 0335 (edition bundles, stackra-64).
-->

# @stackra/entitlements

Stackra entitlements: the `Entitlement` kind for plan rights (a feature, a limit, a module), the `EntitlementSource`
and `EntitlementUsage` ports (`EntitlementUsage` from `./contracts`), the plan driver of the action pipeline's entitlement step, `LimitReachedError` and the
`fakeEntitlements` test helper.

**Tier:** `tier:lib` (`packages/security/entitlements`). Entries `.`, `./contracts` and `./testing`. Depends on
`@stackra/actions`, `@stackra/container`, `@stackra/contracts` and `@stackra/errors`.

An entitlement is a commercial right. It is never a release switch (that is a flag, `@stackra/feature-flags`, ADR 0213) and never consent (`@stackra/consent`). It gates calls, not records, so it is not a model trait.

## What is here

| Entry         | Symbol                                                                                  | Use                                                                        |
| ------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `.`           | `Entitlement`, `EntitlementKind`                                                        | the kind base: `class XEntitlement extends Entitlement({ kind, counts })`  |
| `./contracts` | `EntitlementSource` (also re-exported from `.`)                                         | the port grants come from: the plan service in SaaS, the licence on-prem   |
| `./contracts` | `PlanSnapshots`, `SeatLedger`, `PlanSnapshot`, `LimitGrant`, `SeatAssignment`           | the plan of a scope and the seats held                                     |
| `.`           | `PlanSnapshotEntitlementSourceDriver`, `MemoryPlanSnapshotsDriver`                      | the SaaS source over the plan snapshot, and its memory store               |
| `.`           | `LimitReservationService`                                                               | reserve-then-commit: a create at a limit runs under the limit's lock       |
| `.`           | `PlanLimitReservationDriver`                                                            | the pipeline's `LimitReservation`: every create a limit gates is reserved  |
| `.`           | `EntitlementValueService`                                                               | reads a value entitlement's number (`EntitlementKind.Value`) from the plan |
| `.`           | `SeatMeterService`, `MemorySeatLedgerDriver`, `SeatLimitReachedError`                   | the seat-kind meter: assign, release, usage per kind                       |
| `.`           | `limitAllows`                                                                           | whether one more fits a count or a soft limit at a time                    |
| `.`           | `isLimitGrant`, `limitOf`                                                               | whether a grant is a usable limit; the allowance a refusal names           |
| `.`           | `planCatalogueOf` (rows are `@stackra/contracts`' `CatalogueRow`)                       | parse a plan-catalogue version; other record kinds land in `extras`        |
| `./contracts` | `CapLiftFacts`; `.` `paidPlanDays`                                                      | the R1-OS-40 cap-lift facts; the paid-plan age from `PlanSnapshot`         |
| `./contracts` | `EntitlementUsage`                                                                      | the port a limit's current count comes from (the data layer implements it) |
| `.`           | `PlanEntitlementCheckDriver`                                                            | the driver of `EntitlementCheck`, the pipeline's entitlement step          |
| `.`           | `LimitReachedError`                                                                     | `limit_reached`: the refusal of a create past the plan's limit             |
| `.`           | `registerEntitlements`, `entitlementKey`                                                | what gen's entry calls at boot; the locked key a keyed source looks up     |
| `.`           | `isEntitled`                                                                            | yes or no for one entitlement in one scope, by class or by key             |
| `./contracts` | `EntitlementKey` (also re-exported from `.`)                                            | an entitlement named by its key: `billing` or `catalogue.product_limit`    |
| `.`           | `EntitlementClass`, `EntitlementGrant`, `EntitlementOptions`, `EntitlementRegistration` | types                                                                      |
| `./testing`   | `fakeEntitlements`                                                                      | an `EntitlementSource` with the grants a test lists                        |

## Declaring an entitlement

One `<name>.entitlement.ts` per right, in a module's `access/` group:

```ts
import { Entitlement, EntitlementKind } from "@stackra/entitlements";
import { Product } from "#modules/catalogue/models/product.model";

/** Counted over live products; creating one past the limit refuses `limit_reached`. */
export class ProductLimitEntitlement extends Entitlement({
  kind: EntitlementKind.Limit,
  counts: () => Product,
}) {}
```

The key (`catalogue.product_limit`) and the label key come from the class name and the module. A limit names the model
it counts and gen puts its gate on that model's generated create; a feature or a module takes no `counts`. Both rules
are checked when the class is declared.

A limit may count only some of its records with `where`, field equality on the counted model (STA-913):

```ts
export class TillLimitEntitlement extends Entitlement({
  kind: EntitlementKind.Limit,
  counts: () => Till,
  where: { retiredAt: null },
}) {}
```

A retired till stops counting and frees its place. `where` on a feature or module, or a value that is not a scalar,
throws a `TypeError` at declaration.

## The entitlement step

`ActionPipeline` (`@stackra/actions`) runs tenancy, permission, preconditions, then `EntitlementCheck`, then the flag
step. `PlanEntitlementCheckDriver` is that step's driver; this package adds no second gate. Gen's entry registers
which calls each entitlement gates:

```ts
registerEntitlements([
  {
    type: ProductLimitEntitlement,
    key: "catalogue.product_limit",
    gates: [ProductOperations.Create],
  },
]);
```

For each entitlement that gates the call, the driver asks `EntitlementSource.grant(entitlement, scope)`:

- `undefined` or `false`: the right is not in the plan, so the call refuses `entitlement_required`.
- a feature or module granted `true`: the call goes on.
- a limit granted `n`: the driver asks `EntitlementUsage.count(model, scope, where)` and refuses `limit_reached` (details
  `entitlement` and `limit`) when the count is already `n` or more. `Number.POSITIVE_INFINITY` means no limit and
  counts nothing.

A grant of the wrong shape (a count for a feature, `true` for a limit) is a source bug and throws a `TypeError`.
Collaboration (ADR 0270) and any other gated surface is a feature or module entitlement checked the same way.

## By class or by key

Code that holds the class passes the class. A caller that only knows the key, such as the marketplace registry gating
the install of a paid module it knows by its module key (ADR 0131), passes the key: a module entitlement's key is the
module key (`billing`), a feature, limit or value is `<module>.<name>` (`catalogue.product_limit`). `entitlementKey`
turns either into the key, so a source answers both from the same record:

```ts
await source.grant(ProductLimitEntitlement, scope.id); // { limit: 2 }
await source.grant("catalogue.product_limit", scope.id); // { limit: 2 }, the same record
if (!(await isEntitled(source, module.key, scope.id))) throw EntitlementRequiredError.create();
```

A key that is not `<module>` or `<module>.<name>` in snake_case throws a `TypeError`. `isEntitled` counts no usage:
it is true for any grant in the plan (`true`, a count, a soft limit, a value) and false for `false` or no grant.

## Sources

| Mode       | What its `EntitlementSource` driver reads                                                             |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| SaaS       | reads the plan service's event-fed snapshot (plan, add-ons, overrides and trials composed there)      |
| On-prem    | reads the entitlement codes of the licence `@stackra/licensing` verified, keyed by `entitlementKey()` |
| Air-gapped | as on-prem: the signed licence file needs no network                                                  |

Neither driver lives here: the plan service binds the SaaS one and the on-prem runtime the licence one. A source
answers one entitlement for one scope and composes nothing. The scope is the id of the call's `scope` (`ctx.scope`, the
contracts `ScopeRef` of the scope-tree node the call acts in, ADR 0208 and 0327), `undefined` for a platform-wide call.
A source whose plan sits on an ancestor node reads the node's path from `ScopeTree`.

## Soft limits, grace and the race

A limit grant is a count (hard) or a `LimitGrant` `{ limit, graceEndsAt?, ceiling? }`: past `limit`, creates still
pass while the grace period runs and the count is below `ceiling`. The numbers and dates are plan-catalogue data. The
pipeline step reads a snapshot, so two creates racing at the last slot may both pass; a create that must never pass
runs inside `LimitReservationService.reserve(entitlement, scope, create)`, which holds the limit's lock from the count
until the create returns. Bind `PlanLimitReservationDriver` as the pipeline's `LimitReservation` and every action a
limit gates gets that reservation around its unit of work, with no code in the action.

A value entitlement (`EntitlementKind.Value`, ADR 0408) is a plain number the plan sets that counts no model, such as
the audit visible window in days: `await values.valueOf(AuditWindowDaysEntitlement, scope.id)` answers it from the
effective plan, or `undefined` when the plan does not set it.

## Plan catalogue records

`planCatalogueOf(rows)` reads the `seat_kind`, `module`, `tier` and `trial` rows of a `plan-catalogue:<product>`
version and checks every reference. A row of any other record kind (a `limit_policy` row) is not refused: it is kept
untouched in `catalogue.extras[<record>]`, in row order, for the service that owns that kind to parse. A row with no
`record` is still a `RangeError`.

## Edition bundles

An edition sells the base modules it bundles in its own plan ladder (ADR 0335 decision 6). The bundle is catalogue data
(`EditionEntitlementBundle`: the base key, the base module entitlements every tier includes, and per-tier additions).
`bundleEditionCatalogue(edition, bundle, base)` returns the edition's catalogue with those modules sold and included
by each tier, so `tierPlan` grants them like the edition's own; a base module outside the bundle never appears, so a
scope on an edition plan cannot hold it. A bundled module the base does not sell, or an unknown tier, is a
`RangeError`.

## Cap-lift facts

`CapLiftFacts` (`./contracts`) is the input of a trust-cap rule set (R1-OS-40): `kybPassed` from the verification
service, `domainVerified` from tenancy (`tenancy.domain.verified.v1`), and `paidPlanDays`, which this package answers
with `paidPlanDays(snapshot, now)` over the plan service's optional `PlanSnapshot.paidSince`. The days that lift a
cap are rule-set data.

## Seat kinds

Seat kinds (a full seat, a provider seat, a support seat) are catalogue records: `PlanSnapshot.seats` maps each kind's
key to its allowance. `SeatMeterService.assign(scope, principal, kind)` checks and records under one lock;
`usage(scope)` returns the seats held per kind for billing.

## Testing

```ts
import { EntitlementSource, LimitReachedError } from "@stackra/entitlements";
import { fakeEntitlements } from "@stackra/entitlements/testing";

await createTestingModule(CommerceModule)
  .useDrivers("memory")
  .override(EntitlementSource, fakeEntitlements([[ProductLimitEntitlement, 2]]))
  .compile();

expect(await run(ProductOperations.Create, input, { as: actors.staff() })).toRefuseWith(
  refusal(LimitReachedError),
);
```

Every scope gets the listed grants; an entitlement not listed is not in the plan. An entry may name a key
(`["billing", true]`); a registered class and its key answer the same grant. Counts come from the real
`EntitlementUsage`, so a test creates the records it needs.

## Not here

- The plan, add-on, override and trial data and their composition: the plan service (ADR 0215 decisions 1 and 5).
- Hard, soft and grace enforcement policies per limit (ADR 0215 decision 4): every limit is hard here.
- Counting records: the data layer implements `EntitlementUsage`. The check reads a snapshot, so two creates racing
  at the limit may both pass; a hard bound needs a storage constraint.
- Hiding a route, menu item, widget or MCP tool the plan lacks: the navigation, panel and MCP packages read grants.
