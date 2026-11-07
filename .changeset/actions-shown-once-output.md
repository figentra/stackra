---
"@stackra/actions": minor
---

The idempotency step never keeps a `@ShownOnce` output field: it is left out before `IdempotencyStore.complete`, and a
replay answers without it and with `secretOmitted: true`, so the client knows to rotate if it lost the first response.
`ActionRegistration` takes the `output` class for this. `Action({ idempotencyTtl })` shortens how long a key and its
output are kept; a window longer than 24 hours is ignored.
