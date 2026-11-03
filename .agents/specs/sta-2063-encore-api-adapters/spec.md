# Feature Specification: gen writes the Encore service and an api() adapter per action and query

**Feature Branch**: `figentra/sta-2063-encore-api-adapters`

**Created**: 2026-11-03

**Status**: Clarified

**Tier**: feature

**Approver**: leader

**Linear**: STA-2063

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: User description: "Work package wp-39 of the gen coverage path, gap G-2 (phase 1): gen writes
`.stackra/encore/<service>/encore.service.ts` and one Encore `api()` per derived endpoint of the service's actions and
queries, each calling the action pipeline. Owner answer (2026-11-03): each adapter reads the Actor from Encore's
`getAuthData()` (`~encore/auth`), with `auth: true` unless the action or query says it runs without a session, in
which case the caller is an anonymous actor. The generated Encore app does not build until wp-114 lands the auth
handler; the tests use a stand-in for `~encore/auth`, and `encore.dev` is not installed into the lockfile."

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none in core (`services/example` and `services/health` run from an authored main and keep no
  generated Encore files under version control; their generated `.stackra/encore` output gains the two files on the
  next gen run, which nothing deploys yet)
- **Packages touched**: packages/developer/gen (two emitters, `generate-member` wiring, the `service`, `consumer`,
  `app-clients` and `member-module-alias` goldens, README)
- **Public contract change**: additive: a service's generated output gains `.stackra/encore/<member>/encore.service.ts`
  and, when it has an own action or query with an endpoint, `.stackra/encore/<member>/api.ts`; the Encore auth data
  the adapters read is `{ userID: string; actor: Actor }`, which wp-114's auth handler returns
- **Cross-service events**: none
- **Tenancy and data**: none (the adapter passes the verified actor; the pipeline's tenancy step is unchanged)
- **Security and privacy**: auth: every adapter is `auth: true` and takes its actor only from Encore's verified auth
  data, never from the body or a header (ADR 0098); only a call whose `actors` list `ActorKind.Anonymous` (manifest
  `anonymous: true`, STA-2025) is `auth: false`, and then runs as an anonymous actor unless a session was presented.
  The permission and input checks stay in the pipeline (`registerActions`). No new PII
- **Secrets**: none
- **ADR needed**: no (implements ADR 0091 decision 2 and ADR 0294 decision 21 as written; the auth handler and gateway
  are ADR 0237, wp-114)
- **New dependencies**: none (the generated files import `encore.dev`, which stays out of every catalog and the
  lockfile; the box type-check installs it into a throwaway folder outside the workspace)
- **Deploy modes**: same in all three (generated code; no member deploys the Encore app yet)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: packages/developer/gen/README.md ("Call options from a request": the endpoints now exist, what
  they pass, what waits for wp-114); `.agents/rules/http-conventions.md` and its projection in AGENTS.md
  (Authentication: the opt-out is `actors: [ActorKind.Anonymous]`, not an `auth: false` option)
- **Lane**: full
- **Change risk**: R2 (generated code on the authentication boundary; nothing deploys it until the auth handler lands)

## Glossary _(full lane)_

- **Adapter**: one exported `api()` endpoint in `.stackra/encore/<member>/api.ts` that runs one action or query
  through `ActionPipeline.execute` inside `app.handlers.run`.
- **Derived endpoint**: the manifest entry's `endpoint: { method, path, derived }` (`deriveEndpoint`, ADR 0294 d21),
  derived or written as an override.
- **Auth data**: what Encore's `getAuthData()` from `~encore/auth` returns: the auth handler's result,
  `{ userID: string; actor: Actor }`; Encore requires the `userID` field.
- **Anonymous call**: an action or query whose `actors` list `ActorKind.Anonymous`; its manifest entry carries
  `anonymous: true`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A service gets its Encore service declaration (Priority: P1)

A service member runs gen and finds `.stackra/encore/<member>/encore.service.ts`, so the CronJobs, topics and
subscriptions gen already writes there belong to an Encore service.

**Why this priority**: G-2 (high). Today no `encore.service.ts` is written, so the folder is not an Encore service.

**Independent Test**: `emit-encore-service.function.test.ts` on a service IR and a package IR; the `service` golden.

**Acceptance Scenarios**:

1. **Given** the `shop` service, **When** gen runs, **Then** `.stackra/encore/shop/encore.service.ts` exports
   `default new Service("shop")` from `encore.dev/service`.
2. **Given** a package or an app, **When** gen runs, **Then** no `encore.service.ts` is written.

---

### User Story 2 - Each action and query with an endpoint gets an api() adapter (Priority: P1)

A service's actions and queries that have an endpoint are reachable over HTTP: gen writes one `api()` per entry, with
the entry's method and path, typed by its input and output schemas, running the call through the pipeline with the
verified actor.

**Why this priority**: G-2 (high). README: "No generated endpoint calls the pipeline yet".

**Independent Test**: `emit-encore-api.function.test.ts` on an IR and manifest with an action, a query, an anonymous
query and an `endpoint: false` action; the `service` golden; the box type-check of the golden's `api.ts`.

**Acceptance Scenarios**:

1. **Given** `shop.order.cancel@1` with endpoint `PUT /orders/:orderId/cancel`, **When** gen runs, **Then**
   `.stackra/encore/shop/api.ts` exports `shopOrderCancelV1 = api({ method: "PUT", path: "/orders/:orderId/cancel",
expose: true, auth: true }, ...)` whose handler runs `new ActionPipeline(container).execute(CancelOrderAction, input,
{ actor })` inside `app.handlers.run`, with `actor` from `getAuthData()`.
2. **Given** a query `GET /products/:productId`, **When** gen runs, **Then** it gets an adapter like an action's.
3. **Given** an entry with `anonymous: true`, **When** gen runs, **Then** its adapter is `auth: false` and runs with
   the session's actor when `getAuthData()` returns one, otherwise with `{ kind: ActorKind.Anonymous, id:
mintPublicId("anon") }`.
4. **Given** an entry with no endpoint (`endpoint: false`, or actors with no route), **When** gen runs, **Then** it
   gets no adapter, and a service with no such entry gets no `api.ts`.
5. **Given** the golden's `api.ts` and a stand-in `~encore/auth`, **When** it is type-checked on ci-box against
   `encore.dev`'s published types, **Then** it compiles.

---

### Edge Cases

- **EC-01**: An entry merged from a hosted package (`from` set) gets no adapter in this phase: its manifest names the
  input and output schemas but not the files that declare them (the same limit `registerActions` has); it is listed in
  the README as waiting for that file.
- **EC-02**: An entry without an `input` (or `output`) schema ref gets a handler with no parameter (or `Promise<void>`);
  Encore accepts both shapes.
- **EC-03**: Two entries whose endpoint names would collide (`camelCase` of the key) cannot exist: keys are unique per
  service, and the name keeps the version (`@1` → `V1`).
- **EC-04**: An input or output class that is not one of the member's shapes (the ref resolves to nothing) leaves the
  entry without an adapter rather than an untyped one.
- **EC-05**: A v2 service with an authored main (`authoredMain: true`) gets the files like the CronJobs file does today;
  nothing builds its Encore folder until STA-344 converts it.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: WHEN gen runs for a member whose layout is `service` THE gen SHALL write
  `.stackra/encore/<member>/encore.service.ts` declaring `new Service("<member>")` as its default export, and SHALL
  write it for no other layout.
- **FR-002**: WHEN a service's manifest has an own action or query entry with an `endpoint` object THE gen SHALL write
  `.stackra/encore/<member>/api.ts` with one exported `api()` per such entry, named by the camel-cased key with its
  version, with the entry's `method` and `path` and `expose: true`.
- **FR-003**: THE adapter SHALL type its parameter by the entry's input schema class and its result by its output
  schema class, imported from the member's shapes, and SHALL run the call as
  `new ActionPipeline(container).execute(<class>, input, { actor })` inside `app.handlers.run`.
- **FR-004**: WHEN the entry is not `anonymous` THE adapter SHALL be `auth: true` and SHALL take `actor` from
  `getAuthData()` of `~encore/auth`, and nowhere else.
- **FR-005**: WHEN the entry is `anonymous` THE adapter SHALL be `auth: false` and SHALL take `actor` from
  `getAuthData()` when present, otherwise an anonymous actor with a fresh `anon` public id.
- **FR-006**: IF an entry has no endpoint, comes from a hosted package, or names an input or output schema the member
  does not declare THEN THE gen SHALL write no adapter for it.

### Key Entities _(include if feature involves data)_

- **Auth data** (Encore, from wp-114's auth handler): `{ userID: string; actor: Actor }`.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN gen runs for the golden `shop` service THE output SHALL contain
  `.stackra/encore/shop/encore.service.ts` and `.stackra/encore/shop/api.ts` with an adapter for `shop.order.cancel@1`.
- **AC-002**: WHEN the manifest has an action and a query with endpoints THE `api.ts` SHALL hold one adapter for each,
  calling the pipeline with the actor from `getAuthData()`.
- **AC-003**: WHEN an entry is anonymous THE adapter SHALL be `auth: false` and fall back to an anonymous actor.
- **AC-004**: IF an entry has no endpoint THEN THE `api.ts` SHALL hold no adapter for it.
- **AC-005**: WHEN the box type-checks the golden `api.ts` with a stand-in auth module THE compiler SHALL pass it
  against the published `encore.dev` types.

## Success Criteria _(mandatory)_

- **SC-001**: The two new emitter tests and the updated goldens pass — verified by: unit
- **SC-002**: The golden `api.ts` and `encore.service.ts` type-check on ci-box against `encore.dev` installed in a
  throwaway folder (no lockfile change) — verified by: manual (box log)
- **SC-003**: `pnpm verify` is green for `packages/developer/gen` on ci-box — verified by: manual (box log)

## Out of scope

- The auth handler, gateway and area routing (wp-114, G-2 p3); until it lands `encore build` fails on `auth: true`.
- `api.raw` for Controllers and webhooks (wp-79, G-2 p2).
- Mapping a refusal to an HTTP status or `APIError` (wp-80, G-6); a refusal surfaces as Encore's default error.
- `secret()` declarations (wp-81).
- The header-borne call options (`Idempotency-Key`, `Stackra-Consent` through `requestCallOptions`) and the other
  verified facts (`scope`, `device`, `origin`, `sandbox`, `assurance`): a typed `api()` sees no `Request`; they come with
  the auth handler and gateway in wp-114, which owns the request and the credential.
- Adapters for hosted packages' entries (EC-01).
- Adding a query to the `service` golden: the unit test covers queries, and the golden's input stays as other open
  branches edit its outputs.

## Assumptions

- Encore's `AuthData` must carry `userID: string`, so the actor rides beside it as `actor`, not as the auth data itself;
  wp-114's handler returns that shape.
- `@stackra/actions` is a dependency of every service with actions (the `registerActions` registrations already import
  it), and `@stackra/contracts` exports `ActorKind` and `mintPublicId`.
- An action's `actors` listing `ActorKind.Anonymous` is how an action or query "says auth: false". The http-conventions
  rule shows an `auth: false` option, but `ActionOptions` and `QueryOptions` have no `auth` field and gen reads none;
  STA-2025 made the actors list the one anonymous opt-in, and the access-control driver lets an anonymous caller through
  only on it. A second flag would be a second opt-in that has to agree with the first, so the adapter's `auth: false`
  is derived from the actors list and no option is added; the rule's example is corrected in the docs task.
- `ENCORE_APP_IMPORT` (`../../entry/server`) is the way every generated Encore file reaches the member, as the CronJobs
  and subscriptions files do.

## Amendments

None.

## Status history

- 2026-11-03 · — → Draft · agent (wp-39) · created from the gen coverage audit (G-2 p1); stopped on how an adapter gets
  its actor
- 2026-11-03 · Draft → Clarified · agent (wp-39) · owner answered option (b): the actor from `getAuthData()`, `auth: true`
  unless the call opts in to anonymous callers; a stand-in `~encore/auth` for tests, no `encore.dev` in the lockfile
