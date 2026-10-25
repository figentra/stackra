---
"@stackra/locking": minor
---

Add `ValkeyLockDriver` (`driver: valkey`): all-or-nothing leases in one script, TTL with renewal, fencing tokens from a
counter key, and the `LOCKING_VALKEY_URL` secret with `valkey.keyPrefix` in `LockingConfig`.
