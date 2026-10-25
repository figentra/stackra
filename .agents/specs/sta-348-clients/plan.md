# Plan: `@stackra/clients` wave 5

**Spec**: `.agents/specs/sta-348-clients/spec.md`

## Design

- Six entries from stand-in barrels (STA-339 replaces them): `.` from `src/core/index.ts`, `./contracts` from
  `src/contracts/index.ts` (the leaf), `./react`, `./server`, `./worker` and `./testing`. `src/config/` holds
  `ClientsConfig`, exported from `.`.
- Ports in `src/contracts/ports/`: `ClientTransport` (`send`, `queue` of a `ClientRequest`) and `ClientSession`
  (`headers`, `can`), each an abstract class keyed `clients.<Port>`. `TransportFailure` names why no answer was read.
- Refs are classes whose statics describe the call, defined read-only by `defineStatics`. `actionRef` and `queryRef`
  record each ref by key in `CALL_REFS`; `refusalRef` builds a `Refusal({ kind })` subclass named after the code and
  records it by code in `REFUSAL_REFS`. Decoded refusals keep their envelope under a symbol, and accessors installed
  on the prototype report the envelope's kind and `retryable`. `remoteShape` is a class typed by the schema's output
  (no `Schema` brand, so a decoded answer is the shape) with `schema`, `nullable` and `create`. The other spellings
  (`ClientAction`, `ClientQuery`, `ClientRefusal`, `remote*`, `permissionRefs`, `moduleRef`) delegate.
- `clientRequest` validates and JSON-encodes the input (`InputInvalidError` with field errors on failure).
  `httpCall` builds the `Request`, sends it through a middleware-wrapped fetch, and decodes the answer, the envelope
  (`decodeRefusal`) or a `TransportError`. `HttpClientTransportDriver` wraps `fetch` with `stackraVersion`,
  `idempotencyKey`, `retry` and `timeout` from `@stackra/transport` and asks `ClientSession` for headers per call.
- `ServiceClient` (a service) takes the transport and turns refs into members. `ClientMutationSenderDriver` replays
  by key through the transport and maps the outcome. `runAction` sends, invalidates, or queues after a network
  failure through `MutationQueue.enqueue`.
- The hooks use TanStack Query core's observers under `useSyncExternalStore` against `ServerStateCache.client`, keyed
  `[Query.key, input]`; `useIntentRouter` reads the `intents(...)` table and matches phrases read through the
  translator. `createPublicClients` and `forwardedFacts` reuse `clientRequest` and `httpCall`.
- `ClientFake` is a `ClientTransport` that answers by ref key and, through a proxy, by `ServiceClient` member path;
  `fakeClient<C>` types it as the client it replaces plus its controls.
- Wave 9 (STA-488, ADR 0338): `ClientRequest` gains `device`, which `httpCall` writes as the `DEVICE_ORDER` headers.
  `queryRef` is overloaded: with `replica` it returns the ref typed with `replica` and calls `registerReplicas` before
  `CALL_REFS.set`. The two new drivers find routes in `CALL_REFS` (the replica source) or `DEVICE_ORDER` (the
  acknowledgement reader), send through the bound `ClientTransport`, and parse the answer with a local zod schema of
  its wire form.

## Constitution Check

| Law                                   | Result | Note                                                                                                                            |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/application/clients`; imports only lib packages' public entries; no app, service or `encore.dev`        |
| Secrets (ADR 0173)                    | PASS   | no secret is read from an environment here; the visitor signing key is passed in by the Worker and never logged                 |
| Security                              | PASS   | envelopes are untrusted (no field shadowing, validated output); credentials come from `ClientSession` per call and are not kept |
| HTTP and events                       | PASS   | routes come from the producer's refs; one Idempotency-Key per write across retries and replays; no endpoint or event declared   |
| Tenancy                               | PASS   | no tenant vocabulary (R-59); no tables                                                                                          |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) runs the tests; a separate reviewer     |
| Not built yet (ADR 0227)              | PASS   | no sync engine; offline writes go through `@stackra/query`'s mutation queue; no GraphQL, no hand-written gRPC                   |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                       |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only; no new third-party dependency                                                                |
| Deploy modes (ADR 0076)               | PASS   | a client library, identical in SaaS, on-prem and air-gapped                                                                     |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                              |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                         |

- Boundaries: `./contracts` imports no other entry; `react`, `server`, `worker` and `testing` import `core` and
  `contracts`, never each other.
- Naming: one declaration per file; kind factories without a `define` prefix; errors end in `Error`.

## Properties

- **P-001**: `package.json` names `@stackra/clients` at `packages/application/clients`, and `exports` lists exactly `.`, `./contracts`, `./react`, `./server`, `./worker` and `./testing` — Validates: FR-001
- **P-002**: each barrel's export list equals its test's list, and every template import is in it — Validates: FR-002
- **P-003**: for any ref, `permission` is its key without `@<major>`, `input` and `output` are the zod schemas it was given or its shapes' `schema`, and a query ref is assignable to `LiveQueryRef` — Validates: FR-003
- **P-004**: for any envelope whose code a loaded ref declares, the decoded refusal satisfies `isRefusal(error, Ref)` with the envelope's kind and `retryable`, and no detail named like a refusal field changes `code` or `kind` — Validates: FR-004
- **P-005**: for any member call, the transport receives the ref's key, the encoded input and the caller's options, and an invalid input reaches no transport — Validates: FR-005
- **P-006**: for any write request, every attempt carries the same Idempotency-Key, route params leave the body and query string, and the answer is the output schema's parse — Validates: FR-006
- **P-007**: a run is queued if and only if the send failed with `TransportError(network)` and the queue accepts the action; a replay outcome has `code: null` exactly for not-reached failures — Validates: FR-007
- **P-008**: a hook's cache key is `[Query.key, input]` (paginated: with `"pages"` appended), so `ServerStateCache` invalidates it by the key prefix — Validates: FR-008
- **P-009**: public clients built for any area but `public` throw; a `Stackra-Visitor` signature verifies under the signing key and fails under another — Validates: FR-009
- **P-010**: for any scripted ref, the fake's answers follow the script in order (`throwsOnce` before `returns`), and `called`/`queued` list the inputs in call order — Validates: FR-010
- **P-011**: no file under `packages/application/clients/src` declares an identifier or code containing `tenant` — Validates: FR-011
- **P-012**: for any request with `device`, the HTTP request carries `Stackra-Device` equal to its id and `Stackra-Device-Sequence` exactly when it has a sequence; a replay sends the queue's `DeviceOrder` — Validates: FR-012
- **P-013**: a ref built with a well-formed `replica` carries it and is a `ReplicaRef`; a malformed one throws `RangeError` and no ref is recorded; a refresh sends `{ ...slice, cursor? }` to the query's route and returns the answer only when it has the `ReplicaChanges` shape — Validates: FR-013
- **P-014**: the acknowledged read sends the device header and `{}` to `GET /devices/acknowledged` and returns `sequence` (a positive integer or `null`), rejecting any other answer — Validates: FR-014

## Deploy modes

| Mode       | Behaviour                                                     |
| ---------- | ------------------------------------------------------------- |
| SaaS       | a client library, bundled into the apps, Workers and services |
| On-prem    | identical: the same build, calls the install's own API origin |
| Air-gapped | identical: needs no network beyond the install's own services |
