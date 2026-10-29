# @stackra/query

## 0.1.0

### Minor Changes

- e7a388a: Add the dev-only `./devtools` entry: `defineQueryDevtools(kit, cache, queue)` defines the `query.cache` devtools tab
  (cached queries by versioned key, no input or data) and the sensitive `query.mutations` tab (the offline queue's
  pending calls and conflicts) (stackra-208, ADR 0246, ADR 0461).
- 2787c1e: Add `@stackra/query`, server state on the client: a TanStack Query cache refetched live on its queries' invalidation events, an offline mutation queue that replays in per-device order with the Idempotency-Key minted at queue time, refuses a capped action with the pipeline's `offline_cap_reached` and turns refusals into conflict records, bounded replicas refreshed by change cursor that `useReplica` reads with their "as of" time, an `OfflineLock` that wipes and locks a revoked or long-offline device, payloads sealed at rest, `offlineMap`, `QueryConfig` with its shipped schema, `QuerySettings`, `useMutationQueue` and `fakeQueue`.
- 6912039: Replicas follow the phone's power and data saving (STA-1536): while `SystemSettings` reports Low Power Mode or an
  expensive connection, `ReplicaStore`'s background refreshes wait and run once it stops; an explicit `refresh` still runs.

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- 2d7233c: `OfflineCap` is now @stackra/actions' type, which declares `amountField`, and `OfflineEntry` inherits `cap` from
  `OfflineOptions`.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [f81699d]
- Updated dependencies [f7fb4ad]
- Updated dependencies [e7a388a]
- Updated dependencies [68dd2a5]
- Updated dependencies [e0f2fc8]
- Updated dependencies [2787c1e]
- Updated dependencies [df3f38b]
- Updated dependencies [4413118]
- Updated dependencies [a6ec591]
- Updated dependencies [38fb3e2]
- Updated dependencies [bc4acfc]
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [99665bb]
- Updated dependencies [8ead1a8]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [e7ee0a4]
- Updated dependencies [a701ccb]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [505ae77]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [9277eeb]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [3a94a6e]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [9fc14fd]
- Updated dependencies [de4d77d]
- Updated dependencies [cc96d5d]
- Updated dependencies [d63f012]
- Updated dependencies [072dc7e]
- Updated dependencies [b58ebce]
- Updated dependencies [1723c05]
- Updated dependencies [d15a219]
- Updated dependencies [8ce76e9]
- Updated dependencies [c46f32f]
- Updated dependencies [2c2beca]
- Updated dependencies [9e63234]
- Updated dependencies [04a0f8c]
- Updated dependencies [544b42d]
- Updated dependencies [2787c1e]
- Updated dependencies [90957bd]
- Updated dependencies [1b4effa]
- Updated dependencies [6855121]
- Updated dependencies [d7ed271]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b2607b5]
- Updated dependencies [d72a734]
- Updated dependencies [2787c1e]
- Updated dependencies [6d0152d]
- Updated dependencies [b163445]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [62a97c0]
- Updated dependencies [56dde43]
- Updated dependencies [786f390]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [69363bf]
- Updated dependencies [9759078]
- Updated dependencies [47554e7]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8992b7a]
- Updated dependencies [d156aa8]
- Updated dependencies [2787c1e]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/config@0.1.0
  - @stackra/platform@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/devices@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/realtime@0.1.0
  - @stackra/settings@0.1.0
  - @stackra/storage@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
