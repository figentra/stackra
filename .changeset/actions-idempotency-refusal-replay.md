---
"@stackra/actions": minor
---

The idempotency step tells a key still in flight (`idempotency_key_in_progress`, same input) from a reused one (`idempotency_key_reused`, other input), and a call refused for a reason no retry can change keeps its refusal under the key: a retry gets the same refusal and `handle` does not run again. A retryable refusal or a plain error still frees the key. `IdempotencyStore` gains `completeRefused(key, fingerprint, refusal, ttl)` and `IdempotencyRecord` a refusal form; the memory and Valkey drivers implement it. Breaking for a custom store: implement `completeRefused`.
