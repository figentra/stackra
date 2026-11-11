# @stackra/testing

## 0.33.1

No changes in this release.

## 0.33.0

### Minor Changes

- 41a5ff0: `./e2e` gains `packageE2ePreset` (the Playwright config of a package: Chromium and `ar-SA` Chromium, Firefox and WebKit opt-in, a Vite page server on port 5199) and `packageE2eVite` (that server's Vite config). `vite` is a new optional peer.
  
  Behaviour change: the `test` of `./e2e` now fails a test whose page logged a console error or threw an uncaught error, so existing app e2e specs that render with console errors start failing. Fix the error, or opt a file out with `test.use({ consoleErrors: "allow" })`.

## 0.32.0

No changes in this release.

## 0.31.0

No changes in this release.

## 0.30.0

No changes in this release.

## 0.29.0

No changes in this release.

## 0.28.0

No changes in this release.

## 0.27.0

No changes in this release.

## 0.26.0

No changes in this release.

## 0.25.0

No changes in this release.

## 0.24.0

No changes in this release.

## 0.23.0

No changes in this release.

## 0.22.0

No changes in this release.

## 0.21.0

No changes in this release.

## 0.20.0

No changes in this release.

## 0.19.0

No changes in this release.

## 0.18.1

No changes in this release.

## 0.18.0

No changes in this release.

## 0.17.2

No changes in this release.

## 0.17.1

No changes in this release.

## 0.17.0

No changes in this release.

## 0.16.0

No changes in this release.

## 0.15.0

No changes in this release.

## 0.14.4

No changes in this release.

## 0.14.3

No changes in this release.

## 0.14.2

No changes in this release.

## 0.14.1

No changes in this release.

## 0.14.0

No changes in this release.

## 0.13.0

No changes in this release.

## 0.12.0

No changes in this release.

## 0.11.1

No changes in this release.

## 0.11.0

No changes in this release.

## 0.10.0

No changes in this release.

## 0.9.0

No changes in this release.

## 0.8.0

No changes in this release.

## 0.7.1

No changes in this release.

## 0.7.0

No changes in this release.

## 0.6.1

No changes in this release.

## 0.6.0

No changes in this release.

## 0.5.1

No changes in this release.

## 0.5.0

No changes in this release.

## 0.4.0

No changes in this release.

## 0.3.0

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.

## 0.2.0

No changes in this release.

## 0.1.0

### Minor Changes

- e344058: Add the `./e2e` entry: Playwright's `test` with an API-call recorder, `expect` with `toHaveNoViolations`, `axe`,
  `apiCalls`, `seed`, `loginAs`, `evictShell`, `launchDesktop` and the `e2ePreset` config preset (`@playwright/test` and
  `@axe-core/playwright` are optional peers). `./react` now also offers navigation's route helpers `renderRoute`,
  `renderLayout`, `runRouteLoader`, `runRouteSubmit` and `routeMeta` (`@stackra/navigation` is an optional peer).
- 2787c1e: New package: the generic Stackra test kit. Its `.` entry re-exports vitest (a peer dependency) and adds
  `freezeClock` and `freezeIds` for deterministic time and ids, the `Fake` base with `Fake.of(Port)` for test doubles,
  `createMatcher` with an augmentable `Matchers` interface for custom matchers, and `factory` for plain fixture data.
  The `./react` and `./native` entries are thin wrappers over Testing Library: `render` and `renderHook` compose a
  `providers` list and a `wrapper`, `userEvent` runs one session per render, every render is cleaned up after its test,
  and `./native` adds `axe` with the `toHaveNoViolations` matcher. No entry depends on a workspace package, so every
  other package can test through it.
- a65c6bc: Add `testScopeRef(label?, { under })` and `testScopeId(label?, { under })`: stable tenant scope references and ids for
  tests, hashed as `scopeRefOf` hashes them, with no dependency on @stackra/scope.

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

Written by Changesets on release; never edited by hand.
