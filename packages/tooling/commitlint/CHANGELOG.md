# @stackra/commitlint-config

## 0.2.0

No changes in this release.

## 0.1.0

### Minor Changes

- 8da633a: New tooling preset: the commitlint rules move out of the repo root `commitlint.config.mjs` into
  `@stackra/commitlint-config`, with a `refs-issue-key` rule that is off until a repo sets it with its issue prefix.

### Patch Changes

- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- 6817794: The vitest, tsdown and commitlint presets now ship built JavaScript with `.d.ts` types in `dist`, so a project that
  installs them can load them: Node strips no types under `node_modules`. The export specifiers are unchanged
  (`@stackra/vitest-config/preset`, `@stackra/tsdown-config`, …); inside this repository they still read `src` through
  the `@stackra/source` condition.

Written by Changesets on release; never edited by hand.
