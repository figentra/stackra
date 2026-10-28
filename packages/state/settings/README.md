# @stackra/settings

Stackra settings: the runtime values a module exposes to its admins and users, resolved per scope (ADR 0307 rules 22
to 24, ADR 0213). A module declares one settings class, code reads the resolved group with `SettingsReader#get`, and gen
writes the settings page, the operations, the permissions and the labels from the class. Settings are runtime values
per scope; deploy-time values are configuration (`@stackra/config`). A setting is never a secret.

**Tier:** `tier:lib` (`packages/state/settings`). Entries `.`, `./contracts`, `./node`, `./native` and `./testing`.
Depends on `@stackra/container`, `@stackra/contracts`, `@stackra/database`, `@stackra/errors`, `@stackra/i18n`,
`@stackra/icons`, `@stackra/market-packs`, `@stackra/model`, `@stackra/ui`, `@stackra/validation`, `yaml` and `zod`.

## What is here

| Entry         | Symbol                                                | Use                                                              |
| ------------- | ----------------------------------------------------- | ---------------------------------------------------------------- |
| `.`           | `Settings`, `Setting`                                 | the kind base of a module's group and the field decorator        |
| `.`           | `SettingScope`, `SettingType`                         | the levels settings names, and the type of a generated key       |
| `.`           | `AccountSettings`                                     | a person's own account preferences: `locale`, their language     |
| `.`           | `SettingsReader`                                      | `get(Class)`, and `read(page)` / `write(page, values)` for forms |
| `.`           | `MemorySettingValueStoreDriver`                       | a store in memory (tests, local runs, a client)                  |
| `.`           | `settingKeys`, `settingsPage`                         | what a member's generated `#stackra/settings` is built with      |
| `.`           | `SettingsResolver`                                    | floors, provenance, live checks, revisions, approval, schedules  |
| `.`           | `SettingsPackService`, `diffSettingsPacks`            | export, diff and apply packs                                     |
| `.`           | `settingsPackToYaml`, `settingsPackFromYaml`          | the YAML pack file                                               |
| `.`           | `SettingsPack$`, `SettingsChange$`                    | the pack and diff-row schemas                                    |
| `./contracts` | `PromotionDiff$`                                      | the shipped schema of `PromotionDiff`, for a shape field         |
| `.`           | `settingFloorsOf`                                     | market-pack floors matched to setting keys                       |
| `.`           | `SettingsMode`, `visibleSettingFields`                | developer and normal display modes                               |
| `.`           | `SettingsPromotableDriver`                            | settings as a promotable kind                                    |
| `.`           | `MemorySettingFloorSourceDriver`, `MemorySetting...`  | floors and revisions in memory                                   |
| `.`           | `SettingsLockedError`, `SettingValueInvalidError`     | refusals                                                         |
| `.`           | `SettingBelowFloorError`                              | refusals of the resolver                                         |
| `.`           | `SettingFourEyesError`, `SettingRevisionClosedError`  | refusals of approval                                             |
| `.`           | `PromotionBaseStaleError`                             | refusal of a promotion whose live base moved                     |
| `.`           | `SettingsRules`, `SettingsOptions`, `SettingKey`, ... | types                                                            |
| `./contracts` | `SettingValueStore`, `SettingLayer`, `SettingTarget`  | the store port and its types                                     |
| `./contracts` | `SettingFloorSource`, `SettingRevisionStore`          | the floor and revision ports                                     |
| `./contracts` | `Promotable`, `PromotionDiff`                         | the promotion port every configuration kind implements           |
| `./contracts` | `SettingEnvironment`, `SettingRevisionStatus`, ...    | enums and types of the resolver                                  |
| `./node`      | `StoredSetting`, `StoredSettingService`               | the stored values table                                          |
| `./node`      | `PostgresSettingValueStoreDriver`                     | the server's store                                               |
| `./node`      | `StoredSettingRevision`, `PostgresSettingRevision...` | the revisions table and its store                                |
| `./native`    | `SettingsForm`                                        | the generated page on mobile                                     |
| `./testing`   | `fakeSettings`                                        | a reader over fixed values that records page writes              |

## Declaring a group

```ts
// src/modules/orders/orders.settings.ts
export class OrdersSettings extends Settings({
  scopes: [SettingScope.Platform, TenancyScopes.Tenant],
  navigation: { group: I18n.orders.nav.sales, icon: Icons.Receipt, order: 20 },
}) {
  @Setting({ client: true })
  acceptingOrders = true;

  @Int({ min: 0 })
  @Setting({ scopes: [TenancyScopes.Tenant], approval: true })
  dailyRevenueTargetMinor: number | null = null;

  /** A field typed by a schema class is a section, one level deep; its class holds the defaults. */
  cancellation!: OrderCancellationSettings;

  override rules(r: SettingsRules<OrdersSettings>) {
    return [
      r.atMost("cancellation.autoCancelAfterMinutes", "cancellation.maxAutoCancelAfterMinutes"),
    ];
  }
}
```

- The group key is the module key, carried by the class name (`OrdersSettings` is `orders`); each field is a setting
  named by its path (`orders.cancellation.autoCancelAfterMinutes`).
- `scopes` are level keys, outermost first. Settings names `platform`, `product`, `node` and `user`; tenancy contributes
  its level as data (`TenancyScopes.Tenant`, ADR 0323), and a deployment may declare more (ADR 0327).
- `@Setting({ scopes, lockable, approval, client, live, essential, floor, entitlement, entitlementValues })` narrows one
  field; its scopes must be the class's. `live` marks an operational value edited in place on live (ADR 0359 decision
  5), `essential` shows it in normal mode, `floor` names the market-pack key whose legal floor bounds it.
  `entitlement` names the entitlement that unlocks the field, and `entitlementValues` the one that unlocks a value of
  it (`{ unlimited: "access.enterprise_support" }`), ADR 0420.
- There is no `SettingScope.Tenant`: the tenant level is `TenancyScopes.Tenant` from `@stackra/tenancy` (ADR 0323).
- `rules(r)` is the closed set `lessThan`, `atMost`, `greaterThan`, `atLeast` on number paths. Gen compiles the rules,
  the defaults, the bounds and the sections into the group's schema.
- A credential is never a setting: `@Secret` cannot mark a settings class, gen refuses `secret_in_settings`, and a key
  that names a credential holds a connection's id (`SettingType.Connection`).

## Reading

```ts
const { cancellation } = await this.settings.get(OrdersSettings);
const preferences = await this.settings.get(MessagesSettings, { user: event.customerId });
```

The reader asks the store for the group's layers: the root holder, then each node down the scope path to the target
node (the running scope session's when none is given), then the user's. An inner value wins, except a key a holder
above locked. The merged values are parsed by the class's generated schema, so every unset field reads its default and
the result is an instance of the class. With the floor source gen's wiring binds, a field below its market's legal
floor reads the floor, exactly as `SettingsResolver#get` reads it (ADR 0395).

## The account's language

`AccountSettings` (key `account`, scopes platform and user) holds a person's own preferences on the server. Its
`locale` is the language they chose in an app, one of `@stackra/i18n`'s locale codes, or `null` for no choice (a
native app then follows the phone, the web negotiates). An app's `setLocale` writes it at the user's holder, and the
server's `IdentityResolver` reads it over the identity provider's language for `VerifiedPrincipal.locale`, so emails,
notifications, the web and the person's other devices use the same language (ADR 0080, 2026-10-29 note).

```ts
await store.write("account", { user: session.user.id }, { locale: "ar" });
const { locale } = await this.settings.get(AccountSettings, { user: principal.id });
```

## Floors, provenance and revisions

`SettingsResolver` is the settings-layer resolver: platform floor (from the market pack) below the product default, the
tenant and the user.

```ts
const returns = await this.resolver.get(ReturnsSettings, { scope }); // floored fields lifted
const page = await this.resolver.resolve(SettingsPages.returns, { scope }); // value, source, holder, floor, lock
await this.resolver.write(
  SettingsPages.returns,
  { windowDays: 30 },
  { scope },
  { environment, author },
);
```

- Floors come from `SettingFloorSource`; the OS driver resolves the tenant's market pack and calls `settingFloorsOf`.
  A write that crosses a floor is refused `setting_below_floor`; a stored value or default that crosses a floor (a
  floor rose) reads as the floor, with `source: "floor"`, so the admin can tell the tenant.
- On live, a key that is not `live` is refused `live_read_only` (the core `LiveReadOnlyError`, one field error per path, ADR 0395); it changes in the sandbox and is promoted. A
  break-glass write needs a reason and is recorded as such. A user's own preferences are always live.
- Entitlement gates read through `SettingEntitlementSource` (a deployment binds a driver over its plan or licence; the
  memory driver serves tests). A stored value the plan does not unlock reads as the default with `source:
"entitlement"`; writing it is refused `entitlement_required`. With no source bound, every gate stays shut.
- A write no person makes (a seeder, a seed pack) names `settingSystemAuthor("seed")` (`sys_seed`) as its author.
- Each write is a `SettingRevision`: applied now, `pending` when a key needs `approval` (a second person approves,
  `setting_four_eyes` refuses the author), or `scheduled` for a later `effectiveAt`; the app's scheduler calls
  `applyDue()`.

## Packs and promotion

`SettingsPackService.exportPack(target, groups)` reads what a holder itself stores; `settingsPackToYaml` writes it,
`settingsPackFromYaml` reads and checks one, `diffSettingsPacks` compares two, and `applyPack` makes a holder equal a
pack with one revision per group. `SettingsPromotableDriver` is settings' `Promotable`: `export(sandbox)`,
`diff(live, snapshot)` (with live's content hash) and `apply(live, diff, approver)`, which refuses
`promotion_base_stale` when live moved since the review.

## The stored values

`settings.stored_settings` holds one row per group and holder: `group_key`, a node (`scope_id`, `scope_path` on
`ltree`) or a user (`user_id`), `values` and `locked` (`jsonb`). The read walks the node's ancestors
(`scope_path @> path`), so the table carries no subtree row-level-security policy; a write names its holder and is
refused `settings_locked` for a key a holder above locks.

## Promotion rollback and release

`Promotable.diff(live, next, { release })` records the live snapshot it replaced (`previous`) and the platform release
the sandbox runs; `apply(live, diff, approver, { release })` refuses a live environment on an older release with
`promotion_release_too_old`. `rollbackOf(live, applied)` is a new change set back to `applied.previous`, reviewed and
applied like any other (ADR 0359 decision 8, ADR 0395).

## CLI packs

`stackra settings:diff` and `settings:apply` call `settingsDiff` and `settingsApply` from `./node` in the member's
folder: a YAML pack against a scope node's own values, applied as sandbox revisions with locks checked. `settingsApply`
takes `market`, the holder's resolved market pack; with it, `MarketPackSettingFloorSourceDriver.over(market, clock)` checks the group's
legal floors, and without it a group whose keys carry a legal floor is refused (the run cannot see the holder's market).
Entitlement-gated keys are refused by the runner, which knows no plan. The test helper
`fakeResolver({ values, floors, grants, now })` in `./testing` builds a real resolver over memory drivers and a
settable clock.

## Testing

```ts
const app = await createTestingModule(OrdersModule)
  .override(SettingsReader, fakeSettings([[OrdersSettings, { acceptingOrders: false }]]))
  .compile();
```

`fakeSettings` runs the real cascade and schema over a memory store, and records each form write as
`{ page, scope, values }` in `fake.writes`. `fake.set(OrdersSettings, { acceptingOrders: true })` changes a
class's values mid-test (seeded, not recorded as a write). `fakeResolver({ values, floors, now })` returns a real `SettingsResolver`
with its memory drivers and a clock the test moves (`clock.at = …`).

## Not here

- The generated settings operations (`<module>.settings.get|update|history|revert|approve`) and the settings
  migrator: gen and the settings control plane (ADR 0213). Deploy locks from `runway.yaml`: runway.
- Which market a tenant is in, and the OS `SettingFloorSource` driver: OS tenancy and settings.
- Moving a value stored under a field's old name (`@Renamed`): gen's settings migrator.
- A web settings form and the client store driver that calls the operations.
- `ConnectionRef<C>`, the typed connection reference: `@stackra/integrations` (ADR 0308).
