---
"@stackra/loyalty-kit": minor
---

The point value and the redemption cap are settings (`loyalty_kit.pointValueMinor`, `loyalty_kit.maxRedeemPercent`,
approval required), and config `earnPerMinor`, `pointValueMinor` and `maxRedeemPercent` are removed (breaking for a host
that overrode them in config: set them as settings instead). `LoyaltyService` no longer takes the config:
`quote(member, requested, totalMinor, rates)`, `quoteEarn(amountMinor, earnPerMinor)` and `pointsFor(amountMinor,
pointValueMinor)` take the scope's values, and `RedeemPointsWorkflow` reads them from `LoyaltyKitSettings`. New
`AccountService.takeBack(member, points, reference)` (a covered `adjust` debit cut at the balance, once per reference,
`loyalty_kit.points.taken_back.v1`) and `AccountService.importBalance(member, { points, reference, tier? })` (an exact
`earn` entry under `import:`, tier raised only, `loyalty_kit.points.imported.v1`), with the `RedemptionRates` and
`PointsImport` types and the `TAKE_BACK_REFERENCE_PREFIX` and `IMPORT_REFERENCE_PREFIX` constants (STA-1323).
