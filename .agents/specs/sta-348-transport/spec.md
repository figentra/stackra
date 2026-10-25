# Feature Specification: `@stackra/transport` wave 2, the HTTP client pipeline

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/transport` (foundation, wave 2) for real: a fetch pipeline of middleware for bearer auth,
retry, timeout, the `Idempotency-Key` header and the `Stackra-Version` header, plus NDJSON and server-sent-event
readers, with a `./native` terminal fetch that streams on Expo.

## Impact

- **Apps touched**: none (the generated clients of `@stackra/clients` use it; STA-344)
- **Services touched**: none
- **Packages touched**: `packages/foundation/transport` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none (headers and bodies pass through; nothing is stored or logged)
- **Secrets**: none (a bearer token is read from a caller-supplied function per request and never kept)
- **ADR needed**: no (ADR 0118 `Stackra-Version`, ADR 0138 idempotency, ADR 0140 kinds and statuses, ADR 0294 d15 and
  the ADR 0127 2026-10-24 note for entries)
- **New dependencies**: none new; `@stackra/contracts` and `@stackra/errors` through `workspace:*`; `expo`
  (`catalog:mobile`) as the optional peer of `./native`
- **Deploy modes**: same in all; `.` is isomorphic (browser, Node, Workers, React Native), `./native` is Expo only
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/foundation/transport/README.md`, `packages/foundation/transport/AGENTS.md`; ADR 0118, 0120, 0127, 0138, 0140, 0294 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R2 (every generated client call passes through it; a wrong retry rule repeats a write)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry row: entries `.` and `./native`, the native entry runs on `expo/fetch`;
  the template imports nothing from this package, `@stackra/clients` consumes it; `TransportError` and `RetryOn` belong to
  `@stackra/clients`, so this package declares neither

## User Scenarios & Testing

### User Story 1 - Compose a transport (Priority: P1)

`@stackra/clients` builds `createTransport({ middleware: [stackraVersion(apiVersion), bearerToken(session.token),
idempotencyKey(), retry({ attempts: 2 }), timeout(Duration.seconds(30))] })` and sends a standard `Request`.

**Independent Test**: `src/core/functions/__tests__/create-transport.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** middleware `[a, b]`, **When** a request is sent, **Then** `a` runs first and `b` hands it to the terminal
   fetch; with no `fetch` option the global `fetch` is called at send time.

### User Story 2 - Headers (Priority: P1)

**Independent Test**: `bearer-token`, `idempotency-key`, `stackra-version` function tests.

**Acceptance Scenarios**:

1. **Given** a token function, **When** it yields a token, **Then** `Authorization: Bearer <token>` is set; an empty or
   missing token or an `Authorization` header already set leaves the request as it is.
2. **Given** a `POST`, `PUT`, `PATCH` or `DELETE` without `Idempotency-Key`, **Then** one key is minted and kept across
   retries; a key already set (the offline queue's) is kept; `GET`, `HEAD`, `OPTIONS` get none.
3. **Given** `stackraVersion("2027-03-01")`, **Then** `Stackra-Version` is set unless the request has one; a value that
   is not a calendar date is a `RangeError` when the middleware is built.

### User Story 3 - Retry and timeout (Priority: P1)

**Independent Test**: `retry`, `timeout` function tests, `request-timed-out.error.test.ts`.

**Acceptance Scenarios**:

1. **Given** a request safe to repeat (`GET`, `HEAD`, `OPTIONS`, `PUT`, `DELETE`, or any method carrying
   `Idempotency-Key`), **When** fetch fails or times out, **Then** it is sent again up to `attempts`; a `POST` without a
   key is never repeated.
2. **Given** a response whose status is that of a retryable `ErrorKind` (429, 503), **Then** it is retried after
   `Retry-After` or the backoff, unless its envelope says `retryable: false` or `Retry-After` exceeds `maxWait`.
3. **Given** `timeout(d)`, **When** no response headers arrive within `d`, **Then** the request is aborted and
   `RequestTimedOutError` (kind `Unavailable`, code `request_timed_out`, retryable) is thrown; the caller's own abort
   still cancels the request and its body.

### User Story 4 - Streams (Priority: P1)

**Independent Test**: `read-ndjson`, `read-server-sent-events` function tests.

**Acceptance Scenarios**:

1. **Given** an NDJSON body split across chunks at any byte, **Then** `readNdjson` yields each line's JSON value as
   `unknown`; blank lines are skipped.
2. **Given** a `text/event-stream` body, **Then** `readServerSentEvents` yields `{ event, data, id, retry? }` by the
   WHATWG parsing rules (comments, multi-line data, `\r\n`/`\r`/`\n`, last event id kept, unterminated event dropped).
3. **Given** a consumer that stops early, **Then** the body stream is cancelled.

### User Story 5 - Native streaming (Priority: P2)

**Independent Test**: `src/native/native-fetch/__tests__/native-fetch.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** `createTransport({ fetch: nativeFetch })` on Expo, **When** a request is sent, **Then** `expo/fetch` gets
   its URL, method, headers, body and signal, and the response body streams.

## Requirements

- **FR-001**: Entries `.` and `./native` only (registry row, ADR 0127 2026-10-24 note).
- **FR-002**: `.` exports `createTransport`, `bearerToken`, `idempotencyKey`, `stackraVersion`, `retry`, `timeout`,
  `readNdjson`, `readServerSentEvents`, `RequestTimedOutError`, `TRANSPORT_HEADERS` and the types `Middleware`,
  `Transport`, `TransportOptions`, `RetryOptions`, `ServerSentEvent`, `TokenSource`.
- **FR-003**: `./native` exports `nativeFetch` only.
- **FR-004**: The retryable statuses come from `ErrorKind`'s metadata, never a hand-written list.
- **FR-005**: Runtime dependencies `@stackra/contracts` and `@stackra/errors` only; `expo` is an optional peer.

## Success Criteria

- **SC-001**: A test beside every public symbol, plus the barrel tests, passes in the testing workflow.
- **SC-002**: No request that is not safe to repeat is ever sent twice.

## Registry items not satisfied here (by design)

- The registry row lists `config` as a dependency. Nothing in the pipeline needs a `Config` class: every option is
  passed by the generated client from its own gen-time facts, so a `TransportConfig` would be speculative. Add it, and
  the dependency, when a member needs to override transport settings per deployment.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
