# stackra

pnpm 12 + Turborepo monorepo. Global rules in `~/.claude/rules/` apply (module boundary, tenancy, secrets,
HTTP conventions, not-built-yet). Full guides: `apps/docs` (`pnpm docs`). Every member keeps its code in `src/`.

| Path                                                       | Holds                                                                                                                                                     | Tier tag       |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `apps/console`                                             | `@stackra/console` — hello-world entry `src/main.ts`                                                                                                      | `tier:app`     |
| `apps/mobile`                                              | `@stackra/mobile` — hello-world entry `src/main.ts`                                                                                                       | `tier:app`     |
| `apps/docs`                                                | `@stackra/docs` — Mintlify; `docs.json`, pages and `assets/` all in `src/`; ADRs in `src/adr`; `pnpm docs`                                                | `tier:app`     |
| `packages/<category>/<name>`                               | `@stackra/<name>`, flat inside one category: foundation, application, communication, cross-cutting, data, developer, experience, runtime, security, state | `tier:lib`     |
| `packages/tooling/*`                                       | `@stackra/{typescript,oxlint,vitest,tsdown}-config` presets                                                                                               | `tier:config`  |
| `services/<name>`                                          | `@stackra/service-<name>` — one member per service (`example`, `health`), entry `src/main.ts`                                                             | `tier:service` |
| `tools/scripts`                                            | `validate-repository.mjs` (+ test); `scaffold.mjs` (+ test) — `pnpm new <kind> <name>`, templates in `tools/scaffold`                                     | —              |
| `.agents/hooks`, `.claude/settings.json`, `opencode.jsonc` | agent hooks and config                                                                                                                                    | —              |

Rules every member follows (`pnpm validate` enforces them):

- Versions come only from `pnpm-workspace.yaml` catalogs (`catalog:<name>`) or `workspace:*`. `catalogMode: strict`.
- `turbo.json` extends `//` with exactly one tier tag; `tsconfig.json` extends one `@stackra/typescript-config` preset.
- Tests sit beside the code (`src/**/__tests__` or `*.test.ts` next to the file); no root `tests/`. App e2e lives in the app.
- A package never imports an app, a service or `encore.dev`, nor another package's `src/`.

Done = `pnpm verify` green (format, lint, typecheck, test, build, validate, boundaries, knip). Conventional commits.
