# src/modules

One folder per feature module: `src/modules/<feature>/`, holding a `<feature>.module.ts` that the root module
(`src/{{NAME}}.module.ts`) imports. A new service has none; this folder stays empty until the first feature.

Inside a feature module, code is grouped by **kind**, action-centric (ADR 0126, amending ADR 0040). Create a kind
folder only when its first file exists.

| Folder         | Holds                                                                                   |
| -------------- | --------------------------------------------------------------------------------------- |
| `models/`      | persisted models (`@Model`, fields, relations)                                          |
| `actions/`     | one `@Action` class per write use case: `async handle(input, ctx)`, one transaction each |
| `queries/`     | read use cases; never write                                                             |
| `services/`    | stateful collaborators the actions inject (not HTTP controllers)                        |
| `events/`      | versioned events this module emits (`defineEvents`, `<aggregate>.<verb>.v<n>`)          |
| `listeners/`   | `@OnEvent` handlers                                                                     |
| `workflows/`   | `@Workflow` / `@Step` multi-step processes                                              |
| `policies/`    | authorization policies                                                                  |
| `permissions/` | the permission catalogue (`definePermissions`, `<module>.<resource>.<action>`)          |
| `settings/`    | `@Setting` definitions (runtime, per scope)                                             |
| `contracts/`   | types this module exposes to the service's `src/contracts` entry                        |
| `resources/`   | Filament-style panel resources (`@Resource`, `@Page`, `@Widget`) the console renders    |

Once a module has two or more files of one of these, they get their own folder too: `interfaces/`, `types/`,
`constants/`, `tokens/` (`defineToken<T>()`), `errors/`, `decorators/`.

The declaration rule: decorators annotate code (classes, methods, fields: `@Action`, `@OnEvent`, `@Setting`);
`define*` creates values other code references (`defineToken`, `defineConfig`, `definePermissions`,
`defineEvents`, `defineMeters`, `defineEntitlements`).

Not used: `controllers/`, `dtos/`, `repositories/`, `helpers/`, `utils/`. Tests sit in `__tests__/` beside the
code they test (`<subject>.test.ts`, or `.int` / `.contract` / `.e2e` / `.load` before `.test` for those tiers).

Every decorator kind is found at bootstrap by its package's Explorer through the container's `DiscoveryService`,
and by `stackra gen` at build time. Nothing here registers itself by hand.
