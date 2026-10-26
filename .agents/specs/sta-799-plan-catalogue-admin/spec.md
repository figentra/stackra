# Feature Specification: plan-catalogue admin, the Stackra side

**Feature Branch**: `figentra/sta-666-wave11`, console in `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-799

**Clarifications status**: complete

**Input**: Admin records for tiers, seat kinds, modules, limits, trials, offers, price lists per regional tier and
currency, fee schedules and rate cards; dated versions; changes at renewal (OS-82); a second approver for discounts
(OS-381); everything seeded from `seed-pack:<product>`.

## Impact

- **Apps touched**: none
- **Services touched**: none (OS billing owns the server driver, the actions and the console resources)
- **Packages touched**: packages/security/entitlements, packages/commerce/pricing
- **Cross-service events**: none
- **Tenancy and data**: catalogue records are platform data; no tenant data
- **Secrets**: none
- **ADR needed**: yes, 0391 (Proposed)
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** `PlanCatalogueService` stores dated versions of every record kind behind the `CatalogueVersions` port.
- **FR-002** `versionInForce` gives the approved version at a term's start, so a change reaches a subscriber at renewal;
  a backdated change is refused.
- **FR-003** A discount (`isCatalogueDiscount`) waits for an approver other than its proposer.
- **FR-004** `seed` stores each seed-pack record once as approved version 1.
- **FR-005** Readers: `planCatalogueOf` and `tierPlan` (entitlements); `planPriceListsOf`, `planPrice`, `offerOf`,
  `rateCardOf` and `meterCharge` (pricing). Fee schedules reuse `@stackra/registry`'s `FeeSchedule`.

## Console (wave 12)

- **FR-006** `@stackra/panel/react` ships the plan-catalogue admin: `PlanCatalogueAdmin` (one record: the version in
  force, the history, the proposal form), `CatalogueVersions` (state, in-force mark, discount mark, approve and reject
  with the second-approver rule from `catalogueDecisionOf`), `CatalogueRowsEditor` (every record kind as fields by
  value type, so tiers, seat kinds, modules, limits, trials and price lists are all data) and `CatalogueProposalForm`
  (effective from tomorrow at the earliest in the tenant's zone, discount detected by `isCatalogueDiscount` and not
  removable, the kind's reader run by `catalogueRowsError` before proposing).
- Words in `panel::plan_catalogue.*` in the seven languages. New panel dependencies: `@stackra/entitlements`,
  `@stackra/pricing`, `@internationalized/date` (lockfile not updated here).

## Not built here

- The OS billing server driver of `CatalogueVersions` and the actions the console handlers call (they live in the OS
  billing service, outside this package set); the console app mounts `PlanCatalogueAdmin` per record.
- `fee-schedule` and `rate-card` are not yet seed-record kinds of `@stackra/cli`.
- Tests, typecheck and build are written but not run (owner mode).
