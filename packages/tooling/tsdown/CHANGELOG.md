# @stackra/tsdown-config

## 0.1.0

### Minor Changes

- e344058: Export `libraryPreset` (the same function as `library`) and `LibraryPresetOptions` (the options type), the names the
  generated `.stackra/tsdown.config.ts` files import. `library` stays for the in-repo `tsdown.config.ts` files.

### Patch Changes

- a3d23d9: Rule-gap B-7 (stackra-234): `typescript/explicit-module-boundary-types` at error for packages; apps, workers, tools,
  build scripts, tests, stories and e2e specs are off.
  
  The other packages: no behaviour change. Exported functions and public class members now spell the return type they
  already had: components return `ReactElement` (or `ReactElement | null`), panel overrides their base's node type,
  Pulumi helpers an object type of their resources, and zod factories their schema type. `tableInput` keeps its inferred
  schema type with a reasoned disable.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- 4bf756f: Preset sources move into each package's `src/`. The public export specifiers are unchanged
  (`@stackra/typescript-config/node`, `@stackra/vitest-config/coverage`, …). An oxlint consumer that extends a preset by
  file path now points at `@stackra/oxlint-config/src/<preset>.jsonc`.
- 6817794: The vitest, tsdown and commitlint presets now ship built JavaScript with `.d.ts` types in `dist`, so a project that
  installs them can load them: Node strips no types under `node_modules`. The export specifiers are unchanged
  (`@stackra/vitest-config/preset`, `@stackra/tsdown-config`, …); inside this repository they still read `src` through
  the `@stackra/source` condition.

Written by Changesets on release; never edited by hand.
