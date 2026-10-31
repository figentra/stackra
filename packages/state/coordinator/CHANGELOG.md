# @stackra/coordinator

## 0.2.0

### Patch Changes

- Updated dependencies [9085c41]
  - @stackra/contracts@0.2.0
  - @stackra/state@0.2.0

## 0.1.0

### Minor Changes

- 2787c1e: Add `@stackra/coordinator`, tab coordination on one device: `electLeader(name, options)` joins a named leader election
  and returns its `LeaderElection` (`isLeader` as a read-only `@stackra/state` signal, `whenLeader()`, `resign()`,
  `method`); the method is Web Locks, else a BroadcastChannel heartbeat (takeover after three missed beats or at once on
  a resignation; `heartbeat` option), else an in-memory queue (`ElectionMethod`); and `withTabLock(name, task)` runs one
  task at a time across tabs and releases when it settles.

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
- 950bb8b: Breaking rename (STA-1383): the `Signal<T>` type of `@stackra/state/react` is `StateSignal<T>`, so `Signal` is only
  `@stackra/workflow`'s run signal kind. `signal()` and `useSignal()` keep their names.
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [65f5ac1]
- Updated dependencies [914465a]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [150fa18]
- Updated dependencies [e756399]
- Updated dependencies [e01195a]
- Updated dependencies [2787c1e]
- Updated dependencies [950bb8b]
- Updated dependencies [d19a3d5]
  - @stackra/contracts@0.1.0
  - @stackra/state@0.1.0

Written by Changesets on release; never edited by hand.
