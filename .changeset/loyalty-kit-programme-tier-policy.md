---
"@stackra/loyalty-kit": minor
---

Programme and tier hook (ADR 0454): the `isActive` and `earnPerMinor` settings (a paused programme earns nothing; the
earn rate is per scope), `LoyaltyService.quoteEarn` takes the scope's rate, the `LoyaltyTierPolicy` port with the
`threshold` driver behind `RecalculateTierListener` (a host replaces it with `@Replaces`), `PointsRedeemed` is now the
integration event `loyalty_kit.points.redeemed.v1` with `balanceAfter`, and the new `PointsExpired`
(`loyalty_kit.points.expired.v1`) is recorded by the expiry job. `AccountService` now takes a `SettingsReader`.
