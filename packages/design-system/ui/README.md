# @stackra/ui

Stackra Design System components: one component API, contracts shared, HeroUI v3 on web, HeroUI Native and Uniwind on native.

**Tier:** `tier:lib` (`packages/design-system/ui`). Laid out in the programming model v3 (ADR 0294, 0295).

## Entry points

| Import                  | Holds                                                                             | Exports today                         |
| ----------------------- | --------------------------------------------------------------------------------- | ------------------------------------- |
| `@stackra/ui`           | `src/config/`: the config classes a host subclasses; `src/core/`: isomorphic code | `src/config/ui.config.ts`             |
| `@stackra/ui/node`      | `src/node/`: the root module and the module groups                                | `src/node/ui.module.ts`               |
| `@stackra/ui/contracts` | `src/contracts/`: the leaf (`ports/`, `enums/`, `types/`)                         | not yet: exported with its first file |
| `@stackra/ui/testing`   | `src/testing/`: `fakes/` and `matchers/`                                          | not yet: exported with its first file |
| `@stackra/ui/assets/*`  | `assets/`: static files (`public/`, `lang/`, …) at the package root (ADR 0234)    | the folder                            |

`./react` and `./native` (renderers in `react/<name>/` and `native/<name>/`) are added with `--entries react,native`
when the package is created, or by hand with their first file. `exports` point at source through the
`@stackra/source` condition; `tsdown` builds `dist/` for publishing (ADR 0025).

**Entry barrels are generated, never authored** (ADR 0294 decision 15). Until `stackra gen` writes them (STA-339),
each export names its entry's one public file directly, as the table shows.

## Structure

```text
stackra.config.ts          the member definition: static data (ADR 0295)
assets/                    static files: public/, lang/ (templates/, stubs/, data/ with their first file)
src/
├── config/ui.config.ts   UiConfig, the deploy-time configuration
├── contracts/             the leaf: ports/, enums/, types/
├── core/                  isomorphic code: services, drivers, errors, functions, schemas, blocks
├── node/                  the module: ui.module.ts and its groups (models/, actions/, queries/, …)
└── testing/               fakes/ and matchers/ for consumers' tests
```

The module groups, and the one home of every kind suffix, are on the docs page `standards/structure` (`pnpm docs`),
generated from `tools/scripts/structure.mjs`. A group folder appears with its first file. `stackra gen` writes `stackra.manifest.json` here on its first run.

## Tasks

| Task            | Command                                         |
| --------------- | ----------------------------------------------- |
| `build`         | `tsdown`                                        |
| `typecheck`     | `tsc --noEmit`                                  |
| `lint`          | `oxlint .`                                      |
| `test`          | `vitest run`                                    |
| `test:coverage` | `vitest run --coverage` (shared gate: 80/80/70) |
| `format`        | `oxfmt --write .`                               |
| `format:check`  | `oxfmt --check .`                               |
| `clean`         | `rm -rf dist coverage .turbo`                   |

Run one with `pnpm turbo run <task> --filter=@stackra/ui`.
