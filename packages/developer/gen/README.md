# @stackra/gen

<!--
Stackra file contract:
Purpose: the package's reader guide: what gen is, its entries and symbols, a run, what one run writes (the generated
         service clients included, and the two passes that break a cycle between services) and what is not here.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0294; ADR 0295; ADR 0260 (generated clients); ADR 0261; ADR 0263; ADR 0162 and ADR 0222
                    (the translated and upload shape kinds); ADR 0338 (a replica query's `ReplicaPage` output).
-->

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
| `.`                   | `emitClients`, `CLIENTS_SPECIFIER`                                           | `#stackra/clients/<service>`: one injectable client per consumed service (ADR 0260) |
| `.`                   | `emitToolConfigs`                                                            | `.stackra/{tsdown,vitest}.config.ts`, `.stackra/vitest.setup.ts`                    |
| `.`                   | `openApiOf`                                                                  | `openapi.json`, the projection of the manifest                                      |
| `.`                   | `actionKey`, `eventName`, `permissionKey`, `modelKey`, `tableName`, ...      | the identity formulas of ADR 0294 decision 20                                       |
| `.`                   | `integrationKey`, `webhookPath`, `sequenceKey`, `blockKey`, `routeKey`       | integration, webhook, sequence, block and route identities                          |
| `.`                   | `toolHints`, `EFFECT_TAGS`, `INTEGRATION_ROLES`                              | derived MCP hints, the effect tags and the Integration roles the manifest accepts   |
| `./node`              | `generate`                                                                   | one run: write, or `{ check: true }` for `--check`                                  |
| `./node`              | `discoverMember`, `openHost`                                                 | discovery on TypeScript 7, falling back to TypeScript 6                             |
| `./node`              | `readServiceManifests`                                                       | the committed manifests of the services a member injects a client of                |
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

## Tools, effects, listings and replacements

- **Tools by default (ADR 0360 decision 4).** A query, or an action whose `actors` include `user`, gets a `tool`
  entry (`name`, `default`, and the `hints` of ADR 0099 decision 3). `tool: false` on such a class needs a reason on
  the line above, `// reason: <why an agent may not call it>`; without one gen refuses with `tool_reason_missing`, and
  with one the entry records it as `toolOff`.
- **Effect tags (ADR 0099 decision 2, ADR 0360 decision 10).** `effects: [...]` is copied into the entry and feeds the
  hints; a tag outside `EFFECT_TAGS` is `effect_unknown`.
- **Listings (ADR 0355 decision 1, ADR 0308 rule 21).** An Integration's `roles` (plus `webhooks` when it receives
  them) and its `listing` (the entitlement reference) land on its entry; a role outside `INTEGRATION_ROLES` is
  `integration_role_unknown`.
- **Replacements.** Every `@Replaces(Base)` is listed in a `replaces` section.

## Platform field types

Besides `string`, `@Int`/`@Num` numbers, `boolean`, `Date`, enums and the member's own Schema classes, a shape field
may use these platform types (each read only when declared in a `@stackra/*` package):

| Field type                                     | zod in `#stackra/schemas`                                  | JSON Schema (manifest, openapi.json)                                            |
| ---------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `PublicId<"ord">`, `Money`, `Duration`, `Json` | `publicId("ord")`, `money()`, `duration`, `json()`         | pattern, `{ minor, currency }`, `format: duration`, any                         |
| `Url`, `Email`, `CurrencyCode`                 | `url()`, `z.email()`, `currencyCode()`                     | `format: uri`, `format: email`, `^[A-Z]{3}$`                                    |
| `Translated` (`@stackra/model`)                | locale map `.transform((values) => Translated.of(values))` | `object` of locale tag to string, `x-stackra-type: translated`                  |
| `TranslatedStrings` (`@stackra/validation`)    | locale map `.transform((values) => ({ values }))`          | the same locale map                                                             |
| `Upload<Bucket>` (`@stackra/media`)            | `Upload.schema`                                            | `{ id: "upl_…" }`, `x-stackra-type: upload`, `x-stackra-bucket: <Bucket class>` |

`@Str` and `@Trim` on a translated field apply to each locale's text. A model's `Translated` field gets
`TranslatedType` in its `EntitySchema`, so it loads back as a `Translated`. `Upload<X>` where `X` is not a Bucket class
is `shape_unknown_type`.

An action or query's `handle` answers `Promise<Output>` with a Schema class of the member. A replica query (ADR 0338)
answers `Promise<ReplicaPage>` (or `ReplicaPage<T>`) from `@stackra/actions` instead: the manifest gives it the output
`<module>.ReplicaPage` and writes that JSON Schema (rows, removed ids, cursor, `asOf`, `full`) under `schemas`, so the
OpenAPI document and the generated clients type it. Any other output is `action_handle_signature`.

## What one run writes

| File                                                    | For                  | Holds                                                                                                                                                                                                                                            |
| ------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stackra.manifest.json`, `openapi.json`                 | every member         | every locked identity: actions, events, permissions, refusals, models and prefixes, drivers, integrations, sequences, an app's blocks and routes                                                                                                 |
| `.stackra/gen/schemas/<module>.ts`                      | every member         | `X$`, `X$Check`, `registerSchemas`, `registerChanges`                                                                                                                                                                                            |
| `.stackra/gen/entities/<module>.ts`                     | a module with models | `[OptionalProps]`, one `EntitySchema` per model, `<MODULE>_ENTITIES`, `registerEntities`                                                                                                                                                         |
| `.stackra/gen/wiring.ts`, `module.ts`                   | every member         | the container wiring (with `repositoryOf(M)`, `journalOf(M)` and the platform services gen binds) and the member module                                                                                                                          |
| `.stackra/gen/registrations.ts`                         | package, service     | `registerEntities` (hosted), `registerModelPartners`, `registerEventNames`, `registerJobs`, `registerScheduledJobs`, `registerConnections`, `registerWebhookEvents`, `registerOutboundWebhooks`, `registerSequences`, `registerSearchableModels` |
| `.stackra/gen/boot.ts`                                  | service              | `boot(container, { url, signal })`: the database with the outbox writer, `segments.connect`, `EventBus#connect` and `InboxService#connect` (disconnected when `signal` aborts), the relay; nothing when `signal` has already aborted             |
| `.stackra/gen/webhooks.ts`                              | service              | `InboundWebhooksController` on `/webhooks/<module>/<name>/:connectionId`, raw body to `WebhookReceiver`                                                                                                                                          |
| `.stackra/gen/clients/<service>.ts`                     | a client consumer    | the producer's enums, shapes, refusals and integration events, one `remoteAction`/`remoteQuery` per call, `<Service>Client`                                                                                                                      |
| `.stackra/gen/prefixes.ts`                              | models with ids      | each public id prefix with the model that mints it                                                                                                                                                                                               |
| `.stackra/gen/{routes,blocks}/<runtime>.ts`             | app                  | `registerRoutes(routeTable)` (and `registerPanelPages()` on the browser with the panel), `registerBlocks`                                                                                                                                        |
| `.stackra/entry/*.ts`                                   | every member         | a package's entry barrels; a service's `server` (which hands `createApp` its `boot`), an app's `browser` and `native` entries                                                                                                                    |
| `.stackra/{tsdown,vitest}.config.ts`, `vitest.setup.ts` | package, service     | the build, the unit tier on the coverage gate, and the setup with registrations, wiring and factory partners                                                                                                                                     |

## Generated service clients

A service reaches another service only through its generated client (ADR 0260): type a constructor parameter with it
and gen does the rest.

```ts
import type { CatalogueClient } from "#stackra/clients/catalogue";

export class StorefrontService extends Service {
  constructor(private readonly catalogue: CatalogueClient) {
    super();
  }

  async product(productId: string) {
    return this.catalogue.product.get.call({ productId });
  }
}
```

- **Token.** A parameter typed with a class imported from `#stackra/clients/<service>` is a class token by its import,
  even before the file exists, so it never raises `token_not_a_class`. The wiring binds it with one dependency, the
  `ClientTransport` the topology picks (`@stackra/clients/contracts`).
- **Source.** Discovery reads the producer's committed `stackra.manifest.json` from the folder beside the member
  (`services/catalogue` next to `services/channels`), or from a dependency that ships one. Never the producer's
  source. A consumed service without a manifest is `client_service_unknown`, and a client imported under another name
  than `<Service>Client` is `client_name_mismatch`.
- **Cycles.** Services may consume each other's clients in a cycle (catalogue and stock, sales and fulfilment): gen
  runs in two passes. Pass 1 (`stackra gen --manifests`, and the first pass of every `stackra gen`) writes each
  member's manifest without its clients; a consumed service with a folder beside the member is not a refusal there.
  Pass 2 writes the clients and everything else against those manifests, in rounds until one writes nothing. A
  refused member still writes its clients (so a shape typed with a client's enum resolves next time) and its manifest
  when only workspace services stand in the way; every other output is written only when the member is clean.
  Committed manifests are the steady state from then on.
- **Shape.** Each descriptor is named after the producer's class (`GetProductQuery`, `PlaceOrderAction`); the client
  groups them by model (`client.<model>.<verb>.call(input)`, and `.queue(input)` for an action). Shapes are
  `remoteShape` classes, enums `Enum.of`, refusals `remoteRefusal`, integration events `remoteEvent`. Entries a
  hosted package brought into the producer are left out for now.
- **Events.** A listener subscribes to another service's integration event by importing its class from the client
  file and typing `handle` with it; the wire name (`<module>.<name>.v<n>`, ADR 0141) comes from the producer's
  manifest. There is no wire-name subscription: an event the producer does not publish is `client_event_unknown`, and a
  `handle` parameter that is no event class is `listener_handle_signature`. A service consumed only by a listener still
  gets its client file. The registrations then name the event's wire name (so the inbox rebuilds it) and the pair:

  ```ts
  import type { AppApproved } from "#stackra/clients/developer";

  export class ListOnAppApprovedListener extends Listener({ queue: Queues.Default }) {
    async handle(event: AppApproved, ctx: ListenerContext): Promise<void> { ... }
  }
  // .stackra/gen/registrations.ts (generated)
  registerEventNames([{ type: AppApproved, name: "developer.app.approved.v1" }]);
  registerListeners([[AppApproved, ListOnAppApprovedListener]]);
  ```

  A relay (the webhooks relay) types `handle` with `EventEnvelope` from `@stackra/outbox/contracts` and is written as
  `registerRelays([...])`: the inbox hands it every claimed envelope, typed payload or not.

- **Import map.** The member's `#stackra/*` import (`./.stackra/gen/*`) already resolves `#stackra/clients/<service>`;
  nothing else is needed.
- **Tests.** Replace the client with `fakeClient()` from `@stackra/clients/testing` through
  `createTestingModule(...).override(CatalogueClient, fake)`.

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

## Encore jobs and queues

For a service, gen writes the first parts of the Encore app (ADR 0148): `.stackra/encore/<member>/cron.ts` holds one
`CronJob` per action whose `job` has a `cron` (its endpoint calls `SchedulerService.fire(<locked key>)`; ids by
`cronJobId`, which `encoreCronJobs()` also calls) and the stored schedules' minute tick; `.stackra/encore/<member>/queues.ts`
holds one Pub/Sub `Topic` and `Subscription` per queue its job actions name, registered as `queue.<name>` for a
broker-delivered queue driver, each delivery run through `QueueWorkerService.process`. Both reach the member through the
server app's `handlers`.

`.stackra/encore/<member>/events.ts` holds one Pub/Sub `Topic` per integration event the manifest publishes, registered
under its `<module>.<name>.v<n>` wire name for the outbox's `broker` publisher. A service with a relay listener (the
webhooks relay, ADR 0260 decision 4) also gets `.stackra/encore/<member>/relay.ts`: one `Subscription` per integration
topic of the product, its own and every publishing service's beside it (`readPublisherManifests` fills
`MemberIR.publishers`), each delivery handed to `InboxService#receive`. No producer is edited to add the relay; a new
publishing service is heard on the relay service's next gen run. A service whose listeners take a
`#stackra/clients/<service>` event gets `.stackra/encore/<member>/subscriptions.ts`: one `Subscription` per consumed
event (named `<member>-<wire name>`) on the producer's generated topic, imported from its `events.ts` like the relay's,
each delivery handed to `InboxService#receive`, which runs the typed listeners; a wire name the service's relay already
hears gets none. The cross-service topic imports of `relay.ts` and `subscriptions.ts` are not yet checked by an Encore
build (STA-597). The manifest also locks each Integration's egress entry from its `baseUrl`: a fixed https
origin, or a `{field}` host kept as data with the credential-set fields it is filled from (`egress_invalid` otherwise),
and refuses a sequence outside `database/sequences/` (`sequence_misplaced`), a `@DocumentNumber` field whose sequence
is declared neither in the member nor in a dependency (`document_number_unsequenced`), and two cron actions with one
CronJob id (`cron_job_collision`). Effect tags are snake_case (`external_communication`). Each declared rule outcome
kind (`class X extends RuleOutcome({ key, label, params })`, `@stackra/rules`) is listed in `outcomes` as
`<module>.<key>` with its label and parameters, locked by class like a sequence. The boot connects the bound `HoldRegistry` and `SequenceTimeZone` and registers the legal-hold
subscriber; the wiring binds `SequenceService`, and `SettingsReader` with the market floor source, where injected.
A service that injects `RuleSetService` (`@stackra/rules/node`) gets the rules node without wiring it by hand: the
wiring binds it over `repositoryOf(Revision)` (content's revisions table) and the registrations write
`registerModelPartners([[RuleSetService, RuleSet]])`; the `RuleSet` and `Revision` entities come from the hosted
packages' entity lists. A `Projection<Row>({ key })` class (`@stackra/database`) is a binding like a service: its
listeners and queries inject it.

## Not here

Per-target outputs land with the target that owns them: an app's browser clients, navigation trees and the `keys` `toRoot` takes,
panels, resources and widgets, flags, settings pages, i18n keys, migrations, the rest of the Encore app (the server entry
hands `boot` to `createApp`, whose `EventBus` and `InboxService` connects make the relays and typed subscribers receive), the Vite, Expo, Metro, Wrangler and electron-builder configs, and the worker and desktop main
entries. The per-kind registrations of actions, permissions, roles, policies, listeners, extensions, workflows,
entitlements, buckets and segment subjects come with those targets too.
