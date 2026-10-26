# Feature Specification: perks and offers (perk listings, offer benefits, stacking)

**Feature Branch**: `figentra/sta-666-wave11`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-800

**Clarifications status**: complete

**Input**: A `perk` listing role (no install; redemption by code, link or lead; eligibility by pack and product; a
listing fee), offer `benefits[]`, the startup-perk eligibility rule set with an editable incubator list, and
`rule-set:os:offer-stacking`.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/application/registry, packages/commerce/pricing
- **Cross-service events**: none
- **Tenancy and data**: a lead redemption carries the tenant admin's contact details, only after consent
- **Secrets**: none
- **ADR needed**: yes, 0393 (Proposed)
- **New dependencies**: none (`@stackra/rules` is used by OS billing, not imported here)
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** `ListingRole.Perk`, `PerkListing`, `perkEligible`, `redeemPerk` and `perkListingFee` in the registry.
- **FR-002** `offerOf`, `offerEligible` and `applyOffers` in pricing read and apply the four benefit kinds.
- **FR-003** `stackOffers` applies what the stacking rule set lets stack plus the best single other offer, and reports
  the refused ones.
- **FR-004** Seeds: `assets/data/rule-sets/os-offers.yaml` (startup eligibility and offer stacking, `RuleSetPack$`
  shape) and `assets/data/settings/startup-incubators.yaml` (the editable incubator list, empty).

## Not built here

- The perk-redemption workflow, consent log and facts provider (OS billing).
- Tests, typecheck and build are written but not run (owner mode).
