# Feature Specification: SDK fixes: the TypeScript SDK keeps a base-URL prefix, and every SDK creates the Idempotency-Key

**Feature Branch**: `figentra/sta-2067-sdk-fixes`

**Created**: 2026-11-03

**Status**: Draft <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-2067

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: User description: "Work package wp-07 of the gen coverage path: the generated TypeScript SDK keeps a
base-URL path prefix like the Python and PHP SDKs (H-51), and each SDK sends a generated `Idempotency-Key` on
non-GET calls when the caller passes none, created outside any retry (G-138, SDK half)."

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/gen (`emitSdks` only)
- **Public contract change**: additive: the generated SDKs keep their method signatures; a write without a caller
  key now carries a generated `Idempotency-Key`, and the TypeScript SDK now requests `<baseUrl><path>` for a base URL
  with a path prefix, as the Python and PHP SDKs already do. A host-only base URL requests the same URL as before.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: outbound HTTP of the generated SDKs: the new header carries a random UUID v4 and no
  personal data; the key comes from the platform's cryptographic random source in each language.
- **Secrets**: none
- **ADR needed**: no (implements ADR 0136 decision 3 and its consequence "the SDKs must generate `Idempotency-Key` for
  every client write", and the HTTP conventions rule, as written)
- **New dependencies**: none (TypeScript `crypto.randomUUID()`, Python `uuid`, PHP `random_bytes`)
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/developer/gen/README.md` (the Public SDKs paragraph)
- **Lane**: bug (a defect in existing generated behaviour, one member, no signature change)
- **Change risk**: R1 (generated output changes; every existing caller keeps working)

## Glossary _(full lane)_

- **Base-URL prefix**: a path in the base URL a caller passes (`https://example.com/api`), under which the API is
  mounted.
- **Write**: an SDK call whose endpoint method is not `GET` (`POST`, `PUT`, `PATCH`, `DELETE`).
- **Caller key**: the `idempotencyKey` (TypeScript, PHP) or `idempotency_key` (Python) argument of an SDK method.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A TypeScript caller behind a path prefix reaches the API (Priority: P1)

A caller whose API is mounted under `https://example.com/api` passes that base URL and the TypeScript SDK requests
`https://example.com/api/orders/...`, as the Python and PHP SDKs do.

**Why this priority**: H-51: today `new URL("/orders/...", "https://example.com/api")` drops `/api`, so the three
SDKs disagree and the TypeScript one calls the wrong URL.

**Independent Test**: transpile the emitted TypeScript SDK, run a method with a fake `fetch`, and read the URL.

**Acceptance Scenarios**:

1. **Given** `baseUrl: "https://example.com/api"`, **When** a method with path `/orders/:orderId/cancel` runs, **Then**
   the request URL is `https://example.com/api/orders/<id>/cancel`.
2. **Given** `baseUrl: "https://example.com/api/"`, **When** the same method runs, **Then** the URL has one slash
   between `api` and `orders`.

---

### User Story 2 - A retried write runs once without the caller minting a key (Priority: P1)

Each SDK sends an `Idempotency-Key` on every write, generated when the caller passes none, so the action pipeline's
idempotency step deduplicates a replayed request (ADR 0136 decision 3).

**Why this priority**: G-138 (SDK half): ADR 0136 says the SDKs generate the key; today they send one only when the
caller passes it.

**Independent Test**: the transpiled TypeScript SDK with a fake `fetch`; the Python and PHP text names the generator
inside the call, before the request is built.

**Acceptance Scenarios**:

1. **Given** a write called with no key, **When** it runs, **Then** the request carries an `Idempotency-Key` that is a
   UUID.
2. **Given** a write called with a key, **When** it runs, **Then** the request carries exactly that key.
3. **Given** a `GET` call, **When** it runs, **Then** the request carries no `Idempotency-Key`.

---

### Edge Cases

- **EC-01**: A host-only base URL (`https://api.example.com`, the documented form) requests the same URL as before.
- **EC-02**: A base URL with a trailing slash requests one slash between the prefix and the path, in all three SDKs.
- **EC-03**: The generated SDKs have no retry loop; the key is created once per method call, before the request is
  sent, so a later retry layer added around the request reuses it. A caller that retries by calling the method again
  passes its own key to keep the replay one call.
- **EC-04**: A TypeScript runtime with no Web Crypto (Hermes without a polyfill) passes `idempotencyKey` on writes,
  as the in-repo transport's `idempotencyKey(mint)` does there.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: WHEN a TypeScript SDK method runs THE SDK SHALL request the base URL without its trailing slashes,
  followed by the endpoint path, keeping any path prefix of the base URL.
- **FR-002**: WHEN a write is called without a caller key THE TypeScript, Python and PHP SDKs SHALL each send an
  `Idempotency-Key` generated once in that call before the request is sent (TypeScript `crypto.randomUUID()`, Python
  `uuid.uuid4()`, PHP a version 4 UUID from `random_bytes`).
- **FR-003**: WHEN a write is called with a caller key THE SDK SHALL send that key unchanged, and WHEN a `GET` call
  runs THE SDK SHALL send no `Idempotency-Key`.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN the base URL carries a path prefix THE TypeScript SDK SHALL keep it, as the Python and PHP SDKs do.
- **AC-002**: WHEN a non-GET call has no caller key THE TypeScript, Python and PHP SDKs SHALL send a generated
  `Idempotency-Key`, created outside any retry.

## Success Criteria _(mandatory)_

- **SC-001**: `emit-sdks.function.test.ts` runs the emitted TypeScript SDK against a fake `fetch` and proves FR-001 to
  FR-003, and checks the Python and PHP key generation — verified by: unit
- **SC-002**: `pnpm verify` is green for `@stackra/gen` on ci-box — verified by: manual

## Out of scope

- The gen half of G-138 (gen refusing a client write with no idempotency declaration): wp-17.
- A retry loop or a `mint` option in the generated SDKs.
- Running the emitted Python and PHP SDKs in tests (ci-box runs Node only); their text is asserted.

## Assumptions

- A UUID v4 is a valid key: the in-repo transport mints `crypto.randomUUID()` for the same header.
- The TypeScript SDK runs where Web Crypto is global (Node 19+, browsers in a secure context, Deno, Bun, Workers);
  elsewhere the caller passes its key (EC-04).
- Only `GET` is safe among the methods an endpoint takes, so "non-GET" is "write", as the SDKs already treat it for
  the body and `content-type`.

## Amendments

None.

## Status history

- 2026-11-03 · — → Draft · Claude (STA-2067 session) · created
