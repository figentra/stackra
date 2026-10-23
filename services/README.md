# `services/`

Reference backend services, one workspace member each, tagged `tier:service`
([ADR 0010](../apps/docs/src/adr/0010-services-are-independent-workspace-members.mdx)). They are test beds that prove
the packages and the generator; product services live in Figentra OS
([ADR 0075](../apps/docs/src/adr/0075-stackra-ships-packages-figentra-os-ships-services.mdx)).

| Service              | Package                     | Holds                                                |
| -------------------- | --------------------------- | ---------------------------------------------------- |
| [`example`](example) | `@figentra/service-example` | the reference service; root module `ExampleModule`   |
| [`health`](health)   | `@figentra/service-health`  | the health-check service; root module `HealthModule` |

Each has an entry `src/main.ts` and a root module named by `"stackra": { "module": … }` in its `package.json`
([ADR 0090](../apps/docs/src/adr/0090-codegen-discovery-by-root-module.mdx)). Both are placeholders until the
container and action packages land.

## Rules

- Plain TypeScript only: no `encore.dev`, `~encore/*`, `api()` or `encore.*` file. `stackra gen` emits the Encore app
  into the gitignored `.stackra/encore/`
  ([ADR 0124](../apps/docs/src/adr/0124-encore-is-the-generated-runtime-target.mdx)); `pnpm validate` refuses Encore
  files here.
- Behaviour is a decorated action; `@AsEndpoint` exposes it over HTTP. Every endpoint is authenticated unless it opts
  out; errors are typed, never hand-built responses ([HTTP conventions](../.agents/rules/http-conventions.md)).
- A service never imports another service: integration events (`@OnEvent`) or typed clients only
  ([module boundary](../.agents/rules/module-boundary.md)).
- Read [the service checklist](../.agents/rules/service-checklist.md) before touching a file here.
- Add a service with `pnpm new service <name> --description "<one sentence>"`.

Standards: [services](../apps/docs/src/standards/services.mdx).
