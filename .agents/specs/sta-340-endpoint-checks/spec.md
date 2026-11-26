# Feature Specification: Endpoint refusals in gen

**Feature Branch**: `figentra/sta-340-endpoint-checks`

**Created**: 2026-11-03

**Status**: Draft

**Tier**: feature

**Approver**: owner

**Linear**: STA-340

**Linear project**: none

**Clarifications status**: pending

**Analyze**: —

**Input**: User description: "Work package wp-18 of the gen coverage path: refuse two calls that derive one method and
path, a versioned path and an override outside its area prefix; give every API area its path prefix; record every
action's area in the manifest; and add the ADR 0305 rule 30 surface checks, with fallbacks for `cron_input_invalid` and
`intent_phrases_missing` (gaps G-8, H-49, H-41, H-31 and G-144)."

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: apps/playground (its committed `stackra.manifest.json` and `openapi.json` are regenerated only)
- **Services touched**: none
- **Packages touched**: packages/developer/gen (the derivation and the new check); the packages whose endpoint
  overrides or route constants move under their area prefix: packages/commerce/loyalty-kit,
  packages/application/achievements, packages/security/consent, packages/cross-cutting/analytics,
  packages/application/clients, packages/application/ai (`CLIENT_RESULT_ACTION`); packages/foundation/contracts (its loyalty-kit manifest test fixture); and every
  package whose committed `stackra.manifest.json` lists an endpoint, regenerated only: packages/application/achievements,
  packages/cross-cutting/analytics, packages/data/data-maintenance, packages/data/media,
  packages/experience/collaboration, packages/runtime/devices, packages/security/access-log,
  packages/security/consent, packages/security/identity, packages/security/privacy, packages/commerce/loyalty-kit
- **Public contract change**: breaking: every derived route gains its area prefix (`/app`, `/admin`, `/platform`;
  `/public` already had one), so the committed manifests, `openapi.json` and the SDKs move; the route constants
  `ANALYTICS_INGEST_PATH`, `CONSENT_SNAPSHOT_PATH`, `DEVICE_ORDER.acknowledgedPath` and `CLIENT_RESULT_ACTION.path`
  move to the prefixed paths; every
  manifest action entry gains `area`; additive: seven new gen refusal codes (`endpoint_collision`,
  `endpoint_versioned`, `endpoint_area_mismatch`, `endpoint_method_mismatch`, `job_without_system_actor`,
  `cron_input_invalid`, `intent_phrases_missing`)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: auth boundary: the area of a route decides its gate chain and, for `/platform`, the
  Access application in front of it (ADR 0237 decision 1, ADR 0290 decision 11); after this change a route can no
  longer sit outside the prefix of the area that authenticates it
- **Secrets**: none
- **ADR needed**: no (ADR 0082 decision 3, ADR 0237 decision 1, ADR 0290 decision 11, ADR 0294 decision 21, ADR 0305
  rules 28 and 30 and the http-conventions rule already decide every behaviour here)
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `.agents/rules/http-conventions.md` (the route table shows the area prefix; Enforcement moves the
  endpoint collision row from planned to enforced) and the AGENTS.md block it projects to;
  `packages/developer/gen/README.md` and `packages/developer/gen/AGENTS.md` (the new codes);
  `apps/docs/src/docs/adr/0237-generated-api-gateway-in-four-layers.mdx` and
  `apps/docs/src/docs/adr/0082-public-ids-and-api-areas.mdx` (Enforcement lines)
- **Lane**: full
- **Change risk**: R3 (gen refuses classes that pass today, several members move their public routes, and the area of a
  route is an auth boundary)

## Glossary _(full lane)_

- **Area**: one of the four API areas of ADR 0082 decision 3 (`public`, `app`, `admin`, `platform`); an action's or
  query's `area` option, else a service's own `defineService({ area })` (`ServiceDefinition.area`: "the API area of
  the service's endpoints, unless an action says otherwise"), else `app` (`ActionOptions.area`,
  `QueryOptions.area`).
- **Area prefix**: `/<area>`, the first path segment the edge routes by (ADR 0237 decision 1:
  `api.figentra.com/{public,app,admin,platform}`).
- **Override**: an `endpoint: { method, path }` option, which replaces the derived route (manifest `derived: false`).
- **Transition**: an action that is not create, update or delete and whose input carries the model's id; its derived
  route is `PUT /<area>/<models>/:<model>Id/<verb>` (ADR 0294 decision 21).
- **Route shape**: a method plus a path whose parameter names are erased (`/app/orders/:` for `/app/orders/:orderId`),
  so two routes a router cannot tell apart have the same shape.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Two calls never share a route (Priority: P1)

An author adds a query whose derived route is the route another call already has. Today gen writes both, and
`openapi.json` silently keeps the last one, so one call has no documented route and the generated adapter would shadow
it. After this change gen refuses `endpoint_collision`, naming both classes.

**Why this priority**: a silently dropped route is a wrong public contract (G-8).

**Independent Test**: a fixture member with two calls of one route shape in
`packages/developer/gen/src/core/functions/__tests__/check-endpoints.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** two calls that derive `GET /app/orders/:orderId` and `GET /app/orders/:id`, **When** gen runs, **Then** it
   refuses `endpoint_collision` and writes no `openapi.json`.
2. **Given** two calls on one path with different methods, **When** gen runs, **Then** it accepts both.

---

### User Story 2 - Every route sits under its area (Priority: P1)

An operator route must sit under `/platform`, where Access guards it, and a public route under `/public`. Today only the
public area gets a prefix and an override may name any path. After this change every derived route carries its area
prefix, every override must sit under it and must not carry a version segment, and the manifest records each call's
area.

**Why this priority**: the area of a route is its gate chain and its edge protection (ADR 0237, ADR 0290 decision 11).

**Independent Test**: `packages/developer/gen/src/core/functions/__tests__/derive-endpoint.function.test.ts` and
`check-endpoints.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** `order.cancel` with no `area`, **When** gen derives its route, **Then** it is
   `PUT /app/orders/:orderId/cancel`, and with `area: ApiArea.Admin` it is `PUT /admin/orders/:orderId/cancel`.
2. **Given** a public-area override `GET /awards/verify`, **When** gen runs, **Then** it refuses
   `endpoint_area_mismatch`.
3. **Given** an override `POST /app/v2/orders`, **When** gen runs, **Then** it refuses `endpoint_versioned`.
4. **Given** any action or query, **When** gen writes the manifest, **Then** its entry records `area`.

---

### User Story 3 - The surface options agree with each other (Priority: P2)

ADR 0305 rule 30 lists the combination checks gen runs on an action's surfaces. Today none exists in gen. After this
change gen refuses a method that contradicts the kind or the transition, a job without a system or job actor, a cron
input the action's input schema does not accept, and an intent with no phrases.

**Why this priority**: each mistake today surfaces only at runtime (a `TypeError` at class definition) or never.

**Independent Test**: one fixture per code in `check-endpoints.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a query overridden with `POST`, **When** gen runs, **Then** it refuses `endpoint_method_mismatch`.
2. **Given** a transition overridden with `POST`, **When** gen runs, **Then** it refuses `endpoint_method_mismatch`.
3. **Given** an action with `job` whose actors are `[User]`, **When** gen runs, **Then** it refuses
   `job_without_system_actor`.
4. **Given** a cron `input: { batchSize: "x", extra: 1 }` for an input schema with an integer `batchSize`, **When** gen
   runs, **Then** it refuses `cron_input_invalid` for `batchSize` and for `extra`.
5. **Given** `intent: true` on `points.balance` and a base locale with no `actions.points.balance.intents`, **When** gen
   runs, **Then** it refuses `intent_phrases_missing`.

---

### Edge Cases

- **EC-01**: a call with `endpoint: false`, or whose actors include neither a user nor an agent, has no route and takes
  no part in the collision, area, version or method checks; it still records its area.
- **EC-02**: a hosted package's calls in a service's manifest (marked `from`) take part in the collision check, since
  they share one router with the service's own.
- **EC-03**: an override equal to the bare prefix (`/public`) is under its area; `/publications` is not under `/public`.
- **EC-04**: a version segment is a whole segment (`/v2/`, `/v10` at the end); `/videos` and `/:v2Id` are not.
- **EC-05**: a cron `input` for an action that takes no input schema is refused `cron_input_invalid` unless it is empty
  (`{}`); a schema the check cannot read (no `properties`) passes the property checks and only its `required` list is
  checked (the fallback).
- **EC-06**: `intent_phrases_missing` checks every base-language locale (no region) that ships the module's namespace;
  when no locale ships it, it refuses once against `assets/lang/en/<module>.json` (the fallback).
- **EC-07**: `tool_without_agent_actor` is not added here: ADR 0360 decisions 2 and 4 disagree on tools for user-only
  actions, and the reconciliation is its own package (wp-146).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE derived route of every action or query SHALL start with `/<area>`, where the area is its `area`
  option, else its service's `defineService({ area })`, else `app`.
- **FR-002**: THE manifest entry of every action or query SHALL record `area`, written or defaulted.
- **FR-003**: IF two calls in one manifest have the same route shape THEN gen SHALL refuse `endpoint_collision` for
  each of them, naming the other.
- **FR-004**: IF a route has a path segment matching `v<digits>` THEN gen SHALL refuse `endpoint_versioned`.
- **FR-005**: IF a route's path is neither `/<area>` nor under `/<area>/` THEN gen SHALL refuse
  `endpoint_area_mismatch`.
- **FR-006**: IF a query's route method is not `GET`, or an action's route method is `GET`, or an override changes the
  method of a transition away from `PUT`, THEN gen SHALL refuse `endpoint_method_mismatch`.
- **FR-007**: IF an action declares `job` and its actors include neither `system` nor `job` THEN gen SHALL refuse
  `job_without_system_actor`.
- **FR-008**: IF a `job.cron.input` names a property the action's input schema does not have, omits one it requires, or
  gives a value whose JSON type differs from the property's `type`, THEN gen SHALL refuse `cron_input_invalid` per
  property.
- **FR-009**: IF a call declares `intent: true` and a base locale shipping its module's namespace has no non-empty
  `actions.<written key>.intents` list, or no locale ships that namespace, THEN gen SHALL refuse
  `intent_phrases_missing`.
- **FR-010**: THE checks of FR-003 to FR-009 SHALL be one pure function, `checkEndpoints(ir, manifest)`, run in gen's
  full pass beside the other whole-member checks, and each refusal SHALL carry its fix (ADR 0294 decision 22).
- **FR-011**: THE committed manifests, `openapi.json` files, route constants and the gen golden fixtures SHALL be
  regenerated or moved in the same change, so `stackra gen --check` and the golden suite stay green.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: IF two fixture calls derive one route shape THEN gen SHALL report `endpoint_collision` for both, and the
  fixture's `openapi.json` SHALL not be written.
- **AC-002**: IF a fixture override is `/app/v2/orders` THEN gen SHALL report `endpoint_versioned`.
- **AC-003**: IF a fixture public-area override is `/awards/verify` THEN gen SHALL report `endpoint_area_mismatch`.
- **AC-004**: THE derived route of a fixture call with no `area` SHALL start with `/app`, and with each other area with
  that area's prefix.
- **AC-005**: THE manifest entry of every fixture action and query SHALL record its `area`.
- **AC-006**: IF a fixture query is overridden with `POST`, or a fixture transition with `POST`, THEN gen SHALL report
  `endpoint_method_mismatch`.
- **AC-007**: IF a fixture job action has only a user actor THEN gen SHALL report `job_without_system_actor`.
- **AC-008**: IF a fixture cron input has an unknown property, misses a required one or has a value of the wrong type
  THEN gen SHALL report `cron_input_invalid` for each.
- **AC-009**: IF a fixture call has `intent: true` and its base locale has no phrases THEN gen SHALL report
  `intent_phrases_missing`.
- **AC-010**: THE gen golden tests, `stackra gen --check` over every committed manifest and the tests of the moved route
  constants SHALL pass.

## Success Criteria _(mandatory)_

- **SC-001**: each of the seven codes refuses its fixture and a conforming fixture passes — verified by: unit
- **SC-002**: every committed manifest records an area on every action entry, and every route starts with its area
  prefix — verified by: unit (golden) and `stackra gen --check` on ci-box

## Out of scope

- An `x-stackra-area` extension in `openapi.json`: the area prefix in the path already projects the area there.
- Checking an area against the actors or `auth`: `auth: false` outside `public` is allowed (refuted audit entry G-132),
  and anonymous endpoints belong to STA-2025 (H-15).
- `tool_without_agent_actor` (EC-07, wp-146).
- Generating the gateway that routes by area (wp-114) and locking endpoints as identities (wp-04).
- The full Zod validation of a cron input: gen checks the JSON Schema the manifest records (FR-008).

## Assumptions

- The `app` area gets the `/app` prefix like the other three: ADR 0237 decision 1 routes
  `api.figentra.com/{public,app,admin,platform}`, the work package asks for "area prefix for every area", and the
  existing `/public` and `/platform/operators/bootstrap` routes already carry their area in the path.
- No released consumer calls a derived route yet: the Encore adapters are not generated (G-2). The hand-written
  callers are the three route constants this change moves, `CLIENT_RESULT_ACTION` of `@stackra/ai` (a convention
  route of the OS ai service, moved to `/app/runs/:runId/client-result`), the CLI's `/platform/operators/bootstrap`
  (already under its area), and two left as they are: `DEVICE_HUB_PATHS` of `@stackra/devices`, which is relative to
  the configurable `DevicesConfig.hubUrl` (a hub served under `/app` sets it there), and the notifications'
  `SEND_MESSAGE_ACTION` and `SEND_DELIVERY_MESSAGE_ACTION`, which mirror another service's override (`POST /messages`),
  not a derived route; that producer moves them when it adopts the check.
- No committed manifest has a collision or a versioned route today (surveyed 2026-11-03 over the committed manifests);
  the overrides outside their area are loyalty-kit's six (app area), achievements' `/awards/verify` and consent's
  `/consent/snapshots` (public area), and analytics' ingest route (public area).
- The runtime lags gen on the service area: `readCallOptions` of `@stackra/actions` still defaults an unwritten area
  to `ApiArea.App`, and the pipeline keys the area rate-limit bucket (`RateLimitConfig.areas`) on that, so a call in an
  `admin` or `public` service is recorded under its service's area by gen but limited as `app` at runtime until the
  runtime reads the service area. That change is a follow-up issue, out of this work package.

## Amendments

- 2026-11-03 · agent (wp-18 build): the default area is a service's own `defineService({ area })` before `app`, as
  `ServiceDefinition.area` already documents (Glossary, FR-001); `CLIENT_RESULT_ACTION` of `@stackra/ai` was a fourth
  route constant on the convention and moves too, and the Assumptions list the hand-written callers left as they are
  (the survey had missed them).

## Status history

- 2026-11-03 · — → Draft · agent (wp-18) · created
