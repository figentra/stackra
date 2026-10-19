# @stackra/{{NAME}}

{{DESCRIPTION}}

**Kind:** domain — a business capability in four layers. **Tier:** `tier:lib` (`packages/{{CATEGORY}}/{{NAME}}`).

## Entry points

| Import                               | Layer                                       |
| ------------------------------------ | ------------------------------------------- |
| `@stackra/{{NAME}}`                  | core + application                          |
| `@stackra/{{NAME}}/core`             | entities, value objects, invariants, errors |
| `@stackra/{{NAME}}/application`      | use cases and the ports they own            |
| `@stackra/{{NAME}}/infrastructure`   | adapters implementing those ports           |
| `@stackra/{{NAME}}/presentation/api` | transport in, application command out       |

`exports` point at source (`src/**/index.ts`); workspace hosts bundle it. `tsdown` builds `dist/` only for
publishing.

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

Run one with `pnpm turbo run <task> --filter=@stackra/{{NAME}}`.

## Structure

```text
src/
├── index.ts                         "." — re-exports core + application
├── core/                            domain meaning; imports no other layer, no host library
│   ├── {{NAME}}-record.ts           the example aggregate + its factory
│   ├── {{NAME}}-error.ts            the domain error
│   └── __tests__/
├── application/                     use cases; owns the ports it needs (imports #core only)
│   ├── {{NAME}}-repository.ts       port
│   ├── register-{{NAME}}.ts         command handler
│   └── __tests__/                   uses an in-memory fake, never infrastructure
├── infrastructure/                  adapters (imports #application, #core)
│   ├── in-memory-{{NAME}}-repository.ts
│   └── __tests__/
└── presentation/
    └── api/                         thin handlers over application commands; never imports infrastructure
        ├── register-{{NAME}}-handler.ts
        └── __tests__/
```

Cross-layer imports use the `imports` aliases (`#core`, `#application`, `#infrastructure`,
`#presentation/api`); imports inside a layer are relative, with no extension and no `/index`.
`packages/tooling/oxlint/boundaries.jsonc` fails the build on a wrong-direction import.

The `{{PASCAL}}Record` slice is a worked example that keeps `pnpm verify` green from the first commit.
Rename it to the package's real aggregate and delete what you do not need.

## Opt-in surfaces

Add these only when a real consumer needs them — empty scaffolding is a finding.

**`presentation/react`, `presentation/web`, `presentation/native`** — for each surface:

1. Create `src/presentation/<surface>/index.ts` (+ `__tests__/`). `native` composes `react`, never `web`.
2. `package.json` → `exports`: `"./presentation/<surface>": { "types": "./src/presentation/<surface>/index.ts", "default": "./src/presentation/<surface>/index.ts" }`;
   `imports`: `"#presentation/<surface>"` and `"#presentation/<surface>/*"`.
3. The host library as an **optional peer**: `peerDependencies` `"react": "catalog:frontend"` (or
   `react-native` from `catalog:mobile`) plus `peerDependenciesMeta: { "react": { "optional": true } }`, and the
   same entry in `devDependencies` for the tests.
4. `tsdown.config.ts`: add `"presentation/<surface>": "src/presentation/<surface>/index.ts"`.
5. Switch `tsconfig.json` to `@stackra/typescript-config/react` and use `@stackra/vitest-config/preset-react`
   (jsdom) for the `*.test.tsx` files.

**`resources/`** (emails, templates, widgets, dashboards, fixtures, seeds) — a top-level folder beside `src/`,
added to `files` in `package.json`. Code never lives there.
