# Feature Specification: `@stackra/clients` wave 5: the generated-client runtime

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/clients` (application, wave 5) for real. `stackra gen` writes `#stackra/clients/<service>`
from each producer's committed manifest as classes over this package's factories, and this package makes the calls:
the ref factories (actions, queries, events, refusals, shapes, widgets, modules, permissions, intents),
`ServiceClient` with `call` and `queue`, the HTTP `ClientTransport` driver, the `MutationSender` driver
`@stackra/query`'s offline queue needs, the React query and action hooks, the Worker's public clients and forwarded
facts, and `fakeClient`.

## Impact

- **Apps touched**: none. The template's console, mobile and web apps import the refs through their generated
  `#stackra/clients/<service>`, the hooks from `./react`, the public clients from `./server` and `./worker`, and the
  fakes from `./testing` (STA-344)
- **Services touched**: none. The template's commerce and notifications services extend `ServiceClient` in their
  generated clients and override them with `fakeClient` in tests
- **Packages touched**: `packages/application/clients` (new member)
- **Cross-service events**: none published; event refs only name consumed integration events
- **Tenancy and data**: no tables, no storage. Inputs and answers pass through in memory; the cache and the queue are
  `@stackra/query`'s. No tenant vocabulary (R-59)
- **Secrets**: none read by the package. `forwardedFacts` takes the gateway's visitor signing key from the Worker's
  validated env and never logs it
- **ADR needed**: no (ADR 0059, 0079, 0082, 0138, 0140, 0142, 0155, 0237, 0260, 0261, 0294, 0305, owner decisions R-12,
  R-25, R-56, R-59 and the owner's Q4 answer on runtime-target entries)
- **New dependencies**: none outside the workspace and existing catalogs: `@stackra/actions`, `config`, `container`,
  `contracts`, `errors`, `i18n`, `query`, `transport`, `validation` through `workspace:*`; `@tanstack/query-core` and
  `zod` through `catalog:`; `react` through `catalog:frontend` as an optional peer
- **Deploy modes**: same in all; the HTTP driver calls the configured API origin only
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/application/clients/README.md`, `packages/application/clients/AGENTS.md`; the cited ADRs are amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R2 (a call carries the user's credential and a queued write is user work: refusals decode without
  trusting the envelope, a write keeps one Idempotency-Key across retries and replays, and nothing is queued after a
  refusal)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24. The choices made when it was built:

- Registry row and template: the template's generated clients use three spellings from different gen revisions
  (`actionRef`/`queryRef`/`moduleRef`/`permissionsRef` in mobile, `clientModule`/`permissionRefs` in the console,
  `ClientAction`/`ClientQuery`/`ClientRefusal` in web, `remoteAction`/`remoteQuery`/`remoteEvent`/`remoteRefusal` in
  services). All ship; each alias delegates to one implementation, marked as a shortcut until gen settles (STA-339)
- Owner Q4: extra entries fold into the standard set plus runtime targets. The registry row says `./edge` for
  `forwardedFacts`; the template imports `@stackra/clients/worker`, so the entry is `./worker`, as
  `@stackra/platform` names it
- Owner R-25: a query ref with `invalidateOn` (top level or in `cache`) is live; the hooks watch it through
  `ServerStateCache.watch` and add no transport of their own
- ADR 0260 decision 6: topology picks the transport, so this package ships only the `http` driver of
  `ClientTransport`; the in-process and RPC drivers are gen's per topology
- Builder, recorded for review: `ClientSession` (headers, `can`) is a port here that identity implements, since the
  mobile wiring lists `clients` as depending on `identity`; a queued call over HTTP sends `Prefer: respond-async`
  (RFC 7240); `Stackra-Visitor` is `<address>;<unix seconds>;<base64url HMAC-SHA256>`; public clients refuse any area
  but the public one; `useIntentRouter` matches phrases locally (no model call) and proposes an empty input; `risk` is
  text until `@stackra/iam` ships `Risk`

## User Scenarios & Testing

### User Story 1 - Show and change a producer's data in an app (Priority: P1)

The dashboard reads `useQuery(OrderKpisQuery, { range })`, which refetches when an `OrderPaid` is broadcast. The order
screen cancels with `useAction(CancelOrderAction, { invalidates: [GetOrderQuery] })`; a refusal shows its translated
message from `error.refusalKey`.

**Independent Test**: `packages/application/clients/src/react/query/__tests__/use-query.test.tsx`,
`packages/application/clients/src/react/action/__tests__/use-action.test.tsx`,
`packages/application/clients/src/core/functions/__tests__/http-call.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a cached answer under `[OrderKpisQuery.key, input]`, **When** the screen renders, **Then** it shows the
   answer without a fetch.
2. **Given** a producer's `404` envelope with code `variant_not_found`, **When** the call rejects, **Then**
   `isRefusal(error, VariantNotFoundError)` holds and its kind is `not_found`.
3. **Given** a proxy's `502` without an envelope, **When** the call rejects, **Then** it is a `TransportError` with
   reason `response`.

### User Story 2 - Keep working offline (Priority: P1)

A till user creates an order with no network. `run` resolves `{ queued: true }`; the queue replays the call later
through `ClientMutationSenderDriver` with the same Idempotency-Key and reports a `409` as a conflict with the server's
record.

**Independent Test**: `packages/application/clients/src/core/functions/__tests__/run-action.function.test.ts`,
`packages/application/clients/src/core/drivers/__tests__/client-mutation-sender.driver.test.ts`.

### User Story 3 - Call another service (Priority: P1)

Commerce prices an order with `this.pricing.price.quote.call(input)` and voids a payment with
`this.payments.payment.void.queue(input)`; a test overrides both clients with `fakeClient`.

**Independent Test**: `packages/application/clients/src/core/bases/__tests__/service-client.base.test.ts`,
`packages/application/clients/src/testing/__tests__/client.fake.test.ts`.

### User Story 4 - Render a public page from a Worker (Priority: P2)

The web Worker builds `createPublicClients(...)` per request with the locale, the market and `forwardedFacts(request,
...)`, and loads the plan ladder anonymously.

**Independent Test**: `packages/application/clients/src/server/functions/__tests__/create-public-clients.function.test.ts`,
`packages/application/clients/src/worker/functions/__tests__/forwarded-facts.function.test.ts`.

### Edge Cases

- An invalid input is refused with `InputInvalidError` and field errors before any transport runs.
- An envelope detail named like a refusal field (`code`, `kind`, `message`) is dropped, never shadowing it.
- A code no loaded ref declares decodes into `ServerRefusalError` that keeps the code.
- A refusal is never queued; an online-only action rethrows the network error.
- A replayed action no loaded ref has is refused for good (`unknown_action`) instead of waiting forever.
- A URL the platform cannot resolve (an empty base URL outside a browser) throws instead of passing as offline.

## Requirements

- **FR-001**: The package SHALL be `@stackra/clients` at `packages/application/clients`, `tier:lib`, with entries `.`,
  `./contracts`, `./react`, `./server`, `./worker` and `./testing`.
- **FR-002**: It SHALL export every symbol the template imports from it: `.` `ActionInput`(t), `ClientAction`,
  `ClientError`(t), `ClientQuery`, `ClientRefusal`, `QueryOutput`(t), `ServiceClient`, `TransportError`,
  `actionRef`, `clientModule`, `eventRef`, `intents`, `moduleRef`, `permissionRefs`, `permissionsRef`, `queryRef`,
  `refusalRef`, `remoteAction`, `remoteEvent`, `remoteQuery`, `remoteRefusal`, `remoteShape`, `widgetRef`;
  `./react` `IntentMatch`(t), `useAction`, `useInfiniteQuery`, `useIntentRouter`, `useQuery`, `useQueryClient`;
  `./server` `PublicClients`(t), `RetryOn`, `createPublicClients`; `./worker` `forwardedFacts`; `./testing`
  `fakeClient`, `fakeClientError`.
- **FR-003**: An action or query ref SHALL carry its versioned key, the permission derived from it, its input and
  output schemas (from a zod schema or a remote shape) and its route as statics, a query also its invalidating
  events, and fit `@stackra/query`'s `LiveQueryRef` and `OfflineActionRef`.
- **FR-004**: A call SHALL reject only with a `ClientError`: a refusal decoded from the producer's envelope into the
  loaded refusal ref of that code (the action's module first) with the envelope's kind and `retryable`,
  `InputInvalidError`, or `TransportError`; an envelope detail SHALL never shadow a refusal's own field.
- **FR-005**: A `ServiceClient` member SHALL call (and for an action queue) through the injected `ClientTransport`
  with the caller's options, after validating the input.
- **FR-006**: The `http` driver SHALL fill route params from the input, send the rest as a query string (`GET`) or
  JSON, add the session's headers, the pinned `Stackra-Version` and one Idempotency-Key per write kept across
  retries, and decode the answer by the output schema.
- **FR-007**: A run SHALL be queued only after a network failure and only for an action the offline map lets the
  queue hold; the `client` sender SHALL replay with the queued key and report sent, refused for good (code and the
  server's record) or not reached.
- **FR-008**: The query hooks SHALL cache by `[Query.key, input]` in `ServerStateCache`, fetch through the transport,
  and watch a live query.
- **FR-009**: Public clients SHALL serve the public area only, carrying the version, locale, market and forwarded
  facts; `forwardedFacts` SHALL sign the visitor's address with HMAC-SHA256.
- **FR-010**: `fakeClient` SHALL answer calls from a script by ref, record calls and queued calls, and stand in for a
  `ServiceClient`'s members.
- **FR-011**: No identifier, code or text SHALL use tenant vocabulary.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here). The package typechecks.
- **SC-003**: `oxfmt` and `oxlint` are clean on the package, and `validate-repository.mjs` reports nothing for it.

## Open items (for the owner, not blocking)

- A fake kept in a variable and then passed to `.override(Client, fake)` must name the client
  (`fakeClient<PaymentsClient>()`); inline it is inferred. The template's commerce and notifications tests change
  in STA-344.
- `risk` is text until `@stackra/iam` ships `Risk`; the console palette indexes its labels by `Risk`.
- `useIntentRouter` matches the declared phrases locally and proposes an empty input; a model-backed router for text
  that matches no phrase is not built.
- `ClientSession` needs identity's driver, and the template's render helpers (`render(..., { clients })`,
  `runRouteSubmit`) need to route calls to the fakes (`ClientFake.knows`); both live outside this package.
- One amendment of ADR 0126/0127 records the runtime-target entries (`./server`, `./worker`) and the `application`
  placement (owner Q4 and Q7 answers).

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · spec for a package written in owner mode (develop now, test later)
