# @stackra/typescript-config

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
