---
"@stackra/identity": patch
---

Passkey sign-in (`passkey.challenge`, `passkey.verify`) is `Idempotency.Never`: a challenge is single-use and a
verification answers session credentials, so neither is kept by the idempotency store or replayed.
