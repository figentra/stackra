# @stackra/clients

The runtime of Stackra's generated clients. `stackra gen` writes `#stackra/clients/<service>` from each producer's
committed manifest as classes over this package's factories; this package makes the calls. It holds the ref factories,
`ServiceClient` with `call` and `queue`, the HTTP `ClientTransport` driver, the drivers of `@stackra/query`'s offline
ports (the `MutationSender` that replays the offline queue in device order, the `ReplicaSource` that refreshes the
replicas, the `AcknowledgementReader` that syncs the offline lock), the device-order wire names, the React query and
action hooks, the Worker's public clients and forwarded facts, and `fakeClient`.

**Tier:** `tier:lib` (`packages/application/clients`). Entries `.`, `./contracts`, `./react`, `./server`,
`./worker` and `./testing`. Depends on `@stackra/contracts`, `@stackra/container`, `@stackra/config`,
`@stackra/validation`, `@stackra/errors`, `@stackra/actions` (routes, `InputInvalidError`), `@stackra/i18n`,
`@stackra/transport` (fetch middleware), `@stackra/query` (the cache, the mutation queue, the replicas), `@tanstack/query-core`
and zod. React is an optional peer for `./react`.

## What is here

| Entry         | Symbol                                                                           | Use                                                             |
| ------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `.`           | `actionRef`, `queryRef`, `eventRef`, `refusalRef`, `remoteShape`, `widgetRef`    | bases of consumed actions, queries, events, refusals, shapes    |
| `.`           | `moduleRef`, `clientModule`, `permissionsRef` (`permissionRefs`), `intents`      | consumed modules, permission statics, the intent table          |
| `.`           | `ClientAction`, `ClientQuery`, `ClientRefusal`                                   | the public-area spelling of the refs (key inside the options)   |
| `.`           | `ServiceClient`, `remoteAction`, `remoteQuery`, `remoteEvent`, `remoteRefusal`   | a service's client of another service                           |
| `.`           | `DynamicClient`, `DynamicCall`, `producerBaseUrl`                                | a call to a key registered at runtime (no generated ref)        |
| `.`           | `ClientsConfig`, `ClientsConfig$`, `ClientsOptions`                              | key `clients`: base URLs, scope header, version, timeout, tries |
| `.`           | `HttpClientTransportDriver`, `ClientMutationSenderDriver`                        | the `http` transport; the `client` sender of the offline queue  |
| `.`           | `ClientReplicaSourceDriver`, `ClientAcknowledgementReaderDriver`                 | the `client` replica source and acknowledgement reader          |
| `.`           | `TransportError`, `ServerRefusalError`                                           | no readable answer; a refusal code no loaded ref declares       |
| `.`           | `ActionInput`, `QueryOutput`, `ClientError`, `ActionRef`, `QueryRef`             | the types the template names                                    |
| `./contracts` | `ClientTransport`, `ClientSession`, `ClientRequest`, `TransportFailure`          | how calls are sent; what the session provides                   |
| `./contracts` | `DEVICE_ORDER`                                                                   | the device-order headers and the acknowledged query's key       |
| `./react`     | `useQuery`, `useInfiniteQuery`, `useQueryClient`, `useAction`, `useIntentRouter` | consumed queries and actions in a component                     |
| `./server`    | `createPublicClients`, `RetryOn`, `PublicClients`                                | a Worker's anonymous calls to the public area                   |
| `./worker`    | `forwardedFacts`                                                                 | the visitor facts a Worker forwards to the gateway              |
| `./testing`   | `fakeClient`, `ClientFake`, `fakeClientError`, `memoryTransport`                 | a scripted client for tests; the `memory` `ClientTransport`     |

## Generated clients

Gen writes one subpath per consumed service, each class under its producer's own name:

```ts
// .stackra/gen/clients/commerce.ts (generated)
export class CancelOrderAction extends actionRef("orders.order.cancel@1", {
  input: CancelOrderInput,
  output: CancelOrderOutput,
  http: { method: HttpMethod.Put, path: "/orders/:orderId/cancel" },
  risk: Risk.L2,
  confirm: I18n.orders.actions.order.cancel.confirm,
}) {}
```

- A ref's statics are the call: `key`, the derived `permission`, the `input` and `output` schemas, `endpoint`, and
  for a query `invalidateOn` and `replica`. A query with `invalidateOn` is live: the hooks refetch it on each
  broadcast. A query with `replica: { of, window, limit, scope? }` is recorded with `@stackra/query`'s
  `registerReplicas`, so it is available offline through `useReplica` (ADR 0338 decision 3).
- An event ref (`eventRef`, `remoteEvent`) is typed by its payload and is an `IntegrationEvent` of `@stackra/events` at
  runtime (written name and version from the wire name), with a static `create(values)` that checks the payload. So a
  consuming service's listener types `handle` with it, its inbox rebuilds it, and a component passes it to
  `useSubscription`; nothing subscribes by wire name (ADR 0260 decision 4).
- A refusal ref is a `Refusal` of this client. A producer's envelope decodes into it, so
  `isRefusal(error, VariantNotFoundError)` holds and `error.refusalKey` is the producer's message key. A code no
  loaded ref declares decodes into `ServerRefusalError`.
- A call rejects only with a `ClientError`: a decoded refusal, `InputInvalidError` with field errors, or
  `TransportError` (`network`, `timeout`, `response`). Never with a raw `Response`.

## Calls from a component

```ts
const kpis = useQuery(OrderKpisQuery, { range: TimeRange.Today });
const cancel = useAction(CancelOrderAction, { invalidates: [GetOrderQuery, ListOrdersQuery] });
const result = await cancel.run({ orderId }); // { queued: false, data } or { queued: true }
```

The hooks resolve the `ClientTransport` and `@stackra/query`'s `ServerStateCache` from the container. Offline, an
action the offline map lets the queue hold is queued and `run` resolves `{ queued: true }`; the queue replays it later
through `ClientMutationSenderDriver` with the Idempotency-Key minted at queue time. A capped action past its offline
cap rejects with `offline_cap_reached`. `isAllowed` reads `ClientSession.can`; it decides presentation only.

## Offline

The drivers of `@stackra/query`'s offline ports send through the bound `ClientTransport` (ADR 0338):

- `ClientMutationSenderDriver` replays a queued call with its Idempotency-Key and its device order: the request's
  `device` goes out as the `DEVICE_ORDER` headers, `Stackra-Device` and `Stackra-Device-Sequence`. The generated
  server adapter maps them onto the pipeline's `CallOptions.device` once it matched the device to the verified
  session's.
- `ClientReplicaSourceDriver` sends a replica query with the device's slice and the change cursor as its input
  (`{ legalEntityId, cursor }`, no cursor on the first fill) and checks the answer's wire form: `{ rows, removed,
cursor, asOf, full }`.
- `ClientAcknowledgementReaderDriver` asks `GET /devices/acknowledged` (`devices.device.acknowledged@1`) with the
  device header and reads `{ sequence }`, the device's last acknowledged sequence; an answer counts as a sync.

## Calls from a service

```ts
export class PricingClient extends ServiceClient {
  readonly price = { quote: this.member(QuotePriceQuery) };
}

const quote = await this.pricing.price.quote.call({ market, lines });
await this.payments.payment.void.queue({ paymentId }); // a queued call on the producer's queue
```

Topology picks the transport driver (in process, RPC or this package's `http`), so the consumer's code is the same.

## Calls to a key known only at runtime

A service that calls keys other services registered (an import target, an export source) has no generated ref for
them. `DynamicClient` calls a `DynamicCall` (`key`, `kind`, `endpoint`) over the same `ClientTransport`; the input is
JSON and the answer comes back undecoded, so the caller validates it.

```ts
const answer = await this.dynamic.call(
  {
    key: "orders.order.import_rows@1",
    kind: "action",
    endpoint: { method: "POST", path: "/orders/import-rows" },
  },
  { rows },
  { scope: job.scopePath, idempotencyKey: ctx.stepKey },
);
```

- **Base URL.** The `http` driver sends every call to its producer's base URL: `ClientsOptions.producers` maps a
  module key (`orders` of `orders.order.import_rows@1`) to a URL, and a module not listed goes to `baseUrl`
  (`producerBaseUrl`). A host behind one gateway sets nothing.
- **Scope.** `CallOptions.scope` (a scope path, `platform.acme`) travels in `ClientsOptions.scopeHeader`
  (`X-Scope-Path`, what `@stackra/scope` reads) and replaces the session's scope header for that call. The producer
  accepts it only inside the caller's grants. Without it the session's scope applies, so a job with no session passes
  the scope it runs in.

## Testing

```ts
const pricing = fakeClient<PricingClient>((fake) =>
  fake.on(QuotePriceQuery).returns(({ lines }) => ({ currency: "SAR", lines })),
);
createTestingModule(CommerceModule)
  .override(PricingClient, pricing)
  .override(PaymentsClient, fakeClient());
expect(pricing.called(QuotePriceQuery)).toHaveLength(1);
```

The fake is a `ClientTransport` and also stands in for any `ServiceClient`. Name the client when the fake is kept in a
variable (`fakeClient<PaymentsClient>()`); inline in `.override(...)` it is inferred.

`ClientFake` is also the `memory` candidate of `ClientTransport` (STA-1297): importing `./testing` (gen's Vitest setup
does it for a member on this package) registers it as a test-only driver, so `.useDrivers("memory")` binds every
generated client over one fake. `memoryTransport(app)` returns it for scripting and reading calls. A production wiring
never lists it.

```ts
const app = await createTestingModule(SalesModule).useDrivers("memory").compile();
memoryTransport(app).on(ListAvailableStockQuery).returns({ items: [] });
```
