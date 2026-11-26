# @stackra/vite-plugin

## 0.33.1

### Patch Changes

- Updated dependencies [d60f9d5]
- Updated dependencies [e885a38]
- Updated dependencies [e885a38]
- Updated dependencies [e885a38]
- Updated dependencies [e885a38]
- Updated dependencies [e885a38]
- Updated dependencies [e885a38]
- Updated dependencies [bf2c6ea]
  - @stackra/gen@0.33.1
  - @stackra/runway@0.33.1
  - @stackra/contracts@0.33.1
  - @stackra/i18n@0.33.1

## 0.33.0

### Patch Changes

- Updated dependencies [4937622]
- Updated dependencies [93d63bb]
- Updated dependencies [6186329]
- Updated dependencies [93d63bb]
- Updated dependencies [0a57fb3]
- Updated dependencies [3c47a3a]
- Updated dependencies [2e3e323]
- Updated dependencies [93d63bb]
- Updated dependencies [54aa1e7]
- Updated dependencies [4bf092e]
- Updated dependencies [93d63bb]
- Updated dependencies [41a5ff0]
- Updated dependencies [0f7448f]
- Updated dependencies [c7144a0]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
  - @stackra/i18n@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/gen@0.33.0
  - @stackra/runway@0.33.0

## 0.32.0

### Patch Changes

- Updated dependencies [597e3e8]
  - @stackra/gen@0.32.0
  - @stackra/runway@0.32.0
  - @stackra/i18n@0.32.0
  - @stackra/contracts@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [0f05f60]
- Updated dependencies [73ea174]
- Updated dependencies [5585893]
- Updated dependencies [ebfd942]
- Updated dependencies [670f75c]
- Updated dependencies [137a7f9]
  - @stackra/i18n@0.31.0
  - @stackra/gen@0.31.0
  - @stackra/runway@0.31.0
  - @stackra/contracts@0.31.0

## 0.30.0

### Patch Changes

- Updated dependencies [96b5241]
- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [04d04e4]
- Updated dependencies [0bf0a7f]
- Updated dependencies [7d60f82]
- Updated dependencies [418e195]
- Updated dependencies [e1e95d1]
- Updated dependencies [5b064da]
- Updated dependencies [dab9009]
- Updated dependencies [e1e1b5e]
- Updated dependencies [8c17109]
- Updated dependencies [ef49e63]
- Updated dependencies [a3a3190]
- Updated dependencies [0765ecc]
- Updated dependencies [f4df473]
- Updated dependencies [cd2496b]
- Updated dependencies [d5a7d0a]
- Updated dependencies [15dba8d]
  - @stackra/gen@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/runway@0.30.0
  - @stackra/i18n@0.30.0

## 0.29.0

### Patch Changes

- Updated dependencies [3361957]
- Updated dependencies [f069f95]
- Updated dependencies [edc2781]
- Updated dependencies [b26036e]
- Updated dependencies [8ad5f87]
- Updated dependencies [75ec6eb]
- Updated dependencies [1b727b9]
- Updated dependencies [45afd22]
- Updated dependencies [25b99da]
  - @stackra/gen@0.29.0
  - @stackra/runway@0.29.0
  - @stackra/i18n@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [f0be8d8]
- Updated dependencies [7a87018]
  - @stackra/gen@0.28.0
  - @stackra/runway@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/i18n@0.28.0

## 0.27.0

### Patch Changes

- Updated dependencies [fb1ae38]
  - @stackra/gen@0.27.0
  - @stackra/runway@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/i18n@0.27.0

## 0.26.0

### Patch Changes

- Updated dependencies [ec00fd8]
- Updated dependencies [081989b]
- Updated dependencies [b1603a7]
- Updated dependencies [5c0aafc]
- Updated dependencies [9b02a7c]
  - @stackra/gen@0.26.0
  - @stackra/runway@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/i18n@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [689c37b]
- Updated dependencies [8a8fa6f]
  - @stackra/gen@0.25.0
  - @stackra/runway@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/i18n@0.25.0

## 0.24.0

### Patch Changes

- Updated dependencies [35959f6]
- Updated dependencies [b4c2501]
- Updated dependencies [2df7162]
  - @stackra/gen@0.24.0
  - @stackra/runway@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/i18n@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [7ff4969]
- Updated dependencies [926faa4]
- Updated dependencies [96374f4]
- Updated dependencies [557809c]
- Updated dependencies [c26fb86]
- Updated dependencies [8b42c02]
- Updated dependencies [1083617]
- Updated dependencies [a2c8821]
- Updated dependencies [a42a80c]
- Updated dependencies [f790fa1]
- Updated dependencies [fb6e2b3]
  - @stackra/gen@0.23.0
  - @stackra/runway@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/i18n@0.23.0

## 0.22.0

### Patch Changes

- Updated dependencies [e41d9a1]
- Updated dependencies [4663a61]
  - @stackra/gen@0.22.0
  - @stackra/runway@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/i18n@0.22.0

## 0.21.0

### Minor Changes

- 2974e54: Subresource Integrity for extension bundles. The bundle build records a sha384 for every emitted file in
  `bundle.manifest.json` (`integrity`). Runway refuses to publish a bundle whose file is missing or changed since the
  build, carries each value by URL on the edge release, and the shell page pins every bundle URL with it: an
  `integrity` attribute on each modulepreload and stylesheet link, and the import map's `integrity` block for the
  chunks no link names. A bundle built before this has no `integrity` and renders as before.

### Patch Changes

- Updated dependencies [2974e54]
- Updated dependencies [ae9cb23]
- Updated dependencies [d25a7a0]
- Updated dependencies [9feea9d]
- Updated dependencies [00a2477]
- Updated dependencies [a785356]
- Updated dependencies [f184d12]
- Updated dependencies [4242bbb]
  - @stackra/gen@0.21.0
  - @stackra/runway@0.21.0
  - @stackra/contracts@0.21.0
  - @stackra/i18n@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [671c9fd]
- Updated dependencies [3b48b0f]
- Updated dependencies [6623da1]
- Updated dependencies [667a3b5]
- Updated dependencies [a7b7e58]
  - @stackra/runway@0.20.0
  - @stackra/gen@0.20.0
  - @stackra/i18n@0.20.0
  - @stackra/contracts@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [58e3066]
- Updated dependencies [58a8fa5]
- Updated dependencies [2933e48]
- Updated dependencies [bac874e]
- Updated dependencies [e105174]
- Updated dependencies [ee00741]
- Updated dependencies [5830168]
- Updated dependencies [ef04935]
- Updated dependencies [1cc3bd3]
- Updated dependencies [afd7846]
- Updated dependencies [0da5f7a]
- Updated dependencies [0921f1f]
- Updated dependencies [dd9427a]
- Updated dependencies [fc845f4]
- Updated dependencies [c239773]
- Updated dependencies [414586e]
- Updated dependencies [7a83de3]
- Updated dependencies [1f33c82]
- Updated dependencies [0e0de4f]
- Updated dependencies [0e0de4f]
  - @stackra/contracts@0.19.0
  - @stackra/gen@0.19.0
  - @stackra/runway@0.19.0
  - @stackra/i18n@0.19.0

## 0.18.1

### Patch Changes

- Updated dependencies [2a7bc6d]
- Updated dependencies [baee3a3]
  - @stackra/gen@0.18.1
  - @stackra/runway@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/i18n@0.18.1

## 0.18.0

### Patch Changes

- Updated dependencies [15cd10c]
- Updated dependencies [79dcafb]
- Updated dependencies [dbf1c33]
  - @stackra/runway@0.18.0
  - @stackra/gen@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/i18n@0.18.0

## 0.17.2

### Patch Changes

- Updated dependencies [2da4d9d]
  - @stackra/gen@0.17.2
  - @stackra/runway@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/i18n@0.17.2

## 0.17.1

### Patch Changes

- @stackra/runway@0.17.1
  - @stackra/gen@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/i18n@0.17.1

## 0.17.0

### Patch Changes

- Updated dependencies [4c6bf13]
  - @stackra/runway@0.17.0
  - @stackra/gen@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/i18n@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [89d4633]
- Updated dependencies [6ed8ab1]
- Updated dependencies [08be546]
- Updated dependencies [c6e4715]
- Updated dependencies [64cfc1d]
- Updated dependencies [5bf8ad3]
  - @stackra/runway@0.16.0
  - @stackra/gen@0.16.0
  - @stackra/i18n@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- @stackra/runway@0.15.0
  - @stackra/gen@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/i18n@0.15.0

## 0.14.4

### Patch Changes

- Updated dependencies [fda1d53]
  - @stackra/runway@0.14.4
  - @stackra/gen@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/i18n@0.14.4

## 0.14.3

### Patch Changes

- Updated dependencies [3ccf74a]
- Updated dependencies [64e4840]
  - @stackra/runway@0.14.3
  - @stackra/gen@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/i18n@0.14.3

## 0.14.2

### Patch Changes

- @stackra/gen@0.14.2
  - @stackra/runway@0.14.2
  - @stackra/i18n@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- Updated dependencies [857a7fb]
  - @stackra/runway@0.14.1
  - @stackra/gen@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/i18n@0.14.1

## 0.14.0

### Patch Changes

- Updated dependencies [54e05c6]
  - @stackra/runway@0.14.0
  - @stackra/gen@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/i18n@0.14.0

## 0.13.0

### Patch Changes

- Updated dependencies [dc4b3f0]
- Updated dependencies [5d10209]
- Updated dependencies [6e61084]
  - @stackra/runway@0.13.0
  - @stackra/gen@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/i18n@0.13.0

## 0.12.0

### Patch Changes

- Updated dependencies [e36505c]
  - @stackra/runway@0.12.0
  - @stackra/gen@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/i18n@0.12.0

## 0.11.1

### Patch Changes

- @stackra/gen@0.11.1
  - @stackra/runway@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/i18n@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [46951df]
  - @stackra/runway@0.11.0
  - @stackra/gen@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/i18n@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [a15cacf]
- Updated dependencies [4c0eead]
- Updated dependencies [4749967]
- Updated dependencies [f511762]
- Updated dependencies [e57b9a1]
- Updated dependencies [05da3d4]
- Updated dependencies [242ebe4]
- Updated dependencies [ea40871]
- Updated dependencies [0d65e3f]
- Updated dependencies [242ebe4]
- Updated dependencies [242ebe4]
- Updated dependencies [0d65e3f]
- Updated dependencies [c4348cd]
- Updated dependencies [0d65e3f]
- Updated dependencies [0d65e3f]
- Updated dependencies [0d65e3f]
- Updated dependencies [0d65e3f]
  - @stackra/runway@0.10.0
  - @stackra/gen@0.10.0
  - @stackra/contracts@0.10.0
  - @stackra/i18n@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [b210fc8]
- Updated dependencies [2aeaec8]
- Updated dependencies [3db6529]
- Updated dependencies [5030040]
- Updated dependencies [e80a99b]
- Updated dependencies [93bb1e7]
- Updated dependencies [c19ca9c]
- Updated dependencies [b0d6fcc]
- Updated dependencies [2e43c48]
- Updated dependencies [2e43c48]
- Updated dependencies [ca1614e]
- Updated dependencies [c00ae11]
- Updated dependencies [502cba1]
- Updated dependencies [94354cc]
- Updated dependencies [dbe1e9d]
- Updated dependencies [b174a17]
- Updated dependencies [2ae4f65]
- Updated dependencies [f9c825d]
- Updated dependencies [bd3f314]
  - @stackra/gen@0.9.0
  - @stackra/runway@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/i18n@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [928dcc0]
- Updated dependencies [7dd35b3]
- Updated dependencies [02c47c3]
- Updated dependencies [67e7e8f]
  - @stackra/gen@0.8.0
  - @stackra/runway@0.8.0
  - @stackra/i18n@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- Updated dependencies [448c52f]
  - @stackra/gen@0.7.1
  - @stackra/runway@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/i18n@0.7.1

## 0.7.0

### Patch Changes

- @stackra/runway@0.7.0
  - @stackra/gen@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/i18n@0.7.0

## 0.6.1

### Patch Changes

- @stackra/gen@0.6.1
  - @stackra/runway@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/i18n@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [f0478cd]
- Updated dependencies [0090b9c]
- Updated dependencies [b98f7ea]
- Updated dependencies [71bbf08]
- Updated dependencies [99750d4]
- Updated dependencies [e15d9c3]
- Updated dependencies [e250d4f]
- Updated dependencies [67dac91]
- Updated dependencies [0183006]
- Updated dependencies [a736fb5]
- Updated dependencies [b74c373]
- Updated dependencies [2ed03e2]
  - @stackra/gen@0.6.0
  - @stackra/runway@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/i18n@0.6.0

## 0.5.1

### Patch Changes

- @stackra/runway@0.5.1
  - @stackra/gen@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/i18n@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [d7f72d3]
- Updated dependencies [f7321ea]
  - @stackra/i18n@0.5.0
  - @stackra/runway@0.5.0
  - @stackra/gen@0.5.0
  - @stackra/contracts@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [0b660e0]
- Updated dependencies [3ce01cf]
- Updated dependencies [9c8d108]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [1c22c33]
- Updated dependencies [c9cf778]
- Updated dependencies [b99d4af]
- Updated dependencies [b531c97]
- Updated dependencies [0cf32d7]
- Updated dependencies [457b107]
- Updated dependencies [4561f10]
- Updated dependencies [823d985]
- Updated dependencies [d675b4d]
- Updated dependencies [ca7d004]
- Updated dependencies [1856ee0]
- Updated dependencies [d0b1ef3]
- Updated dependencies [3400ff6]
- Updated dependencies [13b7dff]
- Updated dependencies [aa21e6b]
- Updated dependencies [dbb60dc]
- Updated dependencies [bb08f25]
- Updated dependencies [5f63e58]
- Updated dependencies [1a09488]
- Updated dependencies [d065062]
- Updated dependencies [d63eb09]
- Updated dependencies [2e94f1e]
  - @stackra/gen@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/runway@0.4.0
  - @stackra/i18n@0.4.0

## 0.3.0

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [23e556c]
- Updated dependencies [d0569d2]
- Updated dependencies [4bdb23b]
- Updated dependencies [ccc0b0f]
- Updated dependencies [d05f876]
- Updated dependencies [c9296d9]
- Updated dependencies [8dead7a]
- Updated dependencies [499effb]
- Updated dependencies [ae08e09]
- Updated dependencies [4ed7315]
- Updated dependencies [d53babc]
  - @stackra/contracts@0.3.0
  - @stackra/gen@0.3.0
  - @stackra/i18n@0.3.0
  - @stackra/runway@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [9a2a6b0]
- Updated dependencies [bab9fe1]
- Updated dependencies [9085c41]
- Updated dependencies [3e4c408]
- Updated dependencies [a4b8844]
- Updated dependencies [d37c08f]
  - @stackra/gen@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/runway@0.2.0
  - @stackra/i18n@0.2.0

## 0.1.0

### Minor Changes

- 8c52f12: Add `stackra.bundleConfig(options)`, the extension-bundle build of a product UI package for one surface: every
  specifier the shell's import map resolves stays external, the bundle is written as hashed ES modules under
  `dist/bundles/<surface>/<version>/` with `bundle.manifest.json` (targets from gen's `surfaces`, entry, modulepreload
  list, stylesheets, the shared imports used). A bundled copy of a mapped package or any HeroUI Pro code fails the build;
  `proTypesOnly` (off until owner point 16.8) leaves Pro external for product CI without the licence. New types
  `BundleConfigOptions` and `ImportMap` (ADR 0436, stackra-04).
- 2787c1e: Add `@stackra/vite-plugin`, the Stackra Vite preset. `stackra()` returns the plugins every Stackra Vite build runs:
  gen's class-component pass (wired once, never forked), `#stackra/*` resolved to the real files in `.stackra/gen/`
  (ADR 0261) and a refusal of `.server` imports in the browser bundle. `stackra.viteConfig(app, options)` builds a
  member's whole Vite config from its `stackra.config.ts` and the options gen writes: the target from the mode, React or
  Cloudflare Workers with React Router framework mode by render mode, Tailwind v4, per-locale pages served under their
  prefix and written there, the PWA's per-locale manifests and `injectManifest` service worker, the desktop renderer's
  base and output folder, gzipped bundle budgets, prerendered documents from the entry's `render(url, assets)`, hidden
  source maps uploaded to Sentry and deleted, and `__BUILD_TIME__`.

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
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [854d7a9]
- Updated dependencies [0abe92d]
- Updated dependencies [ae3d280]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [94ae85f]
- Updated dependencies [62c7ae1]
- Updated dependencies [37e1aa8]
- Updated dependencies [cc8db5e]
- Updated dependencies [bbec10c]
- Updated dependencies [c857043]
- Updated dependencies [0a38324]
- Updated dependencies [9fa326c]
- Updated dependencies [3840889]
- Updated dependencies [3730669]
- Updated dependencies [fb11778]
- Updated dependencies [f55eced]
- Updated dependencies [9c799c4]
- Updated dependencies [165fae0]
- Updated dependencies [957fe36]
- Updated dependencies [cda22dd]
- Updated dependencies [a45aec8]
- Updated dependencies [727e5f7]
- Updated dependencies [783fb5b]
- Updated dependencies [401d703]
- Updated dependencies [a3611b4]
- Updated dependencies [2562581]
- Updated dependencies [cac7c42]
- Updated dependencies [d5b457f]
- Updated dependencies [2c78113]
- Updated dependencies [2787c1e]
- Updated dependencies [ca33793]
- Updated dependencies [c868bad]
- Updated dependencies [640ae17]
- Updated dependencies [7cbd46d]
- Updated dependencies [0f3325f]
- Updated dependencies [d7c5bf2]
- Updated dependencies [8c52f12]
- Updated dependencies [4f92d09]
- Updated dependencies [1ab0f73]
- Updated dependencies [2c05f14]
- Updated dependencies [780b049]
- Updated dependencies [a78c614]
- Updated dependencies [e1dde33]
- Updated dependencies [6d04650]
- Updated dependencies [2787c1e]
- Updated dependencies [d9d5187]
- Updated dependencies [fd1a986]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [914465a]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [0a20a9f]
- Updated dependencies [8b38906]
- Updated dependencies [1b4effa]
- Updated dependencies [a1eb70f]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3b19f6d]
- Updated dependencies [a32b62d]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [3ccd0ab]
- Updated dependencies [769adee]
- Updated dependencies [4135a5a]
- Updated dependencies [c927e35]
- Updated dependencies [29c2d3e]
- Updated dependencies [2787c1e]
- Updated dependencies [8d304d6]
- Updated dependencies [e344058]
- Updated dependencies [a183131]
- Updated dependencies [fbf8fa4]
- Updated dependencies [4ea8dd0]
- Updated dependencies [3a5d71d]
- Updated dependencies [3649655]
- Updated dependencies [c526bed]
- Updated dependencies [fd13f0e]
- Updated dependencies [fa41d2d]
- Updated dependencies [e756399]
- Updated dependencies [5e8114b]
- Updated dependencies [8a1be69]
- Updated dependencies [d19a3d5]
- Updated dependencies [d19a3d5]
- Updated dependencies [d19a3d5]
  - @stackra/gen@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/runway@0.1.0
  - @stackra/i18n@0.1.0

Written by Changesets on release; never edited by hand.
