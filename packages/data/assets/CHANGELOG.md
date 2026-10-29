# @stackra/assets

## 0.1.0

### Minor Changes

- 0061a8e: Add build-time data assets (ADR 0234, 2026-10-24 note): `AssetEntry` takes an optional `hash` (SHA-256) and
  `version`, `assets()` checks them, and `AssetLibrary.verify(entries)` and `AssetLibrary.json(entry)` refuse a data asset
  whose shipped bytes differ with `AssetHashMismatchError`, so a module with changed data does not start.
- 2787c1e: Add `@stackra/assets`, the module assets of the programming model v3.1: `assets(tree)` in `.`, which builds the
  generated `#stackra/assets` constants (`Assets.orders.public.logo_svg`) and refuses malformed `<module>::<kind>/<path>`
  keys, misplaced entries and non-relative source files; `AssetLibrary`, which resolves a public asset to the URL of
  `<module>/<kind>/<path>` on the injected `FileSystem` disk and reads any asset's bytes or UTF-8 text; the `AssetEntry`,
  `AssetKey`, `AssetTree` and `ResolvedAsset` types; and `useAsset(entry)` in `./react`. Overrides are settled by gen from
  the host's `src/overrides/<owner>/` tree (ADR 0306); nothing at runtime reads it.

### Patch Changes

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
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [d156aa8]
- Updated dependencies [6dd5245]
- Updated dependencies [a289662]
- Updated dependencies [d72a734]
- Updated dependencies [2787c1e]
- Updated dependencies [20f3fe9]
- Updated dependencies [6919ebd]
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
- Updated dependencies [3b19f6d]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [e756399]
- Updated dependencies [d19a3d5]
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/filesystem@0.1.0

Written by Changesets on release; never edited by hand.
