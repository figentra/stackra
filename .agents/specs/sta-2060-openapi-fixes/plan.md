# Implementation Plan: openapi.json fixes and two JSON Schema fixes in gen

**Spec**: `.agents/specs/sta-2060-openapi-fixes/spec.md` · **Linear**: STA-2060 · **Date**: 2026-11-03

**Input**: Feature specification from `.agents/specs/sta-2060-openapi-fixes/spec.md`

## Summary

Four edits to `openApiOf` (security scheme and root requirement, `x-stackra-generated` in place of `$comment`, the
Idempotency-Key header on writes, per-status refusal responses from `ErrorKind`), the Crockford body in
`jsonSchemaOf`'s public id pattern with the decoder and the break check reading both bodies, and remote-base fields in
`jsonSchemaOf` with the referenced producer schemas copied by `buildManifest`. Goldens, committed manifests and
`apps/playground/openapi.json` are regenerated on ci-box.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/developer/gen` (`tier:lib`); regenerated contract files in the members that commit a manifest
  with a public id field and in `apps/playground` (`tier:app`)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); the golden test with `UPDATE_GOLDEN=1`
- **Storage**: none
- **Runtime target**: a library (the code generator)

## Constitution Check

| Law                                   | Result | Note                                                              |
| ------------------------------------- | ------ | ----------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | gen already depends on `@stackra/errors` and `@stackra/contracts` |
| Secrets (ADR 0009)                    | PASS   | none read or named                                                |
| Security                              | PASS   | documents the existing bearer requirement; no runtime change      |
| HTTP and events                       | PASS   | follows ADR 0082, 0136 and 0140                                   |
| Tenancy                               | N/A    | no tenant data or scope tree touched                              |
| Delegation                            | PASS   | one agent, one worktree                                           |
| Not built yet (ADR 0011)              | PASS   | no rejected technology; no validator dependency added             |
| Test placement (ADR 0022)             | PASS   | tests beside their subjects in `__tests__/`                       |
| Versions and catalogs                 | PASS   | no catalog or lockfile change                                     |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                 |
| Licence tier (ADR 0077)               | PASS   | free                                                              |
| Docs and ADRs                         | PASS   | gen README rows; no ADR needed                                    |

## Deploy modes

| Mode       | Behaviour                                        |
| ---------- | ------------------------------------------------ |
| SaaS       | same: a build-time projection, no runtime change |
| On-prem    | same                                             |
| Air-gapped | same                                             |

## Correctness properties

- **P-001**: Every root key of a projected document is an OpenAPI 3.1 root field or starts with `x-`; `$comment` is absent — Validates: FR-002
- **P-002**: The root requires `bearer`, the scheme exists, and an anonymous operation overrides with `[]` — Validates: FR-001
- **P-003**: A non-GET operation has exactly one `Idempotency-Key` header parameter, required iff idempotency is `required`; a GET has none — Validates: FR-003
- **P-004**: The per-status responses of an operation partition its known refusal codes by `ErrorKind` status; unknown codes add no status; `default` remains — Validates: FR-004
- **P-005**: For every prefix form, the pattern accepts a Crockford id in either case and refuses a body with I, L, O or U — Validates: FR-005
- **P-006**: The decoder maps both bodies to `publicId(prefix)`; the break check is silent for the old-to-new body and still reports any other pattern change — Validates: FR-006, FR-007
- **P-007**: A shape on a remote base lists the derived base fields plus its own, its own winning on a name clash; the manifest holds every producer schema those fields reference — Validates: FR-008, FR-009

## Architecture overview

All of it is in gen's pure core. `buildManifest` builds `schemas` with `jsonSchemaOf`, then closes dangling producer
`$ref`s from `MemberIR.services`; `openApiOf` reads the finished manifest and writes the document;
`zodOfJsonSchema` (clients) and `compareManifests` (backward compatibility) read manifest schemas. No node or CLI code
changes: `generate-member` and `emit-docs-site` already write whatever `openApiOf` returns.

## Components and responsibilities

- `openApiOf`: adds `components.securitySchemes`, root `security`, root `x-stackra-generated`; an
  `Idempotency-Key` header parameter for non-GET; per-status responses built by a small `refusal(category, codes?)`
  helper from `ErrorKind` meta (status and category), keyed by the manifest's `errors` (code to kind).
- `OpenApiDocument` type: `$comment` becomes `"x-stackra-generated"`; adds `security` and
  `components.securitySchemes`.
- `jsonSchemaOf`: the Crockford body constant; an optional third parameter, the consumed services
  (`MemberIR["services"]`), to resolve a remote base at the end of the chain into starting properties and required.
- `buildManifest`: passes `ir.services` to `jsonSchemaOf`; after the shapes, copies each referenced producer schema
  missing from `schemas`, transitively.
- `zodOfJsonSchema`: `PUBLIC_ID` reads either body.
- `compareManifests`: normalises the earlier body to the Crockford body before comparing a pattern.

## Files and folders

- `packages/developer/gen/src/core/functions/open-api-of.function.ts`
- `packages/developer/gen/src/core/types/open-api-document.type.ts`
- `packages/developer/gen/src/core/functions/json-schema-of.function.ts`
- `packages/developer/gen/src/core/functions/build-manifest.function.ts` (the schemas section only; the policies section
  and boot or registration emitters are not touched)
- `packages/developer/gen/src/core/functions/zod-of-json-schema.function.ts`
- `packages/developer/gen/src/core/functions/compare-manifests.function.ts`
- Tests: `packages/developer/gen/src/core/functions/__tests__/{open-api-of,json-schema-of,zod-of-json-schema,compare-manifests,build-manifest}.function.test.ts`
- Regenerated: `packages/developer/gen/__golden__/**/expected/**` (`UPDATE_GOLDEN=1`), every committed
  `stackra.manifest.json` holding a public id pattern, `apps/playground/openapi.json`
- `packages/developer/gen/README.md`, `.changeset/gen-openapi-fixes.md`

## Data models and migrations

none

## Contracts

`openapi.json` gains `x-stackra-generated`, `security`, `components.securitySchemes.bearer`, an `Idempotency-Key`
header on writes and per-status refusal responses; it loses the root `$comment`. Manifest `schemas` change the public id
pattern body and, for a shape on a remote base, gain the base's fields and the referenced producer schemas. No action
key, event name or permission changes.

## Error handling

No new gen error. A remote base with no known service manifest falls back to own fields (EC-04); the clients target
already refuses an unknown service. Refusal codes missing from `errors` fall to `default` (EC-02).

## Security and tenancy

The document declares the bearer scheme the gateway already enforces (ADR 0082, 0237). No permission, tenant or
personal data change.

## Testing strategy

- AC-001, AC-002, AC-003, AC-004: `open-api-of.function.test.ts` (root keys against the 3.1 root field list, scheme
  and requirement, anonymous override, header required and optional, none on GET, 412 response for
  `order_not_cancellable`, unknown code under `default`), plus the golden test over the three golden documents.
- AC-005: `json-schema-of.function.test.ts` (single, union and any prefix refuse I, L, O, U and accept both cases);
  `zod-of-json-schema.function.test.ts` (both bodies decode to `publicId`); `compare-manifests.function.test.ts`
  (old-to-new body is no break; another pattern change still is).
- AC-006: `json-schema-of.function.test.ts` (remote base, with pick, omit and partial, own field wins);
  `build-manifest.function.test.ts` (a referenced producer schema is copied).
- All runs on ci-box: `pnpm --filter @stackra/gen test`, the golden update, `stackra gen` for the committed manifests,
  then `pnpm verify`.

## Rollout

Released with the next `@stackra/gen` changeset (patch). Members in other repositories regenerate their manifests on
upgrade; a contract test with `expectBackwardCompatible` stays green through FR-007.

## Delegation and risk plan

One agent, one worktree. Main risk: committed manifests also change in STA-2036 and the build-manifest policies
section in STA-2045; merge origin/main in before shipping and regenerate after the merge.

## ADRs

ADR 0082, 0135, 0136, 0140, 0158, 0260, 0349 (all Accepted). No new ADR.

## Docs

`packages/developer/gen/README.md`: the `openApiOf` row (security, Idempotency-Key, per-status refusals) and the public
id row (Crockford body).

## Complexity tracking

none
