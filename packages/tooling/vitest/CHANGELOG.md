# @stackra/vitest-config

## 0.2.0

### Minor Changes

- 1a9259b: The integration tier runs (STA-1570). `@stackra/vitest-config/int` adds `intTier(config)` and `INT_TESTS`
  (`src/**/__tests__/**/*.int.test.{ts,tsx}` and gen's `.stackra/tests/**/*.int.test.ts`); `servicePreset`'s `int`
  project uses the same globs. The members with `.int.test.ts` files gain `vitest.int.config.ts` and a `test:int` script,
  which the new turbo task `test:int` and the Quality Gate run on a Testcontainers Postgres.

## 0.1.0

### Minor Changes

- e344058: Add the role presets `appPreset`, `libraryPreset`, `mobilePreset`, `servicePreset` and `toolingPreset` that generated
  `.stackra/vitest.config.ts` files import, and point `.` at the index that exports them with `stackraVitest`.
  `./preset`, `./preset-decorators`, `./preset-react` and `./coverage` stay.

### Patch Changes

- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- 4bf756f: Preset sources move into each package's `src/`. The public export specifiers are unchanged
  (`@stackra/typescript-config/node`, `@stackra/vitest-config/coverage`, …). An oxlint consumer that extends a preset by
  file path now points at `@stackra/oxlint-config/src/<preset>.jsonc`.
- 6817794: The vitest, tsdown and commitlint presets now ship built JavaScript with `.d.ts` types in `dist`, so a project that
  installs them can load them: Node strips no types under `node_modules`. The export specifiers are unchanged
  (`@stackra/vitest-config/preset`, `@stackra/tsdown-config`, …); inside this repository they still read `src` through
  the `@stackra/source` condition.

Written by Changesets on release; never edited by hand.
