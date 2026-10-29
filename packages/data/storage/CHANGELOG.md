# @stackra/storage

## 0.1.0

### Minor Changes

- 8992b7a: Add the `./desktop` entry with `SafeStoragePayloadSealDriver` (`safe_storage`): offline payloads sealed by the
  operating system's keychain through Electron `safeStorage`, still bound to the session in `secrets` (ADR 0338
  decision 2). Add `sliceArea` and `ReplicaSlice`: a replica scoped by a tenant dimension keeps only its own value's rows
  and drops the others (ADR 0338 decision 3).
- d156aa8: Add the `./native` entry with `NativeStorageDriver`: `prefs`, `session`, `cache`, `outbox` and `files` on
  react-native-mmkv (one instance per area, `stackra.<area>`), `secrets` on expo-secure-store (keychain and keystore).
  Both modules are optional peers.
- 2787c1e: Add `@stackra/storage`, the one client storage package of ADR 0256: the `Storage` port in `./contracts` with its six
  named areas (`prefs`, `session`, `cache`, `outbox`, `secrets`, `files`), `store(type)` for a class that persists
  itself, and `hydrate()`/`flush()`; synchronous area reads and writes over JSON values with an optional time-to-live,
  shape classes read with their defaults and written through their generated schema, and persisted text treated as
  untrusted; the `PayloadSeal` port with its AES-GCM `WebCryptoPayloadSealDriver` and `MemoryPayloadSealDriver`, which
  seal the offline payloads with a session key kept in `secrets` (ADR 0338); `StorageArea`, `OfflineStore`,
  `registerStorageKeys` and the `MemoryStorageDriver` in `.`; the `WebStorageDriver` (`localStorage`/`sessionStorage`,
  secrets kept in memory) in `./browser`; `usePrefs` in `./react`; and `fakeStorage` in `./testing`.

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
