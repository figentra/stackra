# @stackra/typescript-config

tsconfig presets. A package's `tsconfig.json` is `{ "extends": "@stackra/typescript-config/<preset>" }` and
nothing else: every compiler option lives here, with its reason below (JSON cannot carry comments, JSONC can,
so every preset file has a header).

| Preset               | Extends      | Use for                                                               |
| -------------------- | ------------ | --------------------------------------------------------------------- |
| `./base`             | —            | never directly; the shared baseline                                   |
| `./node`             | `base`       | Node scripts and tooling                                              |
| `./library`          | `node`       | a tsdown-built library (`packages/*/*`)                               |
| `./decorators`       | `library`    | a library using legacy decorators + `design:*` metadata (the DI tier) |
| `./decorators-react` | `decorators` | a library using decorators + React (DOM lib, automatic JSX)           |
| `./encore`           | `node`       | the Encore.ts application (`services`)                                |
| `./expo`             | `base`       | Expo / React Native apps (`apps/mobile`)                              |
| `./next`             | `react`      | Next.js App Router apps (`next build`, route types, `next` plugin)    |
| `./react`            | `base`       | React 19 libraries (DOM lib, automatic JSX)                           |
| `./vite`             | `react`      | Vite + React SPAs (`apps/console`)                                    |
| `./vite-node`        | `node`       | the tooling packages whose config files Vite loads                    |

## base

| Option                           | Why                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `target: ES2022`                 | Node ≥ 24 and evergreen browsers run it; tsdown/vite pick the real emit target from `engines`.         |
| `module: ESNext`                 | ESM only, everywhere.                                                                                  |
| `moduleResolution: bundler`      | Output is always produced by a bundler (rolldown via tsdown/vite).                                     |
| `strict`                         | Baseline.                                                                                              |
| `exactOptionalPropertyTypes`     | `{ a?: T }` does not accept an explicit `undefined`; keeps API and IR contracts honest.                |
| `noUncheckedIndexedAccess`       | `arr[i]` is `T \| undefined` — catches the most common runtime crash class.                            |
| `isolatedModules`                | Every file must be transpilable alone — required by oxc, which transforms per file.                    |
| `verbatimModuleSyntax`           | Imports are emitted exactly as written; `import type` is the only erased form.                         |
| `allowImportingTsExtensions`     | Relative imports inside packages say `./x.ts` so Node's type-stripping loader resolves them unbundled. |
| `declaration` + `declarationMap` | tsdown's dts step reads these: `.d.ts` for consumers, `.d.ts.map` for go-to-source.                    |
| `noImplicitOverride`             | `override` is mandatory on overriding members.                                                         |
| `noImplicitReturns`              | Every code path returns.                                                                               |
| `noUnusedLocals` / `Parameters`  | Dead code never ships; prefix `_` for intentionally unused parameters.                                 |
| `skipLibCheck`                   | Do not re-check third-party `.d.ts`.                                                                   |
| `paths: @/* → src/*`             | The `@/` alias used by apps and tests (vitest configs mirror it).                                      |

`encore` relaxes four flags because `encore.dev` ships `.ts` sources that trip them; oxlint enforces the same
hygiene on our own code there.
