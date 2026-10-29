---
"@stackra/actions": minor
---

Add `RateLimitConfig.actionDefault` (STA-1588): an action or query with no `rateLimit` of its own now takes from a
default bucket per scope (`perScope`, 1200 calls a minute) and, when the call carries a client, per hashed client
address (`perAddress`, 300 a minute). An action's own `rateLimit` replaces both. The store is handed the address's
SHA-256, never the address.
