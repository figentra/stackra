---
"@stackra/gen": patch
---

The generated Encore adapter passes the call headers to the action pipeline (`requestCallOptions(request)`): a client's `Idempotency-Key` and `Stackra-Consent` were dropped before.
