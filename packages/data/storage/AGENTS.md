# AGENTS — @stackra/storage

Client storage. Member at `packages/data/storage` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305).
Entries `.`, `./contracts`, `./browser`, `./react`, `./testing`.

## Where code goes

| You are writing…                 | It goes in…                                                              |
| -------------------------------- | ------------------------------------------------------------------------ |
| The port and its signature types | `src/contracts/ports/`, `src/contracts/types/`                           |
| An enum, a function, a type      | `src/core/{enums,functions,types}/`                                      |
| An isomorphic driver             | `src/core/drivers/<name>-storage.driver.ts`, extends `AreaStorageDriver` |
| A browser-only driver            | `src/browser/drivers/`                                                   |
| React code                       | `src/react/<name>/`                                                      |
| A test helper                    | `src/testing/functions/`                                                 |
| A test                           | `__tests__/<name>.<kind>.test.ts(x)` beside it                           |

## Entries and barrels

- `src/{core,contracts,browser,react,testing}/index.ts` are stand-in barrels until gen writes the entry barrels
  (STA-339); add every new public file to its barrel and to that entry's `index.test.ts`.
- `Storage` is exported from `./contracts` only, never from `.` (registry A3). `./contracts` imports no other entry, so
  the port types its areas as properties named by the `StorageArea` codes instead of importing the enum.

## This package

- Every driver shares `createStorageArea` through `AreaStorageDriver`; a platform driver only passes backends. Its
  constructor takes nothing: the container builds it and gen reads constructor parameters as dependencies.
- A secret never rests in Web Storage. A new area is an ADR change, a new `StorageArea` case and a new port property.
- The payload key lives in `secrets` under `PAYLOAD_KEY` and is read on every seal and open, so clearing `secrets` is
  the wipe (ADR 0338 decision 2). A seal driver never logs, returns or caches the raw key beyond the imported
  `CryptoKey`, and `open` answers `undefined` instead of throwing.
- No ORM on a client (ADR 0014, 0256 decision 6). No parameter properties and no `#private` fields.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data                | Where              | Handling                                                                               |
| ------------------- | ------------------ | -------------------------------------------------------------------------------------- |
| Preferences, drafts | `prefs`, `session` | On the device only; never sent anywhere by this package.                               |
| Tokens, keys        | `secrets`          | Memory on the web; a platform store elsewhere. Never logged.                           |
| Sealed payloads     | `outbox`, `cache`  | Written by `@stackra/query` through `PayloadSeal`; unreadable once `secrets` is wiped. |
