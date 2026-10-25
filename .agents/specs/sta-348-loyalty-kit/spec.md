# Feature Specification: `@stackra/loyalty-kit` wave 6, the golden capability kit on the ledger

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/loyalty-kit` (commerce, wave 6, registry row "Golden capability kit (template ships it as
`@acme/loyalty-kit`)"), porting the template's `@acme/loyalty-kit` to the v3.1 shape on `@stackra/ledger`: points
accounts, tiers, earning and redemption maths behind the `LoyaltyLedger` and `LoyaltyMembers` ports, memory and
Postgres ledger drivers, the module's actions, queries, events, extension point, listener, settings, models and
migrations, web and native renderers, and the testing fake, fixture and matcher. The recorded defect that `expire()`
has no floor is fixed with the ledger's floor.

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's commerce service and console adopt it once converted, STA-344)
- **Packages touched**: `packages/commerce/loyalty-kit` (new member)
- **Cross-service events**: `loyalty_kit.account.enrolled.v1`, `loyalty_kit.account.frozen.v1` and
  `loyalty_kit.points.earned.v2` (with its v1 change until 2027-04-01) leave through a host's outbox
- **Tenancy and data**: two tables in the `loyalty_kit` schema, `loyalty_accounts` and `ledger_entries`, owned through
  @stackra/tenancy's `BelongsToTenant` and `t.belongsToTenant()` (forced equality policy), which ADR 0323 d1 allows;
  no `tenant` identifier is declared here (R-59); member ids are pseudonymous public ids
- **Secrets**: none
- **ADR needed**: no (ADR 0220, 0259, 0265, 0266, 0294, 0305, 0321 and 0323 decide it)
- **New dependencies**: none outside the workspace and the catalogs; runtime edges to actions, config, container,
  contracts, database, errors, events, i18n, ledger, model, search, settings, tenancy, ui, validation and versioning,
  and `zod` from the default catalog
- **Deploy modes**: same code in all
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/commerce/loyalty-kit/README.md`, `packages/commerce/loyalty-kit/AGENTS.md`; no ADR is amended
- **Lane**: lite
- **Change risk**: R2 (points are a liability: a defect overdraws or double-credits a balance)

## Clarifications

### Session 2026-10-25

The package follows the template sample, the v3.1 registry row and the owner decisions of 2026-10-24 (programming
model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- The Postgres driver keeps the ledger in `Journal<LedgerEntry>`; the model's `@Journaled` facet maps `memberId` and
  `points` and declares the floor 0. `append` lifts the floor (`floor: null`, the port's plain append), `debit` keeps
  it (`floor: 0`), and `expire` reverses stale earns with `floor: 0`, so an earn whose points were spent expires only
  what is left and no balance goes negative (the recorded defect)
- The memory driver cuts each expiry the same way, oldest earn first, in one turn of the event loop
- ADR 0323 d1: tenancy's trait, macro and `TenancyScopes.Tenant` settings level are used, never redeclared
- `@stackra/iam`, `@stackra/workflow` and `@stackra/panel` are not built yet, so their kinds wait (see Open items); the
  actions keep their keys, so their permissions are derived until the `LoyaltyAccountPermissions` statics exist
- Gen is not here yet (STA-339): each schema, event and the settings group registers its zod schema in its own file,
  the driver names augment `DriverRegistry` by hand, and the renderers' i18n keys come from `keys()`
- The renderers are function components on `@stackra/ui` (Card, Text, Chip), because the class-component compiler and
  `#stackra/ui` are not built and `@stackra/ui` has no `Stat`

## User Scenarios & Testing

### User Story 1 - Credit a purchase once (Priority: P1)

A host calls `AccountService.earn(memberId(...), { amountMinor, currency, reference })`; the first earn enrolls the
member, the tier multiplier applies, the credit is idempotent per reference and `points.earned` v2 is recorded.

**Independent Test**: `src/node/services/__tests__/account.service.test.ts`,
`src/node/extensions/__tests__/tier-multiplier.extension.test.ts`.

**Acceptance Scenarios**:

1. **Given** a member never enrolled, **When** a purchase is credited, **Then** an account exists at bronze and the
   points are appended once.
2. **Given** a frozen account, **When** a purchase is credited, **Then** `account_frozen` is refused before anything is
   appended.

### User Story 2 - Spend points without overdrawing (Priority: P1)

A host holds points for an order, settles them once the order exists, or releases them when it ends unpaid.

**Independent Test**: `src/core/services/__tests__/loyalty.service.test.ts`,
`src/core/drivers/__tests__/memory-loyalty-ledger.driver.test.ts`,
`src/node/drivers/__tests__/postgres-loyalty-ledger.driver.test.ts`.

**Acceptance Scenarios**:

1. **Given** a balance of 100, **When** two holds of 100 start together, **Then** one is written and the other refused
   with `insufficient_points`.
2. **Given** a settled or released hold, **When** release or settle runs again, **Then** the points come back exactly
   once.

### User Story 3 - Expire stale points, never below zero (Priority: P1)

The nightly job expires earns older than the window; an earn whose points were spent expires only what is left.

**Independent Test**: `src/node/actions/__tests__/expire-points.action.test.ts`,
`src/core/drivers/__tests__/memory-loyalty-ledger.driver.test.ts`,
`src/node/drivers/__tests__/postgres-loyalty-ledger.driver.test.ts`.

### User Story 4 - Read a balance and see it rendered (Priority: P2)

A member reads their balance, tier and next expiry; the web and native renderers warn when points expire within thirty
days.

**Independent Test**: `src/node/queries/__tests__/get-balance.query.test.ts`,
`src/react/points-balance/__tests__/points-balance.test.tsx`,
`src/native/points-balance/__tests__/points-balance.test.tsx`.

### User Story 5 - Test a host against the kit (Priority: P2)

A host test overrides `LoyaltyMembers` with `LoyaltyMembersFake.with([...])`, builds entries with `pointsEntry` and
asserts with `toHaveBalance`.

**Independent Test**: `src/testing/__tests__/loyalty-members.fake.test.ts`,
`src/testing/__tests__/to-have-balance.matcher.test.ts`.

### Edge Cases

- A repeated earn reference: nothing written, zero returned, no event.
- A sub-point purchase: zero points, nothing appended.
- An expiry repeated with the same cutoff: nothing more expired.
- A stale earn on a zero balance: its expiry is written with zero points, so it is never taken later.
- A redemption by a non-member: `not_a_member`.
- A customer enrolling someone else: `not_own_principal`.

## Requirements

- **FR-001**: The package SHALL be `@stackra/loyalty-kit` at `packages/commerce/loyalty-kit`, `tier:lib`, entries `.`,
  `./contracts`, `./node`, `./react`, `./native` and `./testing`.
- **FR-002**: `./contracts` SHALL hold the `LoyaltyLedger` and `LoyaltyMembers` ports, the `DebitOutcome`, `EntryKind`
  and `LoyaltyTier` enums and the entry, earn, quote and member-id types.
- **FR-003**: `LoyaltyService` SHALL quote redemptions capped by balance and `maxRedeemPercent`, quote the base earn,
  and hold, settle and release points as covered debits that give held points back exactly once.
- **FR-004**: Every ledger driver SHALL append once per (member, reference), make a covered debit's check and write one
  step per member, and expire stale earns once each, cut so the balance never goes below zero.
- **FR-005**: `AccountService` SHALL be the one earn path: enroll on first earn, refuse a frozen account, run the
  `earnAdjust` slot, append and record `points.earned` v2.
- **FR-006**: The module SHALL ship the enroll, freeze and expire actions, the balance and points-issued queries, the
  events with the v1 change, the extension point and the tier extension, the tier listener, the settings group and the
  reconciler service.
- **FR-007**: The models and both migrations SHALL state every column's nullability and comment, own the rows through
  tenancy's trait and macro, and keep one entry per (scope, member, reference) and one live account per member.
- **FR-008**: `./react` and `./native` SHALL render the points balance with the thirty-day expiry warning, and `./react`
  the points issued today.
- **FR-009**: `./testing` SHALL ship `LoyaltyMembersFake`, `pointsEntry`, `toHaveBalance`, both model factories and the
  demo seeder with its ids.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package and the validator reports nothing for it (owner mode: no
  typecheck here).

## Open items (for the owner, not blocking)

- Waiting on `@stackra/iam`: `LoyaltyAccountPermissions`, `LoyaltyAccountPolicy` and the `permission:` option of the
  actions and queries (so `ctx.authorize(account)` refines the derived permissions until then).
- Waiting on `@stackra/workflow`: `RedeemPointsWorkflow`, `RedemptionConfirmed`, `RedeemPointsAction`,
  `ConfirmRedemptionAction` and their schemas (`RedeemPointsOutput`, `ConfirmRedemptionInput`,
  `ConfirmRedemptionOutput`, `QuotedRedemption`); `RedeemPointsInput` ships because the `redeemVerify` slot takes it.
- Waiting on `@stackra/panel`: `LoyaltyAccountResource`, `LoyaltyOverviewDocument`, `PointsBalanceWidget`,
  `PointsIssuedWidget`.
- Waiting on gen (STA-339): `Queues.Maintenance` (the expire job runs on the default queue), the generated `X$`
  schema exports, `LoyaltyAccountOperations`, the class-component compiler and `#stackra/ui`, `#stackra/i18n`.
- The template's manifest contract test and committed `stackra.manifest.json` wait for gen.
- The Postgres, outbox and workflow integration tests of the sample run with the testing workflow once those drivers
  exist.

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · spec for a package written in owner mode (develop now, test later)
