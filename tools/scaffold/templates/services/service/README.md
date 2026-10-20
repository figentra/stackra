# @figentra/service-{{NAME}}

{{DESCRIPTION}}

A plain-TypeScript service member (`tier:service`). `stackra gen` reads its root module and generates the Encore
app into `.stackra/encore` (ADRs 0090, 0091, 0124).

## Structure

```text
config/{{NAME}}.config.ts         deploy-time defaults (CF1)
src/
├── main.ts                       process entry: bootstraps the root module
├── {{NAME}}.module.ts            root module; package.json "stackra.module" points here
├── modules/                      feature modules, grouped by kind (see modules/README.md)
├── contracts/index.ts            "./contracts": types other members may import
└── __tests__/{{NAME}}.module.test.ts
```

## Tasks

| Task           | Command                       |
| -------------- | ----------------------------- |
| `build`        | `tsdown`                      |
| `typecheck`    | `tsc --noEmit`                |
| `lint`         | `oxlint .`                    |
| `test`         | `vitest run`                  |
| `format`       | `oxfmt --write .`             |
| `format:check` | `oxfmt --check .`             |
| `clean`        | `rm -rf dist coverage .turbo` |

Run one with `pnpm turbo run <task> --filter=@figentra/service-{{NAME}}`.
