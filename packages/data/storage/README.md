# @stackra/storage

Stackra client storage: one injected `Storage` service with the six named areas of ADR 0256, values kept as JSON and
checked by their generated schemas, an optional time-to-live per write, a driver per platform, and the seal that keeps
the offline payloads unreadable at rest without the session's key (ADR 0338). No ORM runs on a client (ADR 0014); the
sync engine stays deferred (ADR 0011).

**Tier:** `tier:lib` (`packages/data/storage`), the one data package outside the data gate. Entries `.`, `./contracts`,
`./browser`, `./native`, `./react` and `./testing`. Depends on `@stackra/contracts`, `@stackra/container` and
`@stackra/validation`; React is an optional peer of `./react`; `react-native-mmkv` and `expo-secure-store` of `./native`.

## What is here

| Entry         | Symbol                       | Use                                                                           |
| ------------- | ---------------------------- | ----------------------------------------------------------------------------- |
| `.`           | `StorageArea`                | `prefs`, `session`, `cache`, `outbox`, `secrets`, `files`; `storage[area]`    |
| `.`           | `OfflineStore`               | where the query cache and offline queue live (`DesktopConfig.offlineStore`)   |
| `.`           | `MemoryStorageDriver`        | the `memory` candidate: tests, server renders, the testing module             |
| `.`           | `WebCryptoPayloadSealDriver` | the `web_crypto` seal: AES-GCM, the key in `secrets`                          |
| `.`           | `MemoryPayloadSealDriver`    | the `memory` seal: binds a payload to the key without encrypting              |
| `.`           | `registerStorageKeys`        | how generated code links a stored class to its derived key and area           |
| `.`           | `StorageKey`                 | type of one registration                                                      |
| `./contracts` | `Storage`                    | the port, injected by type (exported from here only)                          |
| `./contracts` | `StorageAreaHandle`          | one area: `get`, `set`, `has`, `delete`, `keys`, `clear`, `read`, `write`     |
| `./contracts` | `PayloadSeal`                | seals and opens the `outbox` and `cache` payloads with the session's key      |
| `./browser`   | `WebStorageDriver`           | web and PWA: `prefs`/`cache` in `localStorage`, `session` in `sessionStorage` |
| `./native`    | `NativeStorageDriver`        | mobile: five areas in MMKV (`stackra.<area>`), `secrets` in keychain/keystore |
| `./react`     | `usePrefs`                   | the `prefs` area of the nearest container                                     |
| `./testing`   | `fakeStorage`                | a fresh in-memory `Storage` for one test                                      |

## Using it

```ts
import { Duration } from "@stackra/contracts";
import { StorageArea } from "@stackra/storage";
import { usePrefs } from "@stackra/storage/react";

const prefs = usePrefs();
prefs.write(DevicePrefs, values); // checked by DevicePrefs$, stored under `console.device_prefs`
const device = prefs.read(DevicePrefs); // the stored prefs, or the shape's defaults

storage[StorageArea.Cache].set("catalogue.page_1", rows, { ttl: Duration.minutes(10) });
await storage.flush(); // every write so far is persisted
```

Reads and writes are synchronous against each area's memory copy; a driver persists in the background. A runtime calls
`storage.hydrate()` before the first frame (an asynchronous backend loads then) and `flush()` before it exits; a failed
write rejects the next `flush()` and never throws at the writer. Persisted text is untrusted: an entry that is not a
stored envelope reads as absent.

Keys are derived by gen (`<member>.<snake(stem)>`) and registered by generated code with `registerStorageKeys`; a class
with no registration throws a `TypeError`. A store that persists itself is reached with `storage.store(UiStore)`.

## Sealed payloads

The `outbox` and `cache` areas hold the offline queue and the replicas, which may carry personal data. `PayloadSeal`
seals what goes into them with a key minted for the session and kept in the `secrets` area (ADR 0338 decision 2):

```ts
const sealed = await seal.seal(JSON.stringify(queue)); // mints the key in `secrets` on the first seal
await seal.open(sealed); // the text, while the key is there
storage.secrets.clear(); // a wipe on revoke or past the offline limit
await seal.open(sealed); // undefined: nothing sealed before can be opened again
```

- `WebCryptoPayloadSealDriver` (`web_crypto`) is AES-GCM with a 256-bit key and a fresh nonce per seal, wherever
  `crypto.subtle` exists (browsers, Electron, Node, Workers; React Native through a WebCrypto polyfill). The sealed
  text is `v1.<nonce>.<ciphertext>`.
- `MemoryPayloadSealDriver` (`memory`) encrypts nothing (`isEncrypting: false`) but binds each payload to the key id,
  so a wipe makes it unreadable exactly as a real key does: tests, and a native target until its driver lands.
- `open` never throws: another key, a wiped key, tampered or foreign text read as `undefined`.
- On the web the `secrets` area lives in memory, so the key, and with it what was sealed, lasts until the page
  reloads.

`@stackra/query`'s `StorageQueryPersisterDriver` is the one caller; nothing else needs the seal.

## Testing

```ts
import { fakeStorage } from "@stackra/storage/testing";

const storage = fakeStorage();
await storage.store(PreferencesStore).write({ tenantByUser: { usr_1: "ten_2" } });
```

Governing ADRs: 0256 (this package), 0294 (decisions 15 to 17, 20, 26), 0266, 0269, 0127 2026-10-24 note.
