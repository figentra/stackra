# @stackra/container

## 0.7.0

### Patch Changes

- @stackra/contracts@0.7.0

## 0.6.1

### Patch Changes

- @stackra/contracts@0.6.1

## 0.6.0

### Patch Changes

- @stackra/contracts@0.6.0

## 0.5.1

### Patch Changes

- @stackra/contracts@0.5.1

## 0.5.0

### Patch Changes

- @stackra/contracts@0.5.0

## 0.4.0

### Minor Changes

- c9cf778: Register `approval_condition` as a binding kind (STA-1724, ADR 0509).
- 1856ee0: Add the `Permissions` kind base, `registerPermissions`, `permissionKey`, `PERMISSION_REGISTRY` and the
  `PermissionRegistration` type, moved from `@stackra/iam` (STA-1890, ADR 0513), so a module can declare permissions
  without depending on iam.
- ca7d004: `PortRegistry`, an empty interface gen augments with the class of each port it registers drivers for. `DriverName<P>`
  keeps a hand-written `~key` brand first, then narrows an unbranded port to the names of the `PortRegistry` keys whose
  class instance is the same type (structural identity; identical unbranded ports give a wider union), and otherwise
  stays the union of every registered name.

### Patch Changes

- eccdaf0: The testing module binds a `MemoryLoggerFake` (exported from `./testing`) to `Logger` when the test overrides none
  and no registered wiring lists a Logger driver, so a driver that logs boots in a member that does not depend on
  `@stackra/logger`; its `lines` hold what was logged.
- ff56870: The container's missing-binding error now ends with a hint to run `stackra gen` first when a test hits it (gen's setup
  registers the member's wiring). The bundled rule and skills no longer say the v3 packages "do not ship yet", and the
  migrations skill says to write migrations by hand until `stackra db diff` exists (STA-1808).
- e219411: The events testing plugin connects only the listeners a testing app can build: one whose dependency nothing binds (a
  listener of a module the test did not boot, such as one needing `QueueService`) is skipped, and any other error
  building a listener still throws. The container throws a typed `UnboundTokenError` for a class nothing binds; its
  message is unchanged.
- Updated dependencies [9c8d108]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
  - @stackra/contracts@0.4.0

## 0.3.0

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
  - @stackra/contracts@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [9085c41]
  - @stackra/contracts@0.2.0

## 0.1.0

### Minor Changes

- e7a388a: Add `Container.bindings()`, a read-only listing of what the container can build, by name, for tooling: token, scope
  (the binding module key, or a port's driver config key), lifetime and the class built. It never returns or builds an
  instance. Add the dev-only `./devtools` entry: `defineContainerDevtools(kit, container)` defines the
  `container.bindings` devtools tab, and `DevtoolsTabSink` is the kit's `defineTab` by shape, which every package's
  devtools entry takes so none depends on `@stackra/devtools-kit` (stackra-208, ADR 0246, ADR 0461).
- e0f2fc8: The testing module loads the member's generated schemas once per root on compile (`loadMemberSchemas`, on
  `@stackra/container/testing`), as the app boot does, so a test no longer fails with "X has no registered schema".
  Testing plugins can add their own compile steps through the extended `TestingPlugin` type.
- 1a7597c: Add the multi-binding: `container.getAll(Base)` and `DiscoveryService.getAll(Base)` return every class the booted
  modules bind or export that extends `Base`, in wiring order, so a module contributes to another module's extension
  point (a guard to a checkout gate) by binding a subclass. No new token type and no new wiring section (ADR 0457).
- 2787c1e: Add `@stackra/container`, the DI container and kind machinery of the programming model v3.1: the kind bases `Module`
  (both forms), `Service`, `Explorer` and `Driver(Port)`; `Lifetime` (codes and facet) and `@Replaces`; `Named<Port, "x">`
  with `named()`; `DriverName<Port>` over the `DriverRegistry` gen augments; `Container`, which boots generated wirings
  with no reflect-metadata, selects drivers by override, test choice, config or single candidate, and fails a boot without
  a driver with `UnresolvedPortError` (a plain `Error`); `DiscoveryService` and `createDecorator` (record-only decorators
  refused outside their kinds); `createKind`, `registerKind`, `kindOf` and `WithPartner` for kind packages; `./react`
  with `ContainerProvider` and `useContainer`; and `./testing` with `createTestingModule` (`.override`, `.useDrivers`,
  `.compile`, `TestingApp`), `registerWiring` and the `registerTestingPlugin` extension point.

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
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [914465a]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [150fa18]
- Updated dependencies [e756399]
- Updated dependencies [d19a3d5]
  - @stackra/contracts@0.1.0

Written by Changesets on release; never edited by hand.
