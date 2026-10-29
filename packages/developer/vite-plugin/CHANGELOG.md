# @stackra/vite-plugin

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
