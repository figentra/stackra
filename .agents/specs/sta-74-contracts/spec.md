# Feature Specification: @stackra/contracts, the shared kernel primitives

**Feature Branch**: `figentra/sta-74-contracts-spec`

**Created**: 2026-10-20

**Status**: Draft <!-- Draft → Clarified → Planned → Ready → Implementing → Verified, or Abandoned / Superseded; spec-gate ci checks the artifacts each stage needs -->

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

<!-- Folder: .agents/specs/sta-n-<slug>/, named by the Linear key below (ADR 0120 D1). -->

**Linear**: STA-74 <!-- the Linear issue for this spec; the plan gate needs a real key -->

**Linear project**: Foundation kernel

**Clarifications status**: pending <!-- /speckit.clarify sets this to "complete" when nothing is open -->

**Input**: User description: "Port and adapt `@figentra-os/contracts` as `@stackra/contracts` (roadmap W1.1, STA-74): PublicId, Actor, EventEnvelope, Page and cursor, the error kinds with STK codes, the diagnostics catalogue with the STK prefix, and ApiVersion. Zero runtime dependencies."

## Impact _(mandatory, answer every line before /speckit.clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/foundation/contracts` (new member, `@stackra/contracts`) [NEEDS CLARIFICATION: FW2 — recommended: a, `contracts` sits in `foundation`]
- **Cross-service events**: none published or consumed; the package defines the `EventEnvelope` every integration event carries (ADR 0117 D1, 0078)
- **Tenancy and data**: none; no tables. The envelope and `Actor` carry a tenant id but own no data (ADR 0098 D6)
- **Secrets**: none. `Actor.credential` names the credential by reference, never its value (ADR 0098 D6)
- **ADR needed**: yes: the package design record for an adapt row (ADR 0018, roadmap common definition of done); no new architecture decision
- **New dependencies**: none at runtime (roadmap W1.1 "zero runtime deps"). Dev only: `fast-check` for the property tests the source already has; it is not in a catalog today, so `dependency-steward` adds it
- **Deploy modes**: same in all three; the package does no I/O and makes no outbound call (ADR 0076 D2, D3)
- **Lane**: full (roadmap W1.1; a new package is R2 or higher, ADR 0120 D4)
- **Change risk**: R2: a new package whose exports are public contracts for every other member (ADR 0120 D16)

## Source and port action

Ported from `/Users/akouta/Projects/figentra/packages/os/foundation/contracts` (`@figentra-os/contracts` 0.1.0, UNLICENSED,
seven modules, about 1,300 lines, one `.` entry). Action: **port + adapt** (ADR 0084 D2; owner Round 8 F1), relicensed MIT on
port (ADR 0024, 0084).

| Source module    | Source exports (summary)                                                            | Action in Stackra                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `ids.ts`         | `PublicId`, `IdPrefix`, `idPrefix`, `format/parse/isPublicId`, `uuidv7`, codec      | Keep; align encoding with ADR 0082 and DA9                                                              |
| `auth.ts`        | `AuthData`, `AuthMethod`, `ActorRef`, `TenantStatus`, `actorOf`                     | Replace `ActorRef` with the 0098 `Actor`; `AuthData` leaves (identity owns it, ADR 0087, 0093)          |
| `envelope.ts`    | `EventEnvelope`, `AggregateRef`, `DataClassification`, `eventTopicName`             | Keep; actor becomes `Actor` with the `onBehalfOf` chain; drop `applicationId`                           |
| `diagnostics.ts` | `Diagnostic`, `DIAGNOSTIC_CATALOGUE` (FDL, FIR, FRG, FCN, FRT ranges), `diagnostic` | Keep the catalogue and helpers; prefix `STK` (ADR 0084 D1, owner X3); drop the FDL ranges (ADR 0092 D3) |
| `pagination.ts`  | `Page`, `PageRequest`, `encode/decodeCursor`, `clampLimit`, `pageOf`                | Keep; align defaults and shape with the HTTP conventions rule                                           |
| `gates.ts`       | `Gate`, `GateContext`, `GateResult`, kinds, affordances, `evaluateGates`            | Keep the one gate contract (ADR 0081 D2); drop the fixed kind order                                     |
| `versioning.ts`  | `ApiVersion`, `apiVersion`, `Figentra-Version` and deprecation header names         | Keep; rename the headers to `Stackra-*` (ADR 0118 V2, 0083)                                             |
| none             | none                                                                                | **Add** the nine error kinds with STK codes (FW7)                                                       |

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A package author shares ids, actors and pages without a cycle (Priority: P1)

A package author (database, actions, tenancy) imports `PublicId`, `Actor` and `Page` from one place that depends on nothing,
so no package needs another domain package to speak about who did what to which record.

**Why this priority**: every W1.2 and later package imports this one (roadmap dependency graph); nothing else can start without it.

**Independent Test**: install `@stackra/contracts` alone into an empty TypeScript project and round-trip a public id, build an
`Actor` with a delegation chain, and page a list; the project has no other dependency.

**Acceptance Scenarios**:

1. **Given** a UUIDv7 and the prefix `user`, **When** the author formats then parses it with the same prefix, **Then** the
   original UUID comes back and the public id is `user_` plus 26 base32 characters.
2. **Given** a public id with prefix `user`, **When** it is parsed with prefix `tkt`, **Then** parsing fails with an
   STK-coded `invalidArgument` error before any query runs.
3. **Given** 21 rows and a limit of 20, **When** the author builds a page, **Then** it holds 20 items, `hasMore` is true and
   `nextCursor` decodes to the key of the last item.

---

### User Story 2 - A service author throws typed errors that become the right HTTP status (Priority: P1)

A service author throws a `notFound` or `permissionDenied` error from plain TypeScript (no `encore.dev` import, ADR 0091), and
gen maps the kind to the matching `APIError`.

**Why this priority**: services may not import `encore.dev` (ADR 0091, boundaries rule), so without typed kinds every domain
error surfaces as a 500 (ADR 0091 consequences, spike constraint 4).

**Independent Test**: construct each of the nine kinds and check its `kind`, STK `code`, message and `cause`, and that a type
guard tells it from a plain `Error`.

**Acceptance Scenarios**:

1. **Given** a handler that throws a `notFound` error, **When** gen's mapper reads it, **Then** it sees `kind: "notFound"` and
   a stable STK code, with no Encore type involved.
2. **Given** a plain `Error`, **When** the guard runs, **Then** it reports "not a Stackra error", so gen treats it as an
   `internal` 500 and reports it.

---

### User Story 3 - gen and tooling report problems by stable STK codes (Priority: P2)

gen, the container's scan and plan, the IR and the registry emit diagnostics from one catalogue. Agents and UIs key on the code,
never the message text.

**Why this priority**: gen's validation pass (ADR 0090, owner G2) and the container plan (W1.2) both need the catalogue, but
they ship after W1.1.

**Independent Test**: build a diagnostic from a catalogue code with parameters and check the filled message, hint, severity
override and the sort order of a mixed list.

**Acceptance Scenarios**:

1. **Given** a catalogue code and its parameters, **When** `diagnostic()` builds it, **Then** placeholders are filled and an
   unknown placeholder stays visible verbatim.
2. **Given** the full catalogue, **When** the test suite runs, **Then** every code starts with `STK` and no code repeats.

---

### User Story 4 - Producers and consumers agree on the event envelope (Priority: P2)

A producer writes an integration event through the outbox and a consumer in another service dedupes on its id and reads the
actor chain for audit.

**Why this priority**: the envelope is needed by events (W1.3) and the outbox (W4.1), later than ids and errors.

**Independent Test**: build an envelope for `ticketing.ticket.validated` version 1 and check the topic name and that the actor
chain survives a JSON round trip.

**Acceptance Scenarios**:

1. **Given** type `ticketing.ticket.validated` and version 1, **When** the topic name is built, **Then** it is
   `ticketing.ticket.validated.v1` (ADR 0078, 0118 D6).
2. **Given** an agent acting for a user, **When** the envelope is serialised and parsed, **Then** `actor.onBehalfOf` still
   names the user (ADR 0098 D7).

---

### User Story 5 - A client pins an API version (Priority: P3)

The transport and versioning packages read and write one header name and validate the dated version string.

**Why this priority**: versioning is dormant at launch (ADR 0118 V1); only the shapes and names are needed now.

**Independent Test**: validate `2026-10`, reject `2026-13` and `v1`, and check the header constants.

**Acceptance Scenarios**:

1. **Given** `"2026-10"`, **When** it is validated, **Then** it is an `ApiVersion`; **given** `"2026-13"`, it is rejected.

### Edge Cases

- A public id in mixed case or with Crockford look-alikes (`I`, `L`, `O`): the source decodes them permissively; the output case is open (DA9).
- A prefix outside 2 to 6 lowercase letters: rejected when the prefix is declared, never at request time (source `idPrefix`).
- A malformed or tampered cursor: `decodeCursor` returns "no cursor", never throws (source `pagination.ts`).
- A limit of 0, a negative limit or a limit above 100: clamped to the allowed range (HTTP conventions rule).
- A host without `crypto.getRandomValues` (some React Native setups): `uuidv7` fails with an STK-coded error instead of a
  silent weak id.
- A gate that throws: the failure is rethrown, never turned into an allow (source fail-closed rules).
- A delegation chain that loops back on itself: the type allows only a finite chain; builders reject a repeated principal.
- An event type that is not `<service>.<aggregate>.<verb>` kebab-case, or a version below 1: `eventTopicName` throws.

## Requirements _(mandatory)_

### Functional Requirements

**Package shape**

- **FR-001**: The package shall be named `@stackra/contracts`, MIT-licensed, `tier:lib`, with no runtime dependency and no
  import of `encore.dev`, an app or a service (roadmap W1.1; ADR 0003, 0083, 0084 D1, 0117 C1).
- **FR-002**: The package shall follow the port conventions: a file-contract block on every file (Purpose, Boundary, Runtime,
  Governing contract) replacing the source's Purpose/Owner/Secrets block, TSDoc on every export, one export per file,
  explicit barrels with no `export *`, `#` subpath imports, and no `any`, non-null assertion or enum (ADR 0006 D2, D3, D5;
  0007 D1, D2; 0084 D1). The source's seven multi-export modules shall be split accordingly.
- **FR-003**: The package shall expose its entries per the agreed package layout
  [NEEDS CLARIFICATION: FW1 — recommended: a, entries first; this package declares only the core `.` entry].
- **FR-004**: The package shall run unchanged in Node, the browser, React Native and the Encore runtime, using only platform
  globals (source README; ADR 0076 D2).

**Public ids (ADR 0082, 0032)**

- **FR-010**: The package shall format a public id as a registered prefix, `_`, and the base32 encoding of one UUIDv7, and
  decode it back to the same UUID (ADR 0082 D1, D2; source `ids.ts`).
- **FR-011**: If a parsed id has the wrong prefix, a wrong length or a character outside the alphabet, then the package shall
  throw an STK-coded `invalidArgument` error (source `parsePublicId`; FW7).
- **FR-012**: The package shall generate time-ordered UUIDv7 values and read their timestamp (source `uuidv7`,
  `uuidv7Timestamp`; ADR 0032).
- **FR-013**: The encoding's letter case, the prefix length rule and the prefix registry shall follow the public-id decision
  [NEEDS CLARIFICATION: DA9 — recommended: a, lowercase Crockford base32 (26 chars), `_`, 2–6 letter prefixes registered in the gen manifest with a uniqueness check].
  The source today emits uppercase.

**Actor (ADR 0098 D6, D7; owner AI3b)**

- **FR-020**: The package shall define `Actor` with `type` (`user`, `service`, `agent`, `external-agent`, `job`, `webhook`,
  `system`, `anonymous`), `id`, `tenantId`, `realm` (`platform`, `tenant`, `customer`; present only for `user`), `via`
  (`http`, `mcp`, `a2a`, `cli`, `queue`, `cron`, `event`, `ui`), `credential` by reference, and `onBehalfOf` as a recursive
  chain ending at the originating principal.
- **FR-021**: If an `Actor` would carry `realm` for a non-`user` type, or its `onBehalfOf` chain repeats a principal, then the
  package's builder shall reject it.
- **FR-022**: The package shall not export `AuthData`, `AuthMethod` or `actorOf`; the identity package owns the authenticated
  context in its own `./contracts` entry (ADR 0117 D2, 0087, 0093). `TenantStatus` moves with tenancy (ADR 0088).

**Errors (FW7, ADR 0091, 0117 C1)**

- **FR-030**: The package shall define nine error kinds, `invalidArgument`, `notFound`, `permissionDenied`, `unauthenticated`,
  `failedPrecondition`, `conflict`, `resourceExhausted`, `unavailable` and `internal`, each with an STK code, a message, an
  optional `cause` and optional safe details [NEEDS CLARIFICATION: FW7 — recommended: a, kinds in contracts, gen maps each to `APIError`, a plain `Error` stays a 500 and is reported].
- **FR-031**: The package shall export a guard that tells a Stackra error from any other thrown value, so gen can map kinds
  without importing Encore (ADR 0091).
- **FR-032**: Error details shall never carry secret values; the error's docblock states that the caller redacts PII
  (secrets rule; ADR 0007 D2).

**Diagnostics (ADR 0084 D1, owner X3)**

- **FR-040**: The package shall keep the diagnostics catalogue and its helpers `diagnostic()`, `hasErrors` and
  `sortDiagnostics`, with every code prefixed `STK` and codes append-only, never renumbered or reused (source
  `diagnostics.ts`).
- **FR-041**: The catalogue shall keep the container, IR, registry and router ranges under STK sub-ranges, and shall not port
  the FDL definition-language ranges, because the definition package is dropped (ADR 0092 D3).
- **FR-042**: When the test suite runs, the package shall fail if any code lacks the `STK` prefix or repeats (ADR 0084
  enforcement, planned check).

**Event envelope (ADR 0117 C1, 0078, 0098 D7)**

- **FR-050**: The package shall define `EventEnvelope<TData>` with id, type `<service>.<aggregate>.<verb>`, version,
  occurredAt (ISO 8601 UTC), source, tenant id, optional scope path, `actor: Actor`, correlation id, optional causation id,
  aggregate reference with version, data classification and data (source `envelope.ts`).
- **FR-051**: The envelope's tenant and actor ids shall be public ids, because raw UUIDs never leave a service (ADR 0082 D2);
  the source's internal tenant UUID is adapted.
- **FR-052**: The package shall drop `applicationId`, which links to the dropped Figentra compiler (ADR 0092 D4).
- **FR-053**: The package shall build topic names as `<type>.v<version>` and throw on an invalid type or version (source
  `eventTopicName`; ADR 0078, 0118 D6).

**Pagination (ADR 0032 D4, HTTP conventions rule)**

- **FR-060**: The package shall define `PageRequest { cursor?, limit? }` and `Page<T> { items, nextCursor?, hasMore }`, with a
  default limit of 20 and a maximum of 100; the source's default of 50 and `nextCursor: null` are adapted to the rule.
- **FR-061**: The package shall encode cursors as opaque base64url JSON and decode them without throwing, using
  `TextEncoder`/`TextDecoder` instead of the deprecated `escape`/`unescape` the source uses.

**Gates (ADR 0081)**

- **FR-070**: The package shall define one gate contract shared by tenancy, IAM, flags, entitlements and app-defined gates:
  `Gate`, `GateContext` (with `Actor`, not `AuthData`), `GateResult`, `gateDeny` and the affordance table (ADR 0081 D2).
- **FR-071**: `evaluateGates` shall run every gate in the chain once, rethrow a failure, and return the winning denial in the
  order the chain gives; the package shall not fix the kind order the source takes from Figentra ADR-0031
  [NEEDS CLARIFICATION: FW5 — recommended: a, fixed slots tenancy → iam → policy → entitlement that apps toggle and parameterise; note ADR 0081 D1 (Accepted) makes the order fully configurable].

**API versions (ADR 0118)**

- **FR-080**: The package shall define `ApiVersion` as a `YYYY-MM` string with `isApiVersion` and `apiVersion`, rejecting any
  other form (source `versioning.ts`).
- **FR-081**: The package shall export the header names `Stackra-Version`, `Stackra-Client`, `Deprecation`, `Sunset` and
  `Link` with `rel="deprecation"`, replacing the `Figentra-*` names (ADR 0118 V2, D4; 0083).

**Quality**

- **FR-090**: Tests shall sit in `src/**/__tests__/` and reach the agreed coverage floor
  [NEEDS CLARIFICATION: TS3 — recommended: a, 80% lines and functions, 70% branches for this package] (ADR 0022; roadmap
  definition of done). The source's eight test files, including property tests, are ported.

### Key Entities

- **PublicId**: an entity prefix plus the base32 body of a UUIDv7; the only id form outside a service.
- **Actor**: who is acting, through which channel, with which credential reference, for whom.
- **StackraError**: one of nine kinds with an STK code; the domain error that gen maps to an HTTP status.
- **Diagnostic**: an STK code, severity, filled message, optional hint and location.
- **EventEnvelope**: the immutable fact wrapper every integration event carries.
- **Page / PageRequest**: a cursor-paginated slice of a list.
- **Gate / GateResult**: one check in an app's gate chain and its allow or denial.
- **ApiVersion**: a dated `YYYY-MM` version string.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The published package has zero entries under `dependencies` and `peerDependencies`.
- **SC-002**: Every diagnostic code starts with `STK`, and no two codes are equal (a test asserts both).
- **SC-003**: Public id format then parse returns the original UUID for 10,000 generated UUIDv7 values (property test), and
  ids sort in creation order.
- **SC-004**: A consumer project that imports only `@stackra/contracts` typechecks and runs in Node, a browser bundle and React
  Native without polyfills other than `crypto.getRandomValues` where the platform lacks it.
- **SC-005**: Coverage meets the agreed floor (TS3) and `pnpm verify` is green on the merge commit.
- **SC-006**: No export named `AuthData`, `Figentra-Version` or an `FDL`/`FCN` code remains in the package.

## Assumptions

- Phase 1 may rely on ADRs that are still Proposed (0076, 0082, 0084, 0118)
  [NEEDS CLARIFICATION: OR1 — recommended: a, one PR accepts the uncontested ADRs, a second fixes the contradicted ones].
- The scope path stays an optional envelope field even though the scope tree is Pro (owner F14a); free packages leave it unset.
- `TenantStatus` and the authenticated context move to the tenancy and identity specs; this spec only removes them.
- The router range of diagnostics is kept for `foundation/router` (W7.2, ADR 0053).
- Base32 alphabet, separator and area path shape stay as the source has them until DA9 is answered.

## Glossary

- **Port + adapt**: port the Figentra OS source, then change what the listed ADRs require (ADR 0084 D2).
- **STK code**: a stable diagnostic or error code with the `STK` prefix (ADR 0084 D1).
- **UUIDv7**: a time-ordered UUID; the one key of every row (ADR 0032, 0082 D1).
- **Crockford base32**: a base32 alphabet without `I`, `L`, `O`, `U`, tolerant of look-alikes on input.
- **Delegation chain**: `onBehalfOf`, the actors an actor acts for, ending at the originating principal (ADR 0098 D6).
- **Gate chain**: the ordered gates an app runs per API area (ADR 0081, 0082 D4).
- **Affordance**: what a UI does when a gate denies (hide, not found, forbidden, upgrade, consent prompt).
- **Integration event**: a versioned fact that crosses services, named `<type>.v<n>` (ADR 0078).
- **gen**: `stackra gen`, the build-time generator that emits the Encore app (ADR 0090, 0091).

## Open items

- [NEEDS CLARIFICATION: FW1 — recommended: a, entries first; this package declares only the core `.` entry] (FR-003)
- [NEEDS CLARIFICATION: FW2 — recommended: a, `contracts` sits in `foundation`] (Impact, packages touched)
- [NEEDS CLARIFICATION: DA9 — recommended: a, lowercase Crockford base32 (26 chars), `_`, 2–6 letter prefixes registered in the gen manifest with a uniqueness check] (FR-013)
- [NEEDS CLARIFICATION: FW7 — recommended: a, kinds in contracts, gen maps each to `APIError`, a plain `Error` stays a 500 and is reported] (FR-030)
- [NEEDS CLARIFICATION: FW5 — recommended: a, fixed slots tenancy → iam → policy → entitlement; conflicts with ADR 0081 D1] (FR-071)
- [NEEDS CLARIFICATION: TS3 — recommended: a, 80/70 for this package] (FR-090)
- [NEEDS CLARIFICATION: OR1 — recommended: a, accept the uncontested Proposed ADRs first] (Assumptions)
