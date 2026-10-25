---
"@stackra/storage": minor
---

Add the `./desktop` entry with `SafeStoragePayloadSealDriver` (`safe_storage`): offline payloads sealed by the
operating system's keychain through Electron `safeStorage`, still bound to the session in `secrets` (ADR 0338
decision 2). Add `sliceArea` and `ReplicaSlice`: a replica scoped by a tenant dimension keeps only its own value's rows
and drops the others (ADR 0338 decision 3).
