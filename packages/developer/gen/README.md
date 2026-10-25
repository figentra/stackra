# @stackra/gen

The Stackra compiler. Gen reads a member's source through the TypeScript compiler API, derives every identity and
locks it in the committed `stackra.manifest.json`, compiles shape classes to zod, writes the container wiring, the
member module and the entries, and compiles class components to function components.

**Tier:** `tier:lib` (`packages/developer/gen`). Entries `.`, `./node`, `./testing` and the `./metro-transformer` tool
hook (ADR 0127, 2026-10-24 note). Depends on `@stackra/contracts`, `@stackra/errors`, `@stackra/money`, `typescript`
7.0.2 (with 6.0.3 as `typescript6`, the fallback host) and `@babel/core`. It folds the old `ir` and `source` packages:
the committed manifest is the IR, and source is read behind one host seam, never through ts-morph.

## What is here

| Entry                 | Symbol                                                                       | Use                                                                                 |
| --------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `.`                   | `generateMember`                                                             | every file of a member from its IR, or none on an error                             |
| `.`                   | `buildManifest`, `checkIdentityLock`, `compareManifests`                     | identities, the `@Renamed` lock, backward compatibility                             |
| `.`                   | `emitSchemas`, `jsonSchemaOf`                                                | the shape compiler (`#stackra/schemas/<module>`)                                    |
| `.`                   | `emitWiring`, `emitMemberModule`, `emitPackageEntries`, `emitRuntimeEntries` | `#stackra/wiring`, `#stackra/module`, `.stackra/entry/*`                            |
| `.`                   | `emitEntities`                                                               | `#stackra/entities/<module>`: `[OptionalProps]`, `EntitySchema`, `registerEntities` |
| `.`                   | `emitRegistrations`, `emitBoot`, `emitWebhooks`                              | a service's `#stackra/registrations`, `#stackra/boot`, `#stackra/webhooks`          |
| `.`                   | `emitRoutes`, `emitBlocks`                                                   | an app's `#stackra/routes/<runtime>`, `#stackra/blocks/<runtime>`                   |
| `.`                   | `emitPrefixes`, `PUBLIC_ID_PREFIXES`                                         | `#stackra/prefixes`; the shared prefix registry (ADR 0135)                          |
| `.`                   | `emitToolConfigs`                                                            | `.stackra/{tsdown,vitest}.config.ts`, `.stackra/vitest.setup.ts`                    |
| `.`                   | `openApiOf`                                                                  | `openapi.json`, the projection of the manifest                                      |
| `.`                   | `actionKey`, `eventName`, `permissionKey`, `modelKey`, `tableName`, ...      | the identity formulas of ADR 0294 decision 20                                       |
| `.`                   | `integrationKey`, `webhookPath`, `sequenceKey`, `blockKey`, `routeKey`       | integration, webhook, sequence, block and route identities                          |
| `./node`              | `generate`                                                                   | one run: write, or `{ check: true }` for `--check`                                  |
| `./node`              | `discoverMember`, `openHost`                                                 | discovery on TypeScript 7, falling back to TypeScript 6                             |
| `./node`              | `classComponents`                                                            | the Vite plugin of the class-component pass                                         |
| `./node`              | `compileClassComponents`, `classComponentsPlugin`                            | the pass for tsdown and other Babel hosts                                           |
| `./metro-transformer` | `transform`, `getCacheKey`                                                   | Metro's `babelTransformerPath`                                                      |
| `./testing`           | `loadManifest`, `previousRelease`, `expectBackwardCompatible`                | the manifest contract test                                                          |
| `./testing`           | `loadOpenApi`, `projectOpenApi`                                              | `openapi.json` is the manifest's projection                                         |
| `./testing`           | `discoverWithGen`                                                            | the Explorer conformance test                                                       |

## A run

```ts
import { generate } from "@stackra/gen/node";

const { errors, changed } = await generate("services/commerce", { check: true });
```

Gen sorts files by path, reads each class's kind from its `extends` clause (`extends Schema`, `Action({ key })`,
`Model.with(...)`, `Page.of(X)`, `Driver(Port)`, or a class of the member), its options as constants, its partner from
the heritage type argument (`Policy<Order>`, `Extension<Point["slot"]>`), and its constructor parameter types as
tokens. A dependency is described by its committed manifest, never by its `.d.ts`. Every refusal carries a
snake_case code, a position and the fix; when there is one, nothing is written.

## What one run writes

| File                                                    | For                  | Holds                                                                                                                                                                                                                                            |
| ------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stackra.manifest.json`, `openapi.json`                 | every member         | every locked identity: actions, events, permissions, refusals, models and prefixes, drivers, integrations, sequences, an app's blocks and routes                                                                                                 |
| `.stackra/gen/schemas/<module>.ts`                      | every member         | `X$`, `X$Check`, `registerSchemas`, `registerChanges`                                                                                                                                                                                            |
| `.stackra/gen/entities/<module>.ts`                     | a module with models | `[OptionalProps]`, one `EntitySchema` per model, `<MODULE>_ENTITIES`, `registerEntities`                                                                                                                                                         |
| `.stackra/gen/wiring.ts`, `module.ts`                   | every member         | the container wiring (with `repositoryOf(M)`, `journalOf(M)` and the platform services gen binds) and the member module                                                                                                                          |
| `.stackra/gen/registrations.ts`                         | package, service     | `registerEntities` (hosted), `registerModelPartners`, `registerEventNames`, `registerJobs`, `registerScheduledJobs`, `registerConnections`, `registerWebhookEvents`, `registerOutboundWebhooks`, `registerSequences`, `registerSearchableModels` |
| `.stackra/gen/boot.ts`                                  | service              | `boot(container, { url, signal })`: the database with the outbox writer, `segments.connect`, the relay                                                                                                                                           |
| `.stackra/gen/webhooks.ts`                              | service              | `InboundWebhooksController` on `/webhooks/<module>/<name>/:connectionId`, raw body to `WebhookReceiver`                                                                                                                                          |
| `.stackra/gen/prefixes.ts`                              | models with ids      | each public id prefix with the model that mints it                                                                                                                                                                                               |
| `.stackra/gen/{routes,blocks}/<runtime>.ts`             | app                  | `registerRoutes(routeTable)` (and `registerPanelPages()` on the browser with the panel), `registerBlocks`                                                                                                                                        |
| `.stackra/entry/*.ts`                                   | every member         | a package's entry barrels; a service's `server`, an app's `browser` and `native` entries                                                                                                                                                         |
| `.stackra/{tsdown,vitest}.config.ts`, `vitest.setup.ts` | package, service     | the build, the unit tier on the coverage gate, and the setup with registrations, wiring and factory partners                                                                                                                                     |

## The contract test

```ts
import { expectBackwardCompatible, loadManifest, previousRelease } from "@stackra/gen/testing";

it("only adds to the last release", async () => {
  expectBackwardCompatible(
    await previousRelease("@acme/loyalty-kit"),
    await loadManifest("./stackra.manifest.json"),
  );
});
```

## Class components

`class Counter extends Component<CounterProps>` (with `Component` from `#stackra/ui`) compiles to
`function Counter(props: CounterProps)`: fields become state, `use*` fields hooks, methods functions, `mount()` and
`unmount()` one effect, `render()` the body. The generated Vite config puts `classComponents()` first; the generated
Metro config sets `babelTransformerPath` to `@stackra/gen/metro-transformer`.

## Not here

Per-target outputs land with the target that owns them: clients, navigation trees and the `keys` `toRoot` takes,
panels, resources and widgets, flags, settings pages, i18n keys, migrations, the Encore app (which calls `boot` and
subscribes the inbox), the Vite, Expo, Metro, Wrangler and electron-builder configs, and the worker and desktop main
entries. The per-kind registrations of actions, permissions, roles, policies, listeners, extensions, workflows,
entitlements, buckets and segment subjects come with those targets too.
