# @stackra/{{NAME}}

{{DESCRIPTION}}

**Tier:** `tier:lib` (`packages/{{CATEGORY}}/{{NAME}}`). Laid out entries-first (ADR 0126).

## Entry points

| Import                          | Holds                                           |
| ------------------------------- | ----------------------------------------------- |
| `@stackra/{{NAME}}`             | core: runtime-neutral code                      |
| `@stackra/{{NAME}}/resources/*` | static files (`lang/`, `stubs/`, `assets/`)     |

Optional entries, each added only with real code: `./contracts`, `./node`, `./react`, `./native`, `./testing`,
`./devtools`
(`pnpm new package <name> --entries …` or by hand: folder + `exports` key + `tsdown.config.ts` entry). `exports`
point at source through the `@stackra/source` condition; `tsdown` builds `dist/` for publishing (ADR 0025).

## Structure

```text
config/{{NAME}}.config.ts   publishable deploy-time defaults (CF1)
resources/                  static files, exported as ./resources/*
src/
├── core/                   "." — index.ts re-exports only
└── <entry>/                one folder per declared entry
```

Inside an entry, a feature module groups code by kind, each folder created with its first file: `models/`,
`actions/`, `queries/`, `services/`, `events/`, `listeners/`, `workflows/`, `policies/`, `permissions/`,
`settings/`, `contracts/`, `resources/`; and `interfaces/`, `types/`, `constants/`, `tokens/`, `errors/`,
`decorators/` once there are two or more files of that kind. No `controllers/`, `dtos/`, `repositories/`,
`helpers/` or `utils/`.

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
