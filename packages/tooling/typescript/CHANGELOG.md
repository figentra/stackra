# @stackra/typescript-config

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

### Patch Changes

- f0478cd: A service's generated entity schema lists the `"~defaults"` marker the schemas file adds as a non-persisted property,
  which `EntitySchema<T>` requires (TS2741 in `.stackra/gen/entities`); a package's committed entity list does not, since
  its model type has no such key. The `service` preset turns `declaration` off (a service publishes no `.d.ts`, and the
  entity schema types name `EntityCtor` from @mikro-orm/core, which a service cannot name: TS2883), and is tested to keep
  `.stackra/encore` out of the typecheck (STA-1894, STA-1880).

## 0.5.1

No changes in this release.

## 0.5.0

No changes in this release.

## 0.4.0

No changes in this release.

## 0.3.0

### Minor Changes

- 12920dc: The base preset, and so every preset, sets `experimentalDecorators: true` (and keeps `emitDecoratorMetadata: false`):
  a member typechecks the decorated source of the workspace packages it imports through `@stackra/source`, so one on the
  `library` or `node` preset no longer fails with TS1240 and TS1270 at core's option schemas and cursor and table inputs.
- 4b591e4: Every preset's `lib` is ES2023 (Expo keeps ESNext), so `toSorted`, `toReversed`, `toSpliced`, `with` and `findLast` typecheck
  in services and libraries without `@types/node`; `target` stays ES2022.

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.

## 0.2.0

No changes in this release.

## 0.1.0

### Minor Changes

- 8505fa4: Member shapes of ADR 0126. `@stackra/typescript-config`: the `./next` preset is removed (no Next.js apps), and the
  `library` preset also typechecks `config/` beside `src/`. The example and health services declare their root module
  in `package.json` `stackra.module`.
- 53df0b3: The `library` preset sets the DOM library and `jsx: react-jsx`, so a package's `src/react/` and `src/native/` entries
  typecheck. New role presets for programming model v3: `mobile` (expo plus decorators and `.stackra/`), `service`
  (decorators plus the gen files), `tooling` (the `vite-node` program), and the gen-written `desktop` (Electron main and
  preload) and `service-worker` (WebWorker lib) programs.

### Patch Changes

- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- 4bf756f: Preset sources move into each package's `src/`. The public export specifiers are unchanged
  (`@stackra/typescript-config/node`, `@stackra/vitest-config/coverage`, …). An oxlint consumer that extends a preset by
  file path now points at `@stackra/oxlint-config/src/<preset>.jsonc`.
- dfa0c6a: The `vite` preset also typechecks an app's `e2e/` folder, where its Playwright suites live (ADR 0022 decision 3).

Written by Changesets on release; never edited by hand.
