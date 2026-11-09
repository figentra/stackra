---
"@stackra/app": patch
---

`serveGuardedCall` answers `idempotency_key_in_progress` with its 409 envelope and `Retry-After: 1`.
