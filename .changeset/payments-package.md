---
"@stackra/payments": minor
---

Add `@stackra/payments`: the gateway ports (checkout, capture, void, refund, saved-token charges with a
merchant-initiated flag, payouts, platform onboarding, disputes, terminal sessions with a tip prompt), the
`PaymentGateways` port with the `connection` driver that picks the tenant's Connection or the Market's platform
Connection from market-pack data, the `PaymentService` with pay links and the `unknown` state (lookup before retry,
manual resolution with a reason), the memory records driver, the Stripe (with Connect, disputes and Terminal),
Checkout.com, Moyasar, HyperPay, Paymob, Fawry, Tabby and Tamara drivers, and the gateway fakes.
