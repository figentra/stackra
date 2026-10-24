# @stackra/settings

Stackra settings: the runtime values a module exposes to its admins and users, resolved per scope (ADR 0307 rules 22
to 24, ADR 0213). A module declares one settings class, code reads the resolved group with `SettingsReader#get`, and gen
writes the settings page, the operations, the permissions and the labels from the class. Settings are runtime values
per scope; deploy-time values are configuration (`@stackra/config`). A setting is never a secret.

**Tier:** `tier:lib` (`packages/state/settings`). Entries `.`, `./contracts`, `./node`, `./native` and `./testing`.
Depends on `@stackra/container`, `@stackra/contracts`, `@stackra/database`, `@stackra/errors`, `@stackra/i18n`,
`@stackra/icons`, `@stackra/model`, `@stackra/ui` and `@stackra/validation`.

## What is here

| Entry         | Symbol                                                | Use                                                              |
| ------------- | ----------------------------------------------------- | ---------------------------------------------------------------- |
| `.`           | `Settings`, `Setting`                                 | the kind base of a module's group and the field decorator        |
| `.`           | `SettingScope`, `SettingType`                         | the levels settings names, and the type of a generated key       |
| `.`           | `SettingsReader`                                      | `get(Class)`, and `read(page)` / `write(page, values)` for forms |
| `.`           | `MemorySettingValueStoreDriver`                       | a store in memory (tests, local runs, a client)                  |
| `.`           | `settingKeys`, `settingsPage`                         | what a member's generated `#stackra/settings` is built with      |
| `.`           | `SettingsLockedError`, `SettingValueInvalidError`     | refusals                                                         |
| `.`           | `SettingsRules`, `SettingsOptions`, `SettingKey`, ... | types                                                            |
| `./contracts` | `SettingValueStore`, `SettingLayer`, `SettingTarget`  | the store port and its types                                     |
| `./node`      | `StoredSetting`, `StoredSettingService`               | the stored values table                                          |
| `./node`      | `PostgresSettingValueStoreDriver`                     | the server's store                                               |
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
- `@Setting({ scopes, lockable, approval, client })` narrows one field; its scopes must be the class's.
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
the result is an instance of the class.

## The stored values

`settings.stored_settings` holds one row per group and holder: `group_key`, a node (`scope_id`, `scope_path` on
`ltree`) or a user (`user_id`), `values` and `locked` (`jsonb`). The read walks the node's ancestors
(`scope_path @> path`), so the table carries no subtree row-level-security policy; a write names its holder and is
refused `settings_locked` for a key a holder above locks.

## Testing

```ts
const app = await createTestingModule(OrdersModule)
  .override(SettingsReader, fakeSettings([[OrdersSettings, { acceptingOrders: false }]]))
  .compile();
```

`fakeSettings` runs the real cascade and schema over a memory store, and records each form write as
`{ page, scope, values }` in `fake.writes`.

## Not here

- The generated settings operations (`<module>.settings.get|update|history|revert|approve`), revisions, approvals,
  YAML packs and the settings migrator: gen and the settings control plane (ADR 0213).
- Moving a value stored under a field's old name (`@Renamed`): gen's settings migrator.
- A web settings form and the client store driver that calls the operations.
- `ConnectionRef<C>`, the typed connection reference: `@stackra/integrations` (ADR 0308).
