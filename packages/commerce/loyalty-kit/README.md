# @stackra/loyalty-kit

The golden capability kit (ADR 0259 home A): points accounts, tiers, earning and redemption maths as a module a host
imports, with no product business rule. The template ships the same kit as `@acme/loyalty-kit`; this is its port to the
programming model v3.1 (ADR 0294, 0305) on `@stackra/ledger`.

**Tier:** `tier:lib` (`packages/commerce/loyalty-kit`). Entries `.`, `./contracts`, `./node`, `./react`, `./native`,
`./testing`, and the lang files under `./assets/*`.

## Use

```ts
// services/commerce/package.json: a host lists the package; gen derives the module import
"dependencies": { "@stackra/loyalty-kit": "workspace:*" }

// services/commerce/src/config/loyalty-kit.config.ts: same name, package class aliased
import { LoyaltyKitConfig as BaseLoyaltyKitConfig } from "@stackra/loyalty-kit";

export class LoyaltyKitConfig extends BaseLoyaltyKitConfig {
  override maxRedeemPercent = 30;
}

// the one earn path
await accounts.earn(memberId(event.customerId), { amountMinor, currency, reference: event.orderId });

// spending points on a purchase: hold in the purchase's transaction, settle once it exists, release if it ends unpaid
await loyalty.hold(member, points, orderId, at); // InsufficientPointsError if uncovered
await loyalty.settle(member, orderId, at);
await loyalty.release(member, orderId, at);

// the host's one obligation: the members port's only driver
export class CommerceLoyaltyMembersDriver extends Driver(LoyaltyMembers) { … }
```

A hold is one covered debit (`LoyaltyLedger#debit`): the balance check and the write are one step per member, so two
concurrent purchases never spend the same points. Settling is balance-neutral (a `redeem` entry plus the `release` that
offsets the hold), so settle and release commute: the points come back exactly once, in either order.

## Entries

| Entry         | Holds                                                                                                                                                                                                                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.`           | `LoyaltyKitConfig`, `LoyaltyKitOptions`, `LoyaltyKitConfig$`, `LoyaltyService`, `MemoryLoyaltyLedgerDriver`, the four refusals, `BalanceView`, `LoyaltyAccountView`, `PointsIssuedView`, the reference constants, `memberId`, `isExpiringSoon`                                                      |
| `./contracts` | the ports `LoyaltyLedger` and `LoyaltyMembers`, the enums `DebitOutcome`, `EntryKind`, `LoyaltyTier`, the types `PointsEntry`, `MemberId`, `EarnDraft`, `EarnRequest`, `RedemptionQuote`                                                                                                            |
| `./node`      | `LoyaltyKitModule`, `LoyaltyKitSettings`, the enroll, freeze and expire actions, the balance and points-issued queries, their schemas, the events and the v1 change, the extension point and tier extension, the listener, the models, the services, `PostgresLoyaltyLedgerDriver`, both migrations |
| `./react`     | `PointsBalance`, `PointsIssued` and their Props                                                                                                                                                                                                                                                     |
| `./native`    | `PointsBalance` and its Props (the web Props, field for field)                                                                                                                                                                                                                                      |
| `./testing`   | `LoyaltyMembersFake.with()`, `pointsEntry`, `toHaveBalance`, `LoyaltyAccountFactory`, `LedgerEntryFactory`, `LoyaltyKitDemoSeeder` and its `ids`                                                                                                                                                    |

## The ledger and the floor

The Postgres driver keeps the points in `Journal<LedgerEntry>` (`@stackra/ledger`). `LedgerEntry` carries
`@Journaled({ account: "memberId", amount: "points", floor: 0 })`, and every driver call states its floor:

- `append` lifts it (`floor: null`): the port's plain append, used for credits, a settle's redeem line and releases.
- `debit` keeps zero (`floor: 0`): a covered debit under the member's account lock; `belowFloor` is `uncovered`.
- `expire` reverses stale earns in one locked `reverseWhere` with `floor: 0`: each expiry is cut so the balance stops at
  zero, oldest earn first, and a cut-to-nothing expiry is still written so a repeat takes nothing more.

The memory driver keeps the same contract in one turn of the event loop.

## How this port differs from the template sample

- **The expiry floor (the recorded defect):** the sample's `expire()` reversed every stale earn in full, so points
  spent since could take a balance negative; both drivers now cut each expiry at zero (above).
- **Postgres `append` states `floor: null`:** with the model's default floor of zero, a settle's redeem line would
  otherwise be refused after the points were spent elsewhere, and the following release would credit points back.
- **Not here yet, waiting on unbuilt packages:** `LoyaltyAccountPermissions`, `LoyaltyAccountPolicy` and the actions'
  `permission:` option (`@stackra/iam`, so permissions are derived from the keys meanwhile); `RedeemPointsWorkflow`,
  `RedemptionConfirmed`, `RedeemPointsAction`, `ConfirmRedemptionAction`, `RedeemPointsOutput`,
  `ConfirmRedemptionInput`, `ConfirmRedemptionOutput` and `QuotedRedemption` (`@stackra/workflow`);
  `LoyaltyAccountResource`, `LoyaltyOverviewDocument`, `PointsBalanceWidget`, `PointsIssuedWidget` (`@stackra/panel`).
- **Gen stand-ins:** each schema, event and the settings group registers its zod schema in its own file; the config
  ships `LoyaltyKitConfig$` (the name the commerce host's generated schemas import; the sample's entry called it
  `LoyaltyKitOptions$`), and no other `X$`; the driver names augment `DriverRegistry` by hand; `Queues.Maintenance` is
  not available, so the expire job runs on the default queue; `LoyaltyAccountOperations` is gen's.
- **Renderers:** function components on `@stackra/ui` (`Card`, `Chip`, `Text`), because the class-component compiler,
  `#stackra/ui` and a `Stat` component do not exist yet; i18n keys come from an internal `keys()` tree.
- **Scope:** the tables stay owned through tenancy's `BelongsToTenant` and `t.belongsToTenant()`, and the settings
  level is `TenancyScopes.Tenant` instead of `SettingScope.Tenant` (ADR 0323 d1 and d4); no `tenant` identifier is
  declared here.
- **Balance query:** the next expiry is read from the member's own entry rows (the oldest earn not yet expired), not the
  account's `entries` relation, which journal rows leave empty until the backfill; it keeps the earn's time of day.
  `LoyaltyAccount` drops that inverse `entries` collection (nothing reads it now, and it made the two models import
  each other); `LedgerEntry.account` still points at the account, which is all `Factory.has` needs.
- **Smaller fixes:** `@Int()` is called (the sample wrote `@Int` bare); dependencies are fields assigned in the
  constructor (no parameter properties, for `erasableSyntaxOnly`); ports declare their `~key`; the model declares its
  three filter indexes with `@Index`; `PointsIssuedQuery` never reports `-0`; the demo ids are lowercase, as minted ids
  are; the settings' silver-below-gold rule is checked by the stand-in schema.
- **Tests:** unit tests construct each class with fakes, because the gen-written wiring the sample's
  `createTestingModule(LoyaltyKitModule)` tests need does not exist yet; the Postgres, outbox and workflow integration
  tests and the manifest contract test wait for those drivers and for gen.
