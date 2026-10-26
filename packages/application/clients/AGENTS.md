# AGENTS — @stackra/clients

The runtime of the generated clients: the ref factories gen writes `#stackra/clients/<service>` over, `ServiceClient`,
the HTTP transport, the offline-queue sender, the React hooks, the Worker's public clients, and `fakeClient`. Member
at `packages/application/clients` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`,
`./contracts`, `./react`, `./server`, `./worker`, `./testing`.

## Where code goes

| You are writing…                   | It goes in…                                    |
| ---------------------------------- | ---------------------------------------------- |
| A port or a type it names          | `src/contracts/{ports,types,enums}/`           |
| The configuration                  | `src/config/clients.config.ts`                 |
| A ref factory                      | `src/core/functions/<name>.function.ts`        |
| A kind-factory spelling or a base  | `src/core/bases/<name>.base.ts`                |
| A transport or sender driver       | `src/core/drivers/<name>.driver.ts`            |
| A React hook                       | `src/react/<name>/`                            |
| A Worker or server-render function | `src/server/` or `src/worker/`                 |
| A test helper                      | `src/testing/`                                 |
| A test                             | `__tests__/<name>.<kind>.test.ts(x)` beside it |

## This package

- A ref describes a call; a `ClientTransport` driver makes it. Topology picks the driver (ADR 0260 decision 6), so
  nothing here knows whether a call is in process or over the network. This package ships only `http`.
- A call rejects with a `ClientError` only: a refusal decoded from the producer's envelope, `InputInvalidError`, or
  `TransportError`. The envelope is untrusted: a detail never shadows a refusal's own field.
- Refs record themselves by key (`CALL_REFS`) and by code (`REFUSAL_REFS`), so the queue can replay by key and an
  envelope decodes into the producer's class. Both registries are filled when a generated module loads.
- Offline writes are queued only after a network failure, never after a refusal, and replay with the Idempotency-Key
  minted at queue time (ADR 0059, ADR 0227: no sync engine).
- `DEVICE_ORDER` (`./contracts`) is the one spelling of the device-order headers and the acknowledged query; the
  server side imports it from here, so never spell `Stackra-Device` anywhere else. A request's `device` is the only
  way a call carries it (ADR 0338 decisions 1 and 4).
- The offline drivers (`ClientMutationSenderDriver`, `ClientReplicaSourceDriver`, `ClientAcknowledgementReaderDriver`)
  implement `@stackra/query`'s ports through the bound `ClientTransport` and check every answer's shape; a query with
  `replica` registers itself with `registerReplicas` when its ref is built.
- `ClientSession` belongs to identity: this package never reads a token store, a cookie or a claim. `isAllowed` is
  presentation; the producer's pipeline checks every call.
- An event ref extends `IntegrationEvent` (this package's one use of `@stackra/events`) so a service's inbox and bus
  treat a consumed event as a local one; keep its instances typed as the payload and `create` checking the payload.
- Public clients (`./server`) are anonymous and public-area only; any other area is refused when they are built.
- Never write "tenant" (R-59). `./contracts` imports no other entry. `src/*/index.ts` are stand-in barrels until gen
  writes them (STA-339). Two spellings of each ref factory (`actionRef` / `ClientAction`, `permissionsRef` /
  `permissionRefs`) exist because two gen revisions emit both; gen settles on one with STA-339.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

| Data                          | Where                          | Handling                                                                       |
| ----------------------------- | ------------------------------ | ------------------------------------------------------------------------------ |
| Call inputs and answers       | in memory, in transit          | Sent over the transport; cached and queued by `@stackra/query` under its rules |
| Session headers (credentials) | per call, from `ClientSession` | Asked once per call, never stored or logged here                               |
| Visitor address (`./worker`)  | `Stackra-Visitor` header       | Signed with the gateway key, forwarded once, never stored                      |
