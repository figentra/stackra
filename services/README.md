# `services/`

Reference backend services, one workspace member each, tagged `tier:service`
([ADR 0010](../apps/docs/src/docs/adr/0010-services-are-independent-workspace-members.mdx)). They are test beds that prove
the packages and the generator; product services live in Figentra OS
([ADR 0075](../apps/docs/src/docs/adr/0075-stackra-ships-packages-figentra-os-ships-services.mdx)).

| Service              | Package                     | Holds                                                |
| -------------------- | --------------------------- | ---------------------------------------------------- |
| [`example`](example) | `@figentra/service-example` | the reference service; root module `ExampleModule`   |
| [`health`](health)   | `@figentra/service-health`  | `GET /healthz` liveness and `GET /readyz` readiness  |

Each is a programming-model v3 member ([ADR 0294](../apps/docs/src/docs/adr/0294-programming-model-v3-grammar-folders-identities-and-naming.mdx), 0295):
`stackra.config.ts`, a root module that gen derives, feature modules under `src/modules/`, and no `main.ts`.
`stackra gen` writes the entry, the wiring and the Encore app into `.stackra/`. What each one proves, and how to run it,
is in its own README.

## Rules

- Plain TypeScript only: no `encore.dev`, `~encore/*`, `api()` or `encore.*` file. `stackra gen` emits the Encore app
  into the gitignored `.stackra/encore/`
  ([ADR 0124](../apps/docs/src/docs/adr/0124-encore-is-the-generated-runtime-target.mdx)); `pnpm validate` refuses Encore
  files here.
- Behaviour is a decorated action; `@AsEndpoint` exposes it over HTTP. Every endpoint is authenticated unless it opts
  out; errors are typed, never hand-built responses ([HTTP conventions](../.agents/rules/http-conventions.md)).
- A service never imports another service: integration events (`@OnEvent`) or typed clients only
  ([module boundary](../.agents/rules/module-boundary.md)).
- Read [the service checklist](../.agents/rules/service-checklist.md) before touching a file here.
- Add a service with `stackra new service <name> --area app --summary "<when an agent reaches for it>"` (`pnpm new service ...` is its alias), then `pnpm install` and, in the service, `stackra gen && stackra test`. `--data` adds an example module with a model, migration and unit and integration tests.

Standards: [services](../apps/docs/src/docs/standards/services.mdx).
