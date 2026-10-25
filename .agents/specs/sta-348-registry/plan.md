# Plan: `@stackra/registry` wave 2

**Spec**: `.agents/specs/sta-348-registry/spec.md`

## Design

- `CatalogueManifest` is a `Schema` class in `src/core/schemas/` that registers this package's hand-written zod schema
  (`CATALOGUE_MANIFEST_SCHEMA` in `src/core/constants/`) for itself, as `CursorInput` does in validation. The schema
  checks the header (`member`, `package`, `version`) and the identity fields of `modules`, `actions`, `events` and
  `permissions`; every object is `loose`, so open fields and other sections pass through. The four sections default
  to `[]`.
- `CatalogueDiagnosticCode` is `Enum.of` with the snake_case codes `manifest_invalid`, `duplicate_member`,
  `identity_collision` (the gen check's name, ADR 0294), `unknown_module`, `foreign_namespace`, `unknown_dependency`
  and `dependency_cycle`.
- `validateCatalogue(manifests)`: parse each with `validate`; sort the valid ones by member, package and input index;
  drop later duplicates of a member; walk modules, actions, events and permissions in that order recording the first
  owner of each identity; check namespaces and module references per member; check dependencies against every
  declared module; find loops with a DFS over sorted keys and report each loop once on its smallest key. Sort the
  result by member, path, code, message with code-unit comparison.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                           |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/application/registry`; workspace imports: `@stackra/contracts`, `@stackra/validation` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                            |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                                                          |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                   |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                 |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                         |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                               |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                      |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                              |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                             |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                        |

- Boundaries: runtime imports `@stackra/contracts`, `@stackra/validation`, `zod` only; no app, service or
  `encore.dev`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; codes snake_case.
- Secrets and PII: none.
- No parameter properties, no `#private` fields, no `enum`.

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.` — Validates: FR-001
- **P-002**: `.` exports `validateCatalogue`, `CatalogueManifest`, `CatalogueDiagnosticCode` (value and type) and the type `CatalogueDiagnostic`, and nothing else — Validates: FR-002
- **P-003**: `validateCatalogue(input)` returns diagnostics and never throws for untrusted input such as a non-object, `null` or a malformed manifest — Validates: FR-003
- **P-004**: `validateCatalogue` runs its structural checks through `@stackra/validation` (`validate` over a registered shipped schema) and holds no second validator — Validates: FR-004
