# @figentra/service-{{NAME}}

{{DESCRIPTION}}

A plain-TypeScript service member (`tier:service`) in the programming model v3 shape (ADR 0294, 0295). `stackra gen`
finds its root module, writes the runtime entry that boots it (`.stackra/entry/server.ts`) and generates the Encore
app into `.stackra/encore` (ADRs 0091, 0124). Nobody writes `main.ts`.

## Structure

```text
stackra.config.ts                 the member definition: static data (ADR 0295)
runway.yaml                       what the service needs at runtime (runway v3, ADR 0296)
src/
├── {{NAME}}.module.ts            the root module; feature modules join its imports
├── config/{{NAME}}.config.ts     {{PASCAL}}Config, the deploy-time configuration
├── contracts/                    the public type surface; exported with its first file
├── modules/                      feature modules, one folder each, with the group folders (modules/README.md)
└── __tests__/{{NAME}}.module.test.ts
```

`stackra gen` writes `stackra.manifest.json` and `openapi.json` here on its first run; they are committed, never
edited.

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

Run one with `pnpm turbo run <task> --filter=@figentra/service-{{NAME}}`. There is no `dev` or `start` until gen
writes the entry (STA-339).
