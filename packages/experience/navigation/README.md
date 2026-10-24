# @stackra/navigation

Router bindings for the Stackra Design System: route overlays, navigation items and the shell's links, on React Router 7 and React Navigation.

**Tier:** `tier:lib` (`packages/experience/navigation`). Laid out in the programming model v3 (ADR 0294, 0295).

## Entry points

| Import                          | Holds                                                                              | Exports today                         |
| ------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------- |
| `@stackra/navigation`           | `src/config/`: the config classes a host subclasses; `src/core/`: isomorphic code  | `src/config/navigation.config.ts`     |
| `@stackra/navigation/node`      | `src/node/`: the root module and the module groups                                 | `src/node/navigation.module.ts`       |
| `@stackra/navigation/contracts` | `src/contracts/`: the leaf (`ports/`, `enums/`, `types/`)                          | `src/contracts/index.ts` (stand-in)   |
| `@stackra/navigation/react`     | `src/react/`: React Router 7 bindings (route overlay, link seam, leave blocker)    | `src/react/index.ts` (stand-in)       |
| `@stackra/navigation/native`    | `src/native/`: React Navigation 7 bindings (route overlay, link seam, leave guard) | `src/native/index.ts` (stand-in)      |
| `@stackra/navigation/testing`   | `src/testing/`: `fakes/` and `matchers/`                                           | not yet: exported with its first file |
| `@stackra/navigation/assets/*`  | `assets/`: static files (`public/`, `lang/`, …) at the package root (ADR 0234)     | the folder                            |

`./react` (React Router 7), `./native` (React Navigation 7) and `./contracts` hold RouteOverlay, the router link seam and
the leave confirmation (wave 6, ADR 0317). `@stackra/ui` is a
dependency and stays router-free: the router bindings live here, and the routers are optional peers. `exports` point at source through the
`@stackra/source` condition; `tsdown` builds `dist/` for publishing (ADR 0025).

**Entry barrels are generated, never authored** (ADR 0294 decision 15). Until `stackra gen` writes them (STA-339),
each export names its entry's one public file directly, as the table shows.

## Structure

```text
stackra.config.ts          the member definition: static data (ADR 0295)
assets/                    static files: public/, lang/ (templates/, stubs/, data/ with their first file)
src/
├── config/navigation.config.ts   NavigationConfig, the deploy-time configuration
├── contracts/             the leaf: ports/, enums/, types/
├── core/                  isomorphic code: services, drivers, errors, functions, schemas, blocks
├── node/                  the module: navigation.module.ts and its groups (models/, actions/, queries/, …)
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

Run one with `pnpm turbo run <task> --filter=@stackra/navigation`.
