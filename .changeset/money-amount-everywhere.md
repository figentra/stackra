---
"@stackra/loyalty-kit": minor
"@stackra/registry": minor
"@stackra/ledger": minor
---

`MoneyAmount` and `CurrencyCode` in place of bare minor-unit pairs (STA-1383). Breaking:

- `@stackra/loyalty-kit/contracts`: `EarnRequest` and `EarnDraft` take `amount: MoneyAmount` instead of `amountMinor`
  and `currency`; `RedemptionQuote` returns `amount: MoneyAmount` instead of `amountMinor`; `LoyaltyService.quote`
  takes `total: MoneyAmount` instead of `totalMinor`. The stored redeem input and output schemas keep `totalMinor` and
  `amountMinor`; the workflow maps at that boundary with the run's currency.
- `@stackra/registry`: `computePartnerPayout` takes a `MoneyAmount` gross and returns `{ gross, fee, net }` amounts;
  `PerkListingCharge` carries `amount: MoneyAmount` instead of `currency` and `amountMinor`. The stored `PartnerPayout`
  and `FeeSchedule` records keep their columns.
- `@stackra/ledger`: `JournalEntry.currency` is a `CurrencyCode`; the amount stays a number so points journals work.

loyalty-kit, registry and ledger now depend on `@stackra/money`.
