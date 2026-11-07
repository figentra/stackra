---
"@stackra/actions": minor
"@stackra/devices": patch
"@stackra/gen": patch
---

`Idempotency.Never`: an action whose output must never be kept (a credential) ignores a sent `Idempotency-Key`;
every call runs and nothing is stored in or replayed from the idempotency store. `HttpDevicePairingDriver` sends no
`Idempotency-Key` on the credential pickup (`hubSender(config, credential, { idempotencyKey: false })`), so the hub
never keeps the answer that carries the token.
