# @stackra/scope

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [cfdcdf8]
- Updated dependencies [2d5a888]
- Updated dependencies [1a9259b]
- Updated dependencies [9085c41]
  - @stackra/actions@0.2.0
  - @stackra/database@0.2.0
  - @stackra/errors@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/outbox@0.2.0
  - @stackra/entitlements@0.2.0
  - @stackra/model@0.2.0
  - @stackra/storage@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/events@0.2.0
  - @stackra/validation@0.2.0
  - @stackra/cache@0.2.0

## 0.1.0

### Minor Changes

- 396e384: Packages ship their `stackra.manifest.json` (listed in `files`), and the manifest gains a `config` section that gen
  reads for package config rows instead of the `*Config` name suffix. `stackra gen --check` refuses an unshipped manifest
  (`manifest_unshipped`). New memory drivers: `ConnectionStore` (integrations), `ScopeResolver` (scope),
  `RealtimeFanout` (realtime), `ErrorReporter` (errors), `SecretStore` (config) and `FlagProvider` (feature-flags).
  Generated file headers keep ` *` on continuation lines, so every generated header changes on the next regeneration.
- 9fc14fd: Put `@stackra/rules`, `@stackra/access-log`, `@stackra/scope`, `@stackra/market-packs`, `@stackra/devices`,
  `@stackra/collaboration` and `@stackra/payments` on the framework version line beside the packages the OS catalog
  already lists, with `@stackra/segments`, which `@stackra/iam` depends on and the catalog also lacks (STA-819).
- 37e1aa8: Round C. gen: lazy catalogue loaders and `loadMessages(locale)` in the generated I18n (only runtime dependencies bring
  lang); event wire names stay `<module>.<name>.v<n>` and a prefixed name is refused (`event_name_prefixed`); a service
  subscribes its own topics into its inbox for local listeners; the coverage-audit refusals (`checkConventions` and
  friends). i18n: `loadMessages` with the ar-SA, ar, en fallback chain. Packages that ship `assets/lang` export
  `./assets/*`. tenancy: `belongsToTenant({ nullable: true })` compiles through `equalsOrUnset`. workflow: `ServiceAcked`
  carries `KeptRecords` (migration 0008). identity: app-approval sign-in and step-up with number matching and QR.
  filesystem: `readStream` on every disk. content: custom fields per runtime subtype (migration 0004); `ContentModule`
  exports `RevisionService`. actions: `RateLimitBudget` port sizes the area bucket. licensing: `LicenceIssuer` port with
  Keygen and memory drivers, install key signer and signed usage reports.
- 376a093: Add `ScopeCacheNamespaceDriver`, the `scope` driver of the `CacheNamespace` port: cache keys sit behind the running
  call's scope id (`""` for a platform call or outside every call). `CacheConfig` gains `namespace`
  (`DriverName<CacheNamespace>`, `shared` by default), which selects the namespace driver, and `CacheNamespace` carries
  the `cache.CacheNamespace` port key. A conformance test runs every `Cache` driver with two namespaces (ADR 0150
  enforcement, STA-1442). New dependencies of `@stackra/scope`: `@stackra/actions`, `@stackra/cache`.
- 89548ea: Gate A: the package is now public (no `private` flag). Add the `./native` entry with `rememberActiveScope` (a device
  restores its last scope from the `prefs` storage area and keeps it) and the `./testing` entry with `scopeRefOf` and
  `fakeScopeTree`.
- 2787c1e: Add `@stackra/scope`: the scope tree with levels declared as data in `ScopeConfig`, the `ScopeNode` model on an
  `ltree` path with its migration, the `ScopeTree`, `ScopeResolver` and `GrantedScopes` ports, the resolver chain
  (`X-Scope-Path` header, token claim, root) with `SCOPE_PATH_HEADER` and `SCOPE_PATH_CLAIM`, the declared `ScopeDepthEntitlement`, `ActiveScopeService` and `useScope`.
- a31d463: Move a scope subtree (ADR 0411): `ScopeNodeService.move(scope, parent)` re-paths the node and its descendants in one
  statement and records `ScopeMoved` (`scope.node.moved.v1`); a parent at or below the node is `ScopeMoveInvalidError`.
  `CrudService.repath(from, to)` rewrites the `ltree` prefix of a service's own `scope_path` rows from its listener.

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
- 93fa8f1: Rename `ScopeNodeService.move(scope, parent)` to `moveSubtree(scope, parent)`, so it no longer clashes with the
  inherited `CrudService.move(id, parentId)` (the `HasTree` re-parent of one row). Behaviour is unchanged (ADR 0411).
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
- Updated dependencies [0abe92d]
- Updated dependencies [c547718]
- Updated dependencies [d72a734]
- Updated dependencies [2787c1e]
- Updated dependencies [4502f57]
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
- Updated dependencies [94ae85f]
- Updated dependencies [dddbbcd]
- Updated dependencies [856995c]
- Updated dependencies [e7ee0a4]
- Updated dependencies [ca85d59]
- Updated dependencies [d72a734]
- Updated dependencies [9841d79]
- Updated dependencies [f6d1a76]
- Updated dependencies [c196bc6]
- Updated dependencies [49ab0e6]
- Updated dependencies [d156aa8]
- Updated dependencies [6d46e5e]
- Updated dependencies [2787c1e]
- Updated dependencies [38a5501]
- Updated dependencies [e0f2fc8]
- Updated dependencies [62c7ae1]
- Updated dependencies [c868bad]
- Updated dependencies [0d36f0d]
- Updated dependencies [a701ccb]
- Updated dependencies [a526605]
- Updated dependencies [da8bdbd]
- Updated dependencies [763e901]
- Updated dependencies [936fcb1]
- Updated dependencies [f11cbe8]
- Updated dependencies [f7a2d36]
- Updated dependencies [6bb8ea8]
- Updated dependencies [e45cd73]
- Updated dependencies [6006b78]
- Updated dependencies [fd3427e]
- Updated dependencies [e01195a]
- Updated dependencies [783fb5b]
- Updated dependencies [c994359]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [5a25b49]
- Updated dependencies [d58a505]
- Updated dependencies [f65a9e9]
- Updated dependencies [483eb44]
- Updated dependencies [acff14a]
- Updated dependencies [fb93026]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [3a9eb7e]
- Updated dependencies [cc8db5e]
- Updated dependencies [e7a388a]
- Updated dependencies [2787c1e]
- Updated dependencies [6f2c1f7]
- Updated dependencies [3d080e7]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [d5e5ff8]
- Updated dependencies [9841d79]
- Updated dependencies [d156aa8]
- Updated dependencies [2787c1e]
- Updated dependencies [c580aa4]
- Updated dependencies [7e60fa9]
- Updated dependencies [b62c042]
- Updated dependencies [e52a367]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [09080ac]
- Updated dependencies [0a20a9f]
- Updated dependencies [2787c1e]
- Updated dependencies [3d34a5d]
- Updated dependencies [d5f5acf]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [ae9621e]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [376a093]
- Updated dependencies [a31d463]
- Updated dependencies [158f6cf]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8992b7a]
- Updated dependencies [d156aa8]
- Updated dependencies [2787c1e]
- Updated dependencies [c3ff8a7]
- Updated dependencies [3e2fc84]
- Updated dependencies [5e8114b]
- Updated dependencies [2c0ea71]
- Updated dependencies [ab9cc36]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/events@0.1.0
  - @stackra/outbox@0.1.0
  - @stackra/cache@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/database@0.1.0
  - @stackra/model@0.1.0
  - @stackra/entitlements@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/storage@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
