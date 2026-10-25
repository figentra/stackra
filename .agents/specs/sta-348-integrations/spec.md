# Feature Specification: `@stackra/integrations` wave 4, provider descriptions, connections and the managed client

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/integrations` (communication, wave 4) for real: the `Integration({ provider, category,
levels, auth })` and `Connection<I>` kind bases of ADR 0308, the managed client with the six auth types, rate limits,
retries and typed refusals, and the `ConnectionStore` port with its `local` and `hosted` drivers. It absorbs the retired
`@stackra/connections`.

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's notifications service consumes it once converted, STA-344)
- **Packages touched**: `packages/communication/integrations` (new member)
- **Cross-service events**: none emitted here; the store host emits the connection lifecycle events
- **Tenancy and data**: a connection is owned by a user or a scope node (`ScopeRef`); the local driver keeps records in
  memory only, and the hosted driver's store host keeps them encrypted
- **Secrets**: secret names only (`@Secret("NAME")`); values are read blind from the `SecretStore` at call time or held
  by the connection store, and never logged, echoed or put in an error
- **ADR needed**: no (ADR 0308 settles the shape; ADR 0327 decides the scope reference)
- **New dependencies**: none outside the workspace; runtime edges to `@stackra/actions`, `@stackra/config`,
  `@stackra/container`, `@stackra/contracts` and `@stackra/errors`; dev dependencies from existing catalogs
- **Deploy modes**: same in all; outbound calls go only to each Integration's declared base URL
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/communication/integrations/README.md`, `packages/communication/integrations/AGENTS.md`; ADR 0308, 0305, 0327 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R2 (new public contract every provider integration, connection and store driver uses)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294,
0305, 0308). The choices recorded when it was specified:

- No tenant vocabulary (R-59): `ConnectionLevel` is `User` and `Scope`. A scope connection sits on one scope node, a
  `ScopeRef` (`id`, `path`), and serves that node and every node below it; the levels of the scope tree are deployment
  data (ADR 0327 decision 2), so none is named here.
- `subscribe()` and `unsubscribe()` are not declared on the `Connection` base, so a class without them is complete and
  one with them needs no `override`; `ConnectionWebhooks` types them.
- `ConnectedAccount` is built with `create` (ADR 0328 decision 1).
- The webhook kind is `@stackra/events`'; verification and routing are `@stackra/webhooks`' (a later wave). This package
  exports what it needs: `IntegrationWebhooks`, `InvalidSignatureError`, `resolvePlaceholders` and `ConnectionStore`.
- Build what a consumer needs today: the OAuth consent flow, lifecycle events and tombstones belong to the integrations
  service (the store host).

## User Scenarios & Testing

### User Story 1 - Describe a provider once (Priority: P1)

A module author declares `ResendIntegration extends Integration({ provider, category, levels, auth, baseUrl, rateLimits,
retry, health, webhooks, listing })` with `@Secret` platform fields, and injects it to call Resend with the platform's
key through `resend.api`.

**Independent Test**: `src/core/bases/__tests__/integration.base.test.ts`,
`src/core/functions/__tests__/managed-client.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** the template's Resend description, **When** the class is declared, **Then** the kind registry records it
   with `multiple: false`; a malformed option throws on import.
2. **Given** an API key integration, **When** `api.post("/emails", body, { idempotencyKey })` runs, **Then** the key is
   sent from the secret store, the idempotency header is set and a 503 is retried.

### User Story 2 - Hold one credential set per owner (Priority: P1)

A module author declares `ResendConnection extends Connection<ResendIntegration>` with `@Secret` fields and `check()`;
the console connects it, and a driver finds it with `connections.find(ResendConnection)`.

**Independent Test**: `src/core/bases/__tests__/connection.base.test.ts`,
`src/core/drivers/__tests__/local-connection-store.driver.test.ts`.

**Acceptance Scenarios**:

1. **Given** a check that refuses, **When** `connect` runs, **Then** nothing is stored.
2. **Given** a connection on a parent scope node, **When** `find` runs in a child node, **Then** it is found; a user's
   own connection comes first when `User` is declared first.
3. **Given** `multiple: true` and two connections on one node, **When** `find` runs, **Then** it throws
   `ConnectionAmbiguousError`.

### User Story 3 - Authenticate by any of six types (Priority: P1)

An author picks `OAuth2Code`, `OAuth2ClientCredentials`, `ApiKey`, `Basic`, `Jwt` or `None`, and the managed client adds
the credentials, renewing OAuth tokens single-flight.

**Independent Test**: `src/core/services/__tests__/integration-runtime.service.test.ts`,
`src/core/functions/__tests__/sign-jwt.function.test.ts`, `src/core/functions/__tests__/request-token.function.test.ts`.

### User Story 4 - Keep credentials in the store host (Priority: P2)

A deployment binds the `hosted` driver: the integrations service stores the credentials encrypted, renews the tokens
and revokes them, and refresh tokens never enter the caller's process.

**Independent Test**: `src/core/drivers/__tests__/hosted-connection-store.driver.test.ts`.

### User Story 5 - Test a connection without the network (Priority: P1)

A test builds a connection with `makeConnection(ResendConnection, { api: fakeIntegrationApi(...), fields })`, or puts
one in a testing module with `.withIntegrationApi` and `.withConnection`.

**Independent Test**: `src/testing/functions/__tests__/make-connection.function.test.ts`,
`src/testing/constants/__tests__/integrations-testing-plugin.constant.test.ts`.

### Edge Cases

- A placeholder with no value on the connection or the Integration: a `TypeError` naming the field, never a value.
- An absolute URL passed as a path: joined under the base URL, so the call stays on the provider's origin.
- A full rate-limit bucket: the client waits once when the wait is within `retry.maxDelay`, else
  `ProviderUnavailableError` with `retryAfterMs`.
- An expired authorization code token with no refresh token: `ProviderRefusedError` with `invalid_grant`.
- A `subscribe()` that returns a secret while the Integration names no webhook secret field: a `TypeError`.

## Requirements

- **FR-001**: The package SHALL be `@stackra/integrations` at `packages/communication/integrations`, `tier:lib`, entries
  `.` and `./testing`, with runtime dependencies on workspace packages only.
- **FR-002**: It SHALL export the symbols the template imports: `.` `AuthType`, `ConnectedAccount`, `Connection`,
  `ConnectionCheckFailedError`, `ConnectionLevel`, `ConnectionStore`, `Integration`, `IntegrationCategory`,
  `InvalidSignatureError`, `ProviderRefusedError`, `ProviderUnavailableError`, `RateLimitScope`; `./testing`
  `fakeIntegrationApi`, `makeConnection`.
- **FR-003**: `Integration` SHALL be called only, check its options when a class is declared, and give its instance an
  `api` over the platform's credentials, with its `@Secret` fields read blind at call time.
- **FR-004**: `Connection<I>` SHALL be a bare kind base whose loaded instance has a read-only `id` and `api`,
  non-enumerable secret fields, and an abstract `check()`.
- **FR-005**: The managed client SHALL resolve placeholders connection first, add the credentials of each of the six
  auth types, retry only idempotent calls or calls with an idempotency key, keep to the declared rate limits, and refuse
  with `ProviderRefusedError` (4xx) or `ProviderUnavailableError` (spent retries, full bucket) without a credential in
  the error.
- **FR-006**: `ConnectionStore` SHALL find a connection by walking the Integration's levels in order (the user, then the
  call's scope node and each node above it), refuse an ambiguous one, store a connection only after its `check()`, keep
  a subscribed webhook secret, replace an owner's connection unless `multiple`, and disconnect by unsubscribing then
  revoking; the `local` driver keeps records in memory and the `hosted` driver delegates to `ConnectionHost`.
- **FR-007**: OAuth tokens SHALL be renewed single-flight per credential before they expire, and revoked at disconnect
  when the Integration declares a revocation endpoint.
- **FR-008**: `./testing` SHALL fake the managed client by declared routes and add `.withIntegrationApi` and
  `.withConnection` to the testing module.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package.

## Open items (for the owner, not blocking)

- The template writes `ConnectionLevel.Tenant` and `ConnectedAccount.from`; under R-59 and ADR 0327 the level is
  `ConnectionLevel.Scope`, and under ADR 0328 the account is built with `create` (STA-344 converts the template).
- ADR 0308 rule 2 places connection classes in a `connections/` group; the registry row folds them into `integrations/`.
  One of the two needs a note.
- ADR 0308 rule 18 orders disconnect as revoke, then unsubscribe; the drivers unsubscribe first, because the provider
  call needs live credentials.
- The `listing.entitlement` reference and the bring-your-own OAuth app entitlement (rules 11 and 21) and the token
  keep-alive (rule 7) wait for the integrations service.
- Gen must emit `registerConnections` and wire `IntegrationRuntime` as the one constructor dependency of an integration
  binding; the gen checks of ADR 0308 stay planned (STA-340).

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
