---
"@stackra/payments": minor
---

Finish the gateway package and add connection modes (STA-672, STA-680). Stripe and HyperPay send form bodies through the
managed client instead of query parameters. Stripe and Checkout.com (live and sandbox) declare their webhook signature
recipes as Integration data. Paymob's KSA, UAE and Oman hosts are their own Integration and Connection pairs
(`paymob-ksa`, `paymob-uae`, `paymob-oman`). Every connection carries a `mode` (`oauth-standard`, `own-key`,
`connected-account`, `legacy-connected-account:<platform>`), read with `modeOf`; `PaymentService` refuses a payment
above the pre-verification cap and a held payout on `connected-account` only (`ConnectedAccountLimits`), and gains
`payout` and `paymentMethods`. `StripeConnection` acts on an `accountRef` through `Stripe-Account` and reads the
account's enabled payment methods; `StripeConnectIntegration` runs OAuth Standard onboarding and revocation. A new
`./node` entry ships `PaymentsModule` and the market-pack `MarketPaymentDefaults` driver over `PaymentPackSource`.
`ProviderChoice.connectionId` is optional (a bring-your-own-only provider) and `PaymentService` takes a fourth
constructor argument.
