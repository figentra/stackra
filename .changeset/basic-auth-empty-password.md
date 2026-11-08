---
"@stackra/integrations": patch
---

`Integration({ auth: { type: AuthType.Basic } })` takes an empty password, as RFC 7617 allows: a provider whose API key is
the whole credential (Medusa, Stripe) sends `key:`. A user name is still required.
