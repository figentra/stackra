---
"@stackra/payments": minor
---

Recorded-case runners for payout and dispute Connections (STA-672, batch stackra-36). `./testing` gains
`runPayoutCase` and `runDisputeCase` with the types `PayoutCase`, `DisputeCase` and `GatewayCaseResult`: a vendor
Connection in OS integrations runs each recorded case (documentation source, `certification: "pending"` until a sandbox
run passes) and gets every expectation or port rule it misses. The README maps the webhook authenticity, payouts and
disputes of Moyasar, HyperPay, Paymob, Fawry, Tabby and Tamara from their public docs and lists what is left for OS
integrations and `@stackra/webhooks`. No port change.
