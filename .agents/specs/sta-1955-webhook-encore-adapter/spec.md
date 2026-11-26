# Feature Specification: the inbound webhook route is exposed through Encore `api.raw` adapters

**Feature Branch**: `figentra/sta-1955-webhook-encore-adapter`

**Created**: 2026-11-26

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-1955

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: gen bound `InboundWebhooksController` (`#stackra/webhooks`) into a service's container but wrote no Encore
endpoint for it, so provider webhooks (Paymob, Tamara, Resend, Stripe) could not reach a generated app. And a
provider's `Authorization` header is its own signature (Tamara sends a JWT there), which `CallAuthenticator` would
have answered 401. ADR 0308 (rules 15 and 16) defines the inbound webhook route and ADR 0224 (as amended) the raw
body. This spec is written after the fact from the PR's diff (#1146), built before the spec gate (ADR 0502) required
one.

### Sources

- `packages/developer/gen/src/core/functions/emit-encore-api.function.ts` and `emit-encore-http.function.ts` (before and
  after this change); `emit-encore-inbox.function.ts` and `emit-webhooks.function.ts` (file contracts)
- `packages/runtime/app/src/server/functions/serve-guarded-call.function.ts` and
  `src/server/types/guarded-call-options.type.ts`
- ADR 0308 (rules 15 and 16: the inbound webhook route), ADR 0224 as amended (raw body), ADR 0294 (decision 16), ADR
  0237, ADR 0457 (request guards), STA-2025 (the anonymous opt-in)
- FR-001 to FR-006: the PR's diff against `main`, its tests and the new `webhook-route` golden fixture

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none in this repo; every generated service that receives webhooks gains two adapters per
  Integration in `.stackra/encore/<member>/api.ts`, and every generated `http.ts` gains one pass-through line
- **Packages touched**: packages/developer/gen (`emitEncoreApi`, `emitEncoreHttp`, file contracts of
  `emitEncoreInbox` and `emitWebhooks`, golden fixtures), packages/runtime/app (`serveGuardedCall`,
  `GuardedCallOptions`)
- **Public contract change**: additive. `GuardedCallOptions` (`@stackra/app/server`) gains `credentials?: "ignore"`;
  the generated `answerCall` accepts and passes it. Generated Encore routes: `/webhooks/<module>/<name>` and
  `/webhooks/<module>/<name>/:connectionId`, method `*`, named `webhooks<Module><Name>` and
  `webhooks<Module><Name>ByConnection`. Nothing is removed or renamed.
- **Cross-service events**: none
- **Tenancy and data**: the connection segment selects a tenant's provider connection; the controller resolves it and
  verifies the provider's signature before anything is parsed (ADR 0308). No tenant is taken from a header.
- **Security and privacy**: the adapters are anonymous and read no Stackra credential; the provider's signature is the
  authentication, checked by the receiver over the raw bytes. Request guards and the body cap still apply. No
  `/webhooks/*rest` wildcard is written.
- **Secrets**: none (provider signing secrets are read by the existing receivers, unchanged)
- **ADR needed**: no (implements ADR 0308 rules 15 and 16 and ADR 0224 as amended)
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/developer/gen/README.md`, `packages/developer/gen/__golden__/README.md`,
  `.changeset/webhook-route-encore-adapters.md` (minor for `@stackra/gen` and `@stackra/app`)
- **Lane**: full (new generated endpoints and a new public option on the call path)
- **Change risk**: R3 (webhooks and the authentication path of a call)

## Glossary _(full lane)_

- **Webhook Integration**: an own or hosted Integration that declares `webhooks` (`webhookIntegrations(ir)`).
- **Adapter**: a generated Encore `api.raw` endpoint that hands the request to `answerCall`.
- **`credentials: "ignore"`**: a call that reads no credential: nothing is verified or held, the call runs as the
  anonymous actor, and the `Authorization` header still reaches `execute`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A provider delivery reaches the receiver (Priority: P1)

A service declares a Stripe Integration with webhooks. After `stackra gen`, a delivery to `/webhooks/shop/stripe` (the
platform account) or `/webhooks/shop/stripe/<connectionId>` (a tenant's connection) reaches
`InboundWebhooksController.handle` with the raw body, behind the request guards and the body cap.

**Why this priority**: today there is no endpoint, so no provider webhook reaches a generated app.

**Independent Test**: `emitEncoreApi` on an IR with a webhook Integration; the `webhook-route` golden fixture.

**Acceptance Scenarios**:

1. **Given** an own and a hosted webhook Integration, **When** gen runs, **Then** each gets two `api.raw` adapters,
   method `*`, `auth: false`, `raw: true`, `anonymous: true`, `credentials: "ignore"`, around the generated controller.
2. **Given** a service with no webhook Integration, **When** gen runs, **Then** no webhook adapter is written.

---

### User Story 2 - A provider's own Authorization header is not refused (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a raw call whose adapter states `credentials: "ignore"` and a request with `Authorization: Bearer <a
provider JWT>`, **When** `serveGuardedCall` runs it, **Then** no credential is verified, the call runs anonymous,
   and the header reaches `execute` unchanged.

---

### User Story 3 - Two services that receive webhooks coexist (Priority: P1)

**Acceptance Scenarios**:

1. **Given** two services of one app that receive webhooks, **When** gen runs, **Then** neither writes a
   `/webhooks/*rest` route, so Encore sees no route clash.

---

### Edge Cases

- **EC-01**: The inbox keeps its own raw adapter, 1 MiB cap and position outside the request guards; it is unchanged.
- **EC-02**: An action that declares `credentials: "ignore"` itself keeps working as before.
- **EC-03**: With `credentials: "ignore"` no user token is forwarded to downstream calls.
- **EC-04**: Every existing `http.ts` golden gains only the `credentials: call.credentials` pass-through line.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `emitEncoreApi` SHALL write, for each webhook Integration of a service, `api.raw` adapters at
  `/webhooks/<module>/<name>` and `/webhooks/<module>/<name>/:connectionId`, method `*`, exposed, `auth: false`, named
  `webhooks<Module><Name>` and `webhooks<Module><Name>ByConnection`.
- **FR-002**: each webhook adapter SHALL call `answerCall` with `anonymous: true`, `raw: true` and `credentials:
"ignore"`, executing `InboundWebhooksController.handle(request)` from the container.
- **FR-003**: `emitEncoreApi` SHALL NOT write a `/webhooks/*rest` route.
- **FR-004**: `emitEncoreApi` SHALL write no webhook adapter for a service without a webhook Integration.
- **FR-005**: `GuardedCallOptions` SHALL accept `credentials: "ignore"`; WHEN set, `serveGuardedCall` SHALL verify and
  hold no credential, run the call anonymous and pass the `Authorization` header to `execute`.
- **FR-006**: the generated `http.ts` (`emitEncoreHttp`) SHALL accept `credentials` on an endpoint and pass it to
  `serveGuardedCall`.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a service has a webhook Integration THE gen SHALL write its two raw adapters behind the request
  guards and the body cap.
- **AC-002**: WHEN a provider sends its own `Authorization` header THE call SHALL run anonymous without a 401, and the
  receiver SHALL get the header.
- **AC-003**: IF two services of one app receive webhooks THEN their routes SHALL NOT clash.
- **AC-004**: WHERE a service receives no webhook THE gen SHALL write no webhook adapter.

## Success Criteria _(mandatory)_

- **SC-001**: `emit-encore-api.function.test.ts` ("the inbound webhook route") proves FR-001 to FR-004 — verified by:
  unit
- **SC-002**: `emit-encore-http.function.test.ts` and every `http.ts` golden prove FR-006 — verified by: unit
- **SC-003**: `serve-guarded-call.function.test.ts` ('never verifies a raw call its adapter states credentials:
  "ignore" for…') proves FR-005 — verified by: unit
- **SC-004**: the `webhook-route` golden fixture (`golden.test.ts`) proves AC-001 end to end through gen — verified
  by: unit
- **SC-005**: the `@stackra/gen` and `@stackra/app` tests, typecheck, oxlint and oxfmt pass — verified by: manual

## Compatibility and migration

- Run `stackra gen`: services with webhook Integrations gain the adapters; every `http.ts` gains the pass-through.
- Nothing else changes for a service without webhooks.

## Risks

- **R-1**: An anonymous, credential-free route is reachable by anyone. Mitigated: the receiver verifies the provider's
  signature over the raw bytes before parsing (ADR 0308), and the request guards and body cap apply.
- **R-2**: A route of method `*` accepts any verb; the receiver answers what the provider protocol expects.

## Out of scope

- A general raw adapter for every controller.
- Changes to the receivers or their signature checks.

## Assumptions

- Each provider receiver verifies its signature before acting, as ADR 0308 requires.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-1955 spec, batch 21) · written after the fact from the diff of PR #1146
- 2026-11-26 · Draft → Clarified · Claude (STA-1955 spec, batch 21) · clarifications complete (none open)
- 2026-11-26 · Clarified → Planned · Claude (STA-1955 spec, batch 21) · plan.md
- 2026-11-26 · Planned → Tasked · Claude (STA-1955 spec, batch 21) · tasks.md
- 2026-11-26 · Tasked → Implementing · Claude (STA-1955 spec, batch 21) · T001 to T007 are the commit 3b4149aee on the branch
