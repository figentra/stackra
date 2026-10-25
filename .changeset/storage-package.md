---
"@stackra/storage": minor
---

Add `@stackra/storage`, the one client storage package of ADR 0256: the `Storage` port in `./contracts` with its six
named areas (`prefs`, `session`, `cache`, `outbox`, `secrets`, `files`), `store(type)` for a class that persists
itself, and `hydrate()`/`flush()`; synchronous area reads and writes over JSON values with an optional time-to-live,
shape classes read with their defaults and written through their generated schema, and persisted text treated as
untrusted; the `PayloadSeal` port with its AES-GCM `WebCryptoPayloadSealDriver` and `MemoryPayloadSealDriver`, which
seal the offline payloads with a session key kept in `secrets` (ADR 0338); `StorageArea`, `OfflineStore`,
`registerStorageKeys` and the `MemoryStorageDriver` in `.`; the `WebStorageDriver` (`localStorage`/`sessionStorage`,
secrets kept in memory) in `./browser`; `usePrefs` in `./react`; and `fakeStorage` in `./testing`.
