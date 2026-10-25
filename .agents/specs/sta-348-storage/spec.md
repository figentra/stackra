# Feature Specification: `@stackra/storage` wave 2, client storage

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348 (wave 9 sealed payloads: STA-488)

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/storage` (data, wave 2) for real: one client storage service with per-platform drivers, a
time-to-live and typed values (ADR 0256); no ORM on a client. Export `Storage` from one entry only.

## Impact

- **Apps touched**: none (the template's apps consume `.`, `./contracts`, `./react`, `./testing`; STA-344)
- **Services touched**: none
- **Packages touched**: `packages/data/storage` (new member)
- **Cross-service events**: none
- **Tenancy and data**: device-local values only; nothing leaves the device through this package
- **Secrets**: none handled by the repository; on the web the `secrets` area never rests in Web Storage
- **ADR needed**: no (ADR 0256 decides the package; ADR 0294 decisions 15 to 17, 20, 26; ADR 0127 2026-10-24 note for
  entries; ADR 0266 memory drivers first; ADR 0269 testing; ADR 0338 decision 2 for the sealed payloads)
- **New dependencies**: none new; `@stackra/contracts`, `@stackra/container`, `@stackra/validation` through
  `workspace:*`; React as an optional peer; zod (`catalog:`) for tests
- **Deploy modes**: same in all; isomorphic core, `./browser` browser only, `./testing` node only
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/data/storage/README.md`, `packages/data/storage/AGENTS.md`; ADR 0120, 0127, 0256, 0266, 0269, 0294 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R2 (every client persists preferences, stores and the offline queue through it; a lost or misread
  value is user-visible)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry A3: `Storage` is exported from `./contracts` only; the owner's 2026-10-24
  answers: extra entries fold into the standard six plus the runtime targets, so browser-only drivers use `./browser`

### Session 2026-10-25 (wave 9, STA-488)

- ADR 0338 decision 2: the `outbox` and `cache` payloads are sealed at rest with a key minted per session in the
  `secrets` area (`PayloadSeal`, port in `./contracts`). The `web_crypto` driver is AES-GCM with a fresh nonce per seal
  wherever `crypto.subtle` exists (React Native through a WebCrypto polyfill); the `memory` driver binds a payload to
  the key id without encrypting and reports `isEncrypting: false`, so `@stackra/query` persists no replica through it
  while encryption is required. Wiping `secrets` makes every earlier payload unopenable; `open` answers `undefined`,
  never throws

## User Scenarios & Testing

### User Story 1 - Persist per-device preferences (Priority: P1)

The console's settings hook calls `usePrefs().write(DevicePrefs, values)`; its route loader calls
`ctx.prefs.read(DevicePrefs)` and gets the stored prefs or the shape's defaults.

**Independent Test**: `src/core/functions/__tests__/create-storage-area.function.test.ts`,
`src/react/prefs/__tests__/use-prefs.test.tsx`.

**Acceptance Scenarios**:

1. **Given** a registered shape, **When** written, **Then** it is checked by its generated schema and stored under its
   derived key (`console.device_prefs`) in its wire form; an invalid value throws and stores nothing.
2. **Given** nothing stored, or a stored value an older release wrote that no longer fits, **When** read, **Then** the
   shape's defaults come back as an instance of the class.
3. **Given** a container binding `Storage`, **When** `usePrefs()` runs, **Then** it returns that storage's `prefs` area;
   outside a provider or with nothing bound, it throws.

### User Story 2 - Name an area in configuration and in a store (Priority: P1)

`StateConfig.persistStore: StorageArea = StorageArea.Prefs`, `Store({ persist: StorageArea.Prefs })`,
`DesktopConfig.offlineStore: OfflineStore = OfflineStore.EncryptedIndexedDb`; `storage.store(PreferencesStore)` reads
and writes a store's persisted state.

**Independent Test**: `src/core/enums/__tests__/*.test.ts`, `src/core/drivers/__tests__/area-storage.driver.test.ts`.

**Acceptance Scenarios**:

1. **Given** `StorageArea`, **Then** it has `prefs`, `session`, `cache`, `outbox`, `secrets`, `files`, and each code
   names the `Storage` property holding that area.
2. **Given** a class registered with an area, **When** `storage.store(type)` writes, **Then** the state lands in that
   area (`prefs` when none is registered); an unregistered class throws `TypeError`.

### User Story 3 - Expire, persist and recover (Priority: P1)

A package caches with `{ ttl: Duration.minutes(10) }`; the web driver persists `prefs` and `cache` to `localStorage`.

**Independent Test**: `src/core/functions/__tests__/create-storage-area.function.test.ts`,
`src/browser/drivers/__tests__/web-storage.driver.test.ts`.

**Acceptance Scenarios**:

1. **Given** a value with a time-to-live, **When** it has passed, **Then** the key reads as absent.
2. **Given** a new `WebStorageDriver` over the same `localStorage`, **Then** it reads what the last one flushed; it
   never reads or removes keys outside its `stackra:<area>:` prefix, never writes secrets to Web Storage, and falls back
   to memory when Web Storage is refused.
3. **Given** a backend write fails, **Then** the writer does not throw and the next `flush()` rejects with the failure.
4. **Given** persisted text that is not a stored envelope, **Then** it reads as absent and is removed.

### User Story 4 - Test with an in-memory storage (Priority: P1)

Template tests call `fakeStorage()` and seed it with `storage.store(PreferencesStore).write({...})`; the testing module
binds the `memory` candidate.

**Independent Test**: `src/testing/functions/__tests__/fake-storage.function.test.ts`,
`src/core/drivers/__tests__/memory-storage.driver.test.ts`.

### User Story 5 - Keep a lost till's data unreadable (Priority: P1)

The offline queue and the replicas of a till rest sealed with its session's key. When the till is revoked, the
`secrets` area is wiped and nothing sealed before can be opened again.

**Independent Test**: `src/contracts/ports/__tests__/payload-seal.port.test.ts`,
`src/core/drivers/__tests__/web-crypto-payload-seal.driver.test.ts`,
`src/core/drivers/__tests__/memory-payload-seal.driver.test.ts`.

## Requirements

- **FR-001**: Entries `.`, `./contracts`, `./browser`, `./react`, `./testing` only (ADR 0294 d15, ADR 0127 2026-10-24
  note).
- **FR-002**: `.` exports `OfflineStore`, `StorageArea` (template), `MemoryStorageDriver`, `registerStorageKeys` and the
  `StorageKey` type.
- **FR-003**: `./contracts` exports `Storage` and `.` does not (registry A3); `./contracts` imports no other entry.
- **FR-004**: `./react` exports `usePrefs`; `./testing` exports `fakeStorage`; `./browser` exports `WebStorageDriver`.
- **FR-005**: Values are JSON; a shape class is checked by its registered schema (`@stackra/validation`), never by a
  schema compiled at runtime.
- **FR-006**: Keys are derived by gen and registered with `registerStorageKeys`; nothing guesses a key.
- **FR-007**: No ORM and no new third-party runtime dependency.
- **FR-008**: `./contracts` exports `PayloadSeal` (`isEncrypting`, `seal`, `open`), and `.` exports its `web_crypto`
  (`WebCryptoPayloadSealDriver`, AES-GCM) and `memory` (`MemoryPayloadSealDriver`) drivers. A seal mints the session's
  key in `secrets` when none is there; `open` answers the text only under the key it was sealed with and `undefined`
  otherwise (another key, a wiped key, tampered or foreign text).

## Success Criteria

- **SC-001**: Every symbol the template imports from `@stackra/storage`, `/contracts`, `/react` and `/testing` exists
  with the shape the template uses, except the exceptions listed below.
- **SC-002**: A test beside every public symbol, plus the barrel tests, passes in the testing workflow.
- **SC-003**: Expiry, schema checks, untrusted persisted text and write failures are tested.

## Template imports not satisfied here (by design)

- `import { Storage } from "@stackra/storage"` in `apps/mobile/src/__tests__/mobile.module.test.ts`: one symbol, one
  entry; it moves to `@stackra/storage/contracts` in STA-344, as the gen samples already import it.
- `@stackra/storage/electron` (`DesktopStorageDriver`) in the console's desktop wiring sample: needs the Electron
  `safeStorage` bridge from `@stackra/platform` (wave 6); lands with it.
- The native drivers (`mmkv`, `sqlite`, `secure-store`, `expo-fs`) and the web IndexedDB, OPFS and WebCrypto backends
  of ADR 0256 decision 3: need uncatalogued dependencies (`react-native-mmkv`, `expo-sqlite`, `expo-secure-store`,
  `expo-file-system`, `fake-indexeddb` to test). Until then the web `outbox` and `files` areas live in memory, and so
  does the web `secrets` area that holds the payload key, so a sealed payload is readable until the page reloads.
- A native `PayloadSeal` driver over the platform's secure store: until it lands, a native target binds the `memory`
  seal (no encryption at rest) or `web_crypto` through a WebCrypto polyfill.
- The `./sql` read-model entry of ADR 0256 decision 5: Phase 2, and not in the 0127 allowed entry set.
- Gen need: each generated member file calls `registerStorageKeys([[Class, { key, area? }]])` for its stored shapes and
  persisted stores, beside `registerSchemas` (gap G1).

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
