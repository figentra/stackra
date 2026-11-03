# Feature Specification: openapi.json fixes and two JSON Schema fixes in gen

**Feature Branch**: `figentra/sta-2060-openapi-fixes`

**Created**: 2026-11-03

**Status**: Clarified

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2060

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: Gen coverage audit, gaps H-5, H-58, H-29, H-30, H-57 and G-124. The `openapi.json` gen projects from a
member's manifest declares no security scheme, carries a root `$comment` that OpenAPI 3.1 does not allow, leaves the
Idempotency-Key header out of writes, answers every refusal with one untyped `default`, and describes public ids with a
pattern looser than Crockford base32. Separately, the manifest JSON Schema of a shape built on a consumed (remote) shape
drops the base's fields.

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: apps/playground (its committed `openapi.json` and `stackra.manifest.json` are regenerated, no
  source change)
- **Services touched**: none by source; committed manifests of members with a public id field are regenerated
- **Packages touched**: packages/developer/gen (`open-api-of`, `json-schema-of`, `zod-of-json-schema`,
  `compare-manifests`, `build-manifest`, the `OpenApiDocument` type, goldens, README); the committed
  `stackra.manifest.json` of each package with a public id field is regenerated
- **Public contract change**: additive in `openapi.json` (a security scheme and root requirement, the Idempotency-Key
  header, per-status refusal responses, `x-stackra-generated` in place of the root `$comment`); the public id JSON
  Schema pattern narrows to the Crockford base32 body the runtime `publicId()` already enforces, so no call that passed
  before is refused now
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: the document now states the bearer requirement every endpoint already has (ADR 0082); no
  runtime auth change
- **Secrets**: none
- **ADR needed**: no (ADR 0082 auth, ADR 0136 idempotency, ADR 0140 categories and statuses, ADR 0135 public id format
  and ADR 0260 consumed shapes already decide each behaviour; this makes the projection say what they say)
- **New dependencies**: none (no OpenAPI validator is added; the tests check the 3.1 root fields structurally)
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: packages/developer/gen/README.md (the `openApiOf` row and the public id row); no apps/docs page
  describes the projection's fields
- **Lane**: full
- **Change risk**: R1 (generated contract files change; runtime behaviour does not)

## Glossary _(full lane)_

- **Projection**: `openapi.json`, written by `openApiOf` from the committed manifest; never a source for clients
  (ADR 0158).
- **Remote base**: a shape that extends, or derives with `PickType`/`OmitType`/`PartialType` from, a consumed shape of
  `#stackra/clients/<service>` (`ShapeIR.base.kind === "remote"`, STA-1363).
- **Crockford body**: the 26 characters after `<prefix>_`, from `0-9` and the letters without I, L, O and U, either
  case (ADR 0135; `publicId()` of `@stackra/validation` reads both cases).

## Questions answered

1. **Which security scheme?** One `bearer` scheme, `{ type: "http", scheme: "bearer" }`, described as an API key or an
   OAuth access token: the generated SDKs send exactly that (`emit-sdks.function.ts`, `authorization: Bearer`). The
   root `security` is `[{ bearer: [] }]`; an anonymous-callable operation keeps `security: []` (STA-2025).
2. **Where does the generated notice go?** A root `x-stackra-generated` string, the same text. OpenAPI 3.1 allows
   `x-` extensions at the root and not `$comment`.
3. **When is Idempotency-Key required?** On every non-GET operation it is a header parameter; `required` is true only
   when the manifest's `idempotency` is `required` (ADR 0136 decision 3, the `Idempotency` enum of
   `@stackra/actions`). `optional` and `derived` declare it as optional.
4. **How are refusals typed?** Each code in an operation's `refusals` is looked up in the manifest's `errors`; its kind
   gives the HTTP status through `ErrorKind` of `@stackra/errors` (a dependency gen already has). Each status gets one
   response whose envelope narrows `code` to that status's codes and `category` to its category. A code the manifest's
   `errors` does not list (a hosted package's refusal) stays under `default`. `default` stays, with `category` as an
   enum of the ten ADR 0140 categories.
5. **Upper case in the pattern?** Yes. `publicId()` matches case-insensitively and keeps the id as given, so the JSON
   Schema body is `[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}`. JSON Schema has no regex flags, so both cases are spelled out.
6. **Old manifests?** A producer's manifest committed before this change still carries `[0-9A-Za-z]{26}`. The client
   decoder (`zodOfJsonSchema`) reads both bodies as `publicId(prefix)`, and `compareManifests` does not report the
   change from the old body to the Crockford body as a break, since the runtime always refused those characters.
7. **Where do a remote base's fields come from?** From the consumed service's committed manifest that discovery already
   puts in `MemberIR.services` (the same source the clients target uses). The base's schema is found by its class name
   as `emit-clients` names it (`<Name>`, or `<Module><Name>` when two modules share a name), the derivation is applied
   (pick keeps, omit drops, partial clears `required`), and the shape's own fields are laid over it. The producer's
   schemas that the copied properties reference by `$ref` are copied into the member's `schemas` under the producer's
   keys; module keys are unique across products (ADR 0349 decision 7), so they cannot collide with the member's own.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A valid, honest openapi.json (Priority: P1)

An external integrator loads a member's `openapi.json` into an OpenAPI 3.1 tool and sees how to authenticate, which
calls take an Idempotency-Key, and which refusals each call answers with which status.

**Why this priority**: the document is the public HTTP contract; today it fails 3.1 validation and hides auth.

**Independent Test**: project a manifest with an authenticated write, an anonymous query and a refusal, and read the
document.

**Acceptance Scenarios**:

1. **Given** any manifest, **When** it is projected, **Then** the root has no `$comment`, carries
   `x-stackra-generated`, declares the `bearer` scheme and requires it at the root.
2. **Given** an anonymous-callable query, **When** it is projected, **Then** its operation has `security: []`.
3. **Given** a write whose idempotency is `required`, **When** it is projected, **Then** it declares a required
   `Idempotency-Key` header; a write with `optional` declares it as optional; a GET declares none.
4. **Given** an action refusing `order_not_cancellable` (kind `failed_precondition`), **When** it is projected, **Then**
   it has a `412` response whose `code` enum is `["order_not_cancellable"]` and whose `category` is
   `precondition_failed`, plus `default`.

### User Story 2 - JSON Schema matches the runtime (Priority: P2)

A consumer validating against the manifest's JSON Schema refuses the same public ids the producer refuses, and a form
built on a consumed shape keeps that shape's fields in the manifest.

**Why this priority**: a looser pattern and a missing base let documents and tools accept what the service refuses.

**Independent Test**: `jsonSchemaOf` of a public id field and of a shape on a remote base; `zodOfJsonSchema` of the
new and old patterns.

**Acceptance Scenarios**:

1. **Given** `PublicId<"ord">`, **When** its schema is read, **Then** `ord_` followed by 26 characters containing I, L,
   O or U fails the pattern and a Crockford id passes.
2. **Given** `class CreateOrderForm extends RequestedLine` (consumed), **When** its manifest schema is built, **Then**
   it lists the base's properties and required fields plus its own.

---

### Edge Cases

- **EC-01**: An operation with no refusal codes keeps only `default` (no per-status responses).
- **EC-02**: A refusal code missing from the manifest's `errors` stays under `default` and adds no status.
- **EC-03**: Two codes of the same kind share one status response whose `code` enum lists both.
- **EC-04**: A remote base whose service manifest is absent (an IR built by hand, or the service not found) keeps the
  shape's own fields only, as today; the clients target already reports the missing service.
- **EC-05**: A remote base whose schema references another producer schema copies that schema too, transitively, once.
- **EC-06**: A bare `PublicId` (any prefix) and a union of prefixes take the same Crockford body.
- **EC-07**: A DELETE or PATCH with no input still declares the Idempotency-Key header.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE `openApiOf` projection SHALL declare `components.securitySchemes.bearer` (HTTP bearer) and a root
  `security: [{ bearer: [] }]`, and SHALL keep `security: []` on an anonymous-callable operation.
- **FR-002**: THE `openApiOf` projection SHALL carry the generated notice as a root `x-stackra-generated` string and
  SHALL write no root `$comment`.
- **FR-003**: WHEN an operation's method is not GET THE projection SHALL declare an `Idempotency-Key` header parameter,
  required exactly when the manifest's `idempotency` is `required`.
- **FR-004**: WHEN an operation has refusal codes that the manifest's `errors` lists THE projection SHALL add one
  response per HTTP status of their kinds, with `code` narrowed to that status's codes and `category` to its category,
  and SHALL keep `default` with `category` as an enum of the ten ADR 0140 categories.
- **FR-005**: THE `jsonSchemaOf` public id pattern SHALL accept only the Crockford body (either case), for a single
  prefix, a union of prefixes and any prefix.
- **FR-006**: THE `zodOfJsonSchema` decoder SHALL read both the Crockford body and the earlier `[0-9A-Za-z]` body as
  `publicId(prefix)`.
- **FR-007**: WHEN a public id pattern changes only from the earlier body to the Crockford body THE `compareManifests`
  check SHALL report no break.
- **FR-008**: WHEN a shape's chain ends on a remote base whose service manifest is known THE `jsonSchemaOf` result SHALL
  start from that base's properties and required fields, after its pick, omit or partial derivation, and lay the
  shape's own fields over them.
- **FR-009**: WHEN copied properties reference producer schemas THE `buildManifest` result SHALL include those schemas
  under the producer's keys, transitively.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: THE projected `openapi.json` SHALL have no root `$comment`, SHALL have `x-stackra-generated`, and every
  root key SHALL be an OpenAPI 3.1 root field or an `x-` extension.
- **AC-002**: THE projected document SHALL declare the `bearer` security scheme and require it at the root, and an
  anonymous-callable operation SHALL have `security: []`.
- **AC-003**: WHEN an operation is not GET THE projection SHALL declare the `Idempotency-Key` header.
- **AC-004**: WHEN an action refuses with codes the manifest's `errors` lists THE projection SHALL answer them as
  per-status responses with a `code` enum and a `category` enum.
- **AC-005**: IF a public id body contains I, L, O or U THEN THE JSON Schema pattern SHALL refuse it.
- **AC-006**: WHEN a shape is built on a remote base THE manifest JSON Schema SHALL keep the base's fields.

## Success Criteria _(mandatory)_

- **SC-001**: The three golden `openapi.json` files carry no root `$comment` and declare the bearer scheme — verified by:
  unit (golden test).
- **SC-002**: The new and changed cases pass in `open-api-of`, `json-schema-of`, `zod-of-json-schema` and
  `compare-manifests` tests — verified by: unit.
- **SC-003**: `stackra gen --check` is clean after the committed manifests and `apps/playground/openapi.json` are
  regenerated — verified by: the `pnpm verify` gate on ci-box.

## Out of scope

- Hosted package refs in `openapi.json` (H-4, wp-98).
- The runtime mapping from refusal kind to HTTP status (G-6, STA-2048); this only documents the statuses.
- The `Stackra-Version` header and dated versions (H-18, dormant).
- SDKs creating the Idempotency-Key (wp-07).
- The docs site's API reference pages (STA-2026); they pick up the new document through `openApiOf` unchanged.

## Assumptions

- The ten `ErrorKind` statuses in `@stackra/errors` are the transport table ADR 0140 decision 3 means; gen already reads
  `ErrorKind` meta for the manifest's `errors` section.
- Committed manifests are regenerated in this change so `stackra gen --check` stays clean; STA-2036 (stale manifests)
  may touch the same files, so the branch merges origin/main before shipping.

## Amendments

None.

## Status history

- 2026-11-03 · — → Draft · agent · created from the gen coverage audit (H-5, H-58, H-29, H-30, H-57, G-124)
- 2026-11-03 · Draft → Clarified · agent · seven questions answered from gen, `@stackra/errors`, `@stackra/actions`,
  `@stackra/validation` and ADRs 0082, 0136, 0140, 0349
