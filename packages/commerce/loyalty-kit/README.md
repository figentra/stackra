<!--
Stackra file contract:
Purpose: the README of @stackra/loyalty-kit: what the kit does, how a host uses it, its entries and drivers.
Boundary: documentation only; the rules for agents are in AGENTS.md.
Runtime: none (Markdown)
Governing contract: ADR 0294, ADR 0305; ADR 0348 (decision 5: wallet passes); ADR 0454; STA-804 (members over OS
                    parties); STA-1323.
-->

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
  override ledger = "memory" as const; // config is deploy-time only: the ledger driver
}

// the one earn path
await accounts.earn(memberId(event.customerId), { amount: event.total, reference: event.orderId });

// a refund takes points back (never below zero); a migration imports a balance from another platform
await accounts.takeBack(member, 120, refund.id); // the points taken; the rest was already spent
await accounts.importBalance(member, { points: 1_250, reference: `${run.id}:${row.id}`, tier: LoyaltyTier.Silver });

// a quote converts and caps at the scope's settings
const quote = await loyalty.quote(member, requested, total, await settings.get(LoyaltyKitSettings));

// spending points on a purchase: hold in the purchase's transaction, settle once it exists, release if it ends unpaid
await loyalty.hold(member, points, orderId, at); // InsufficientPointsError if uncovered
await loyalty.settle(member, orderId, at);
await loyalty.release(member, orderId, at);

// the host's one obligation: the members port's only driver; an OS host subclasses the parties one with its client
export class OsLoyaltyMembersDriver extends PartiesLoyaltyMembersDriver {
  protected override readonly parties: PartiesClient;

  constructor(parties: PartiesClient) {
    super();
    this.parties = parties;
  }
}
```

A host that wants an undoable redemption instead calls the actions:

```ts
// spend points against an order; the call answers with the debit and the balance after it (Idempotency-Key required)
await pipeline.execute(
  RedeemPointsAction,
  { points: 300, reference: orderId, totalMinor },
  { actor },
);
// the order went through: keep the debit (otherwise it is credited back after 15 minutes)
await pipeline.execute(ConfirmRedemptionAction, { reference: orderId }, { actor });
```

A hold is one covered debit (`LoyaltyLedger#debit`): the balance check and the write are one step per member, so two
concurrent purchases never spend the same points. Settling is balance-neutral (a `redeem` entry plus the `release` that
offsets the hold), so settle and release commute: the points come back exactly once, in either order.

## Entries

| Entry         | Holds                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.`           | `LoyaltyKitConfig`, `LoyaltyKitOptions`, `LoyaltyKitConfig$`, `LoyaltyService`, `MemoryLoyaltyLedgerDriver`, the four refusals, `BalanceView`, `LoyaltyAccountView`, `PointsIssuedView`, the reference constants (hold, settle, release, expire, revert, take-back, import), `memberId`, `isExpiringSoon`                                                                                                                                                                                                                                                                                                                                                                         |
| `./contracts` | the ports `LoyaltyLedger`, `LoyaltyMembers` and `LoyaltyTierPolicy`, the enums `DebitOutcome`, `EntryKind`, `LoyaltyTier`, the types `PointsEntry`, `MemberId`, `EarnDraft`, `EarnRequest`, `PointsImport`, `RedemptionQuote`, `RedemptionRates`, `TierDraft`                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `./node`      | `LoyaltyKitModule`, `LoyaltyKitSettings`, `LoyaltyAccountPermissions`, `LoyaltyAccountPolicy`, the enroll, freeze, expire, redeem and confirm-redemption actions, the balance and points-issued queries, their schemas and `QuotedRedemption`, `RedeemPointsWorkflow` and `RedemptionConfirmed`, the events and the v1 change, the extension point and tier extension, the listener, the models, `LoyaltyAccountResource`, `LoyaltyOverviewDocument`, `PointsBalanceWidget`, `PointsIssuedWidget`, the services, `PostgresLoyaltyLedgerDriver`, `ThresholdLoyaltyTierPolicyDriver`, `PartiesLoyaltyMembersDriver`, `LoyaltyCardPass` and `LoyaltyCardPassSource`, both migrations |
| `./react`     | `PointsBalance`, `PointsIssued` and their Props                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `./native`    | `PointsBalance` and its Props (the web Props, field for field)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `./testing`   | `LoyaltyMembersFake.with()`, `pointsEntry`, `toHaveBalance`, `LoyaltyAccountFactory`, `LedgerEntryFactory`, `LoyaltyKitDemoSeeder` and its `ids`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

`TierMultiplierExtension` extends `Extension<Slot>({ order })` directly: the called form returns the exported
`ExtensionClass<Slot>`, so the `./node` declarations name no internal class (STA-1220).

## The ledger and the floor

The Postgres driver keeps the points in `Journal<LedgerEntry>` (`@stackra/ledger/node`). `LedgerEntry` carries
`@Journaled({ account: "memberId", amount: "points", floor: 0 })`, and every driver call states its floor:

- `append` lifts it (`floor: null`): the port's plain append, used for credits, a settle's redeem line and releases.
- `debit` keeps zero (`floor: 0`): a covered debit under the member's account lock; `belowFloor` is `uncovered`.
- `expire` reverses stale earns in one locked `reverseWhere` with `floor: 0`: each expiry is cut so the balance stops at
  zero, oldest earn first, and a cut-to-nothing expiry is still written so a repeat takes nothing more.

The memory driver keeps the same contract in one turn of the event loop.

## Stamp cards: earning by visit count

A stamp card counts visits, not money. `EarnVisitAction` (`loyalty_kit.points.earn_visit@1`, `POST /loyalty/visits`,
permission `LoyaltyAccountPermissions.stamp`, staff and services only) stamps a member's card for one visit through
`AccountService.earnVisit`: one ledger entry per visit reference, no spend rate and no tier multiplier.

```ts
await pipeline.execute(
  EarnVisitAction,
  { principalId, reference: appointment.id },
  { actor: service },
);
// { stamps: 1, onCard: 4, perCard: 10, fullCards: 0 }
stampCardProgress(balance, settings.stampsPerCard); // the renderers' card
```

- The stamp count and the card size are settings (`loyalty_kit.stampsPerVisit`, `loyalty_kit.stampsPerCard`), and
  which visits earn a stamp is the host's earn rule set (`rule-set:commerce:loyalty-earn`); nothing is fixed in code.
- A full card is a reward redeemed through the ordinary redemption path.
- Loyalty points stay on this kit, not on a payments-ledger account kind (conflict 6 of the package-needs table).

## Programme, earn rate, tiers and balance events (ADR 0454)

- **Programme:** the `LoyaltyKitSettings` group resolved at a scope is that scope's programme; a per-brand programme is a
  scope level below the tenant the host contributes. `isActive` (default on) pauses it: a paused programme earns,
  stamps and enrolls nothing, while redemption and expiry go on.
- **Earn rate, point value and cap:** settings, all three approval-required member benefits:
  `loyalty_kit.earnPerMinor` (default `0.01`), `loyalty_kit.pointValueMinor` (default `1`) and
  `loyalty_kit.maxRedeemPercent` (default `50`, 0 to 100). Config holds none of them (STA-1323). `LoyaltyService` stays
  isomorphic by taking them as arguments: `quoteEarn(amountMinor, earnPerMinor)`, `pointsFor(amountMinor,
pointValueMinor)` and `quote(member, requested, total, rates)` (`total` and the quote's `amount` are `@stackra/money`
MoneyAmounts; the stored redeem input keeps `totalMinor` and the workflow adds the run's currency); a resolved settings group is a `RedemptionRates`
  as it is. `AccountService.earn` and `RedeemPointsWorkflow` read them per call.
- **Tiers:** `RecalculateTierListener` asks the `LoyaltyTierPolicy` port which tier an earn earns and only ever raises
  one. The kit's driver, `threshold`, reads `loyalty_kit.tiers`; a host applies its own tier rules with
  `@Replaces(LoyaltyTierPolicy)`.
- **Events:** every balance move leaves through the outbox: `loyalty_kit.points.earned.v2`,
  `loyalty_kit.points.redeemed.v1` (was a private domain event; now carries `balanceAfter`) and
  `loyalty_kit.points.expired.v1` (one per account whose expiry took points), `loyalty_kit.points.taken_back.v1` and
  `loyalty_kit.points.imported.v1`. Keys follow the casing rules: the module key is the package key, `loyalty_kit`.

## Take-backs and imported balances (STA-1323)

- **`AccountService.takeBack(member, points, reference)`**: a refund or cancellation takes points back as one covered
  `adjust` debit under `take_back:<reference>`, cut at the balance: what the member already spent is the event's
  `shortfall`, never a negative balance. Once per reference; a take-back that found nothing still marks the reference,
  so a retry never takes points earned since. Records `points.taken_back` when it took any. A host no longer appends
  `adjust` entries itself.
- **`AccountService.importBalance(member, { points, reference, tier? })`**: a balance carried over from another
  platform is one `earn` entry of the exact points under `import:<reference>` (no earn rate, no extension; it expires
  like any earn, counted from the import). It enrolls at the import's tier, raises an existing tier to it (never
  lowers), and records `points.imported`, not `points.earned`, so the tier listener does not run. A paused programme
  still imports; a frozen account is refused. The entry kind stays `earn`: a kind of its own would need a migration of
  the kind column and a second kind in every driver's expiry, for no behaviour the reference prefix does not give.

## The loyalty card wallet pass (ADR 0348 decision 5)

`LoyaltyCardPass` (`Pass({ key: "loyalty_card" })`, in `src/node/integrations/`) builds the pass content of one account
from a `LoyaltyCardPassSource`: the programme name as title, the balance and the tier as fields, the account id
(`lac_…`) as serial and QR code, and the scope's brand-kit colours and logo. The member id never goes on a pass. Labels
and the tier are lang keys (`loyalty_kit::passes.loyalty_card.*`, `loyalty_kit::enums.loyalty_tier.*`, in all seven
locales); the host passes their text as `labels` to a `WalletPassIssuer` of `@stackra/integrations/node`, which signs
an Apple `.pkpass` or writes a Google Wallet object:

```ts
const content = new LoyaltyCardPass().content({ accountId, programName, tier, balance, brand });
const { file } = await apple.issue({
  kind: "loyalty_card",
  content,
  labels,
  locale,
  issuedAt: ctx.now(),
  images,
});
```

Re-issuing a pass when the balance changes, device push and revocation are not built yet (STA-791).

## Members over the OS parties service (STA-804)

`LoyaltyMembers` answers who may redeem. `PartiesLoyaltyMembersDriver` (`./node`, driver name `parties`) answers it
from the OS parties service: the member id is the person's public id, read with `parties.person.get@1`; a live person
is a member, while an unknown (`not_found`), merged-away or erased one is not. Any other failure (the service down, a
forbidden call) throws, so a redemption fails closed.

The class is abstract: the generated `PartiesClient` lives in the host (`#stackra/clients/parties`) and a package never
imports it, so an OS host subclasses the driver in its own `drivers/` folder and passes its client (see Use). The
driver types the client by the one call it makes, so no OS package is a dependency. A host outside the OS writes its
own driver as before. Not built: linking a principal to a person (parties has no lookup by `principalId` yet) and a
membership tag; today every live person is a member.

## Access, redemption and the panel

- **Access:** `LoyaltyAccountPermissions` declares `read` (L0), `enroll` (L1), `freeze` (L2), `redeem` (L1) and
  `expire` (L2, system: only the platform holds it). The kit's keys name `account` and `points`, not the model, so every
  action and query names its permission. `LoyaltyAccountPolicy` refines `read`, `redeem` and `freeze` per record: a
  customer subject (`actor.onBehalfOf ?? actor`) reads and redeems only their own account, nobody redeems from a frozen
  one, and a deleted account is never frozen.
- **Redemption:** `RedeemPointsAction` (idempotency required, 30 a minute, `POST /loyalty/redemptions`) runs
  `RedeemPointsWorkflow`: `quote` (the `redeemVerify` slot, then membership and balance), `debit` (one covered debit,
  recording `points.redeemed.v1`) and `confirm`, which parks the run for `RedemptionConfirmed` correlated on member and
  reference, for fifteen minutes. The engine answers the call as soon as the run parks, with the debit and the balance
  after it. `ConfirmRedemptionAction` (`PUT /loyalty/redemptions/:reference/confirm`) sends the signal for the actor's
  member; without it the wait times out, `undoDebit` credits the points back once under `revert:<reference>`, and the
  run ends `compensated` with `workflow_timed_out`.
- **Panel:** `LoyaltyAccountResource` is the admin list, View page, enrol form and bulk Freeze; `LoyaltyOverviewDocument`
  is the app-area "My points" dashboard at `/loyalty`; `PointsBalanceWidget` is unplaced (a document or a host's
  `Widget.place` puts it) and bound to the signed-in member's account; `PointsIssuedWidget` sits on the dashboard's
  main grid for owners and managers. Both widgets draw with the kit's `PointsBalance` and `PointsIssued` renderers.

## How this port differs from the template sample

- **The expiry floor (the recorded defect):** the sample's `expire()` reversed every stale earn in full, so points
  spent since could take a balance negative; both drivers now cut each expiry at zero (above).
- **Postgres `append` states `floor: null`:** with the model's default floor of zero, a settle's redeem line would
  otherwise be refused after the points were spent elsewhere, and the following release would credit points back.
- **A redemption that times out:** the sample's integration test expected the redeem call to refuse with
  `workflow_timed_out`. The engine answers the call when the run parks on the confirmation, so the call returns the
  debit and the timeout shows only on the run (`quote:done`, `debit:compensated`, `confirm:timed_out`) and the balance.
- **The policy's subject** is `actor.onBehalfOf ?? actor` (the sample read `actor`), so a service or an agent acting for
  a customer is held to that customer; the undo's reference prefix is the exported `REVERT_REFERENCE_PREFIX`.
- **`perScope`:** the expire job's cron says `perScope: true` (the actions option was renamed from `perTenant`, R-59);
  the sample still writes `perTenant`.
- **Panel stand-ins:** the navigation group, the icon and the dashboard slot come from internal typed constants
  (`LOYALTY_KIT_KEYS.loyalty_kit.nav.loyalty`, `LOYALTY_KIT_ICONS.Star`, `LOYALTY_KIT_SLOTS.Dashboard.Main`) instead of
  gen's `I18n`, `Icons` and `Slots`, so no raw string sits in those positions (R-56); the slots the overview document
  publishes are gen's and not declared here.
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
- **Smaller fixes:** point fields carry `@Int({ min: 0 })` (the sample wrote `@Int` bare, which does not typecheck, and an empty
  call is refused by `no-empty-decorator`); dependencies are fields assigned in the
  constructor (no parameter properties, for `erasableSyntaxOnly`); ports declare their `~key`; the model declares its
  three filter indexes with `@Index`; `PointsIssuedQuery` never reports `-0`; the demo ids are lowercase, as minted ids
  are; the settings' silver-below-gold rule is checked by the stand-in schema.
- **Tests:** unit tests construct each class with fakes, because the gen-written wiring the sample's
  `createTestingModule(LoyaltyKitModule)` tests need does not exist yet (the policy test constructs the policy; the
  workflow test drives the native engine on the memory journal directly); the Postgres and outbox integration tests,
  the workflow's Postgres run and the manifest contract test wait for those drivers and for gen.
