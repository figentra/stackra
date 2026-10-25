# Plan: `@stackra/access-log` wave 5

**Spec**: `.agents/specs/sta-348-access-log/spec.md`

## Design

- Four entries through stand-in barrels (STA-339 replaces them): `./contracts` from `src/contracts/` (the port and its
  types), `.` from `src/core/` and `src/config/` (isomorphic: the facet, the service, the configuration, the memory
  sink, the chain functions, the refusal), `./node` from `src/node/` (the module, the Explorer, the Postgres sink, the
  model, the migration, the macro, the job), `./testing` from `src/testing/` (the fake, the matcher, the factory).
- The facet records options only; `AccessLogExplorer` reads `DiscoveryService.classesWith(AccessLogged)` at bootstrap
  and replaces each declared method on the instance with a wrapper that reads `RequestContext.current()` and calls
  `AccessLogService.record` once the call settles.
- The chain is two pure functions over Web Crypto (`linkAccessRecord`, `findChainBreak`) sharing one internal hash, so
  building and verifying never drift; each driver owns its head and the order of its writes (a promise queue in memory,
  the unique (tenant, sequence) index and a bounded retry in Postgres).
- The Postgres write is `Database.transaction(..., { requiresNew: true })` around tenancy's `withTenant`, so the
  record survives a rolled-back read and lands in the caller's tenant chain under the forced equality policy.
- The migration uses partner macros (`belongsToTenant`, `dataClassification`) and one raw guard (the trigger) through
  `schema.sql` with its inverse; the model declares the same indexes.

## Constitution Check

| Law                                   | Result | Note                                                                                                                         |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/security/access-log`; imports only `tier:lib` packages; no app, service or `encore.dev`              |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                          |
| Security                              | PASS   | ids only in records; tamper evidence by the hash chain; append-only by trigger; a sink failure never opens or fails a call   |
| HTTP and events                       | PASS   | the job has no endpoint and no tool (system actor only); no event                                                            |
| Tenancy                               | PASS   | the table takes tenancy's trait and macro (forced equality policy); the write sets the record's tenant; no `tenant` declared |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) runs the tests; a separate reviewer  |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology; no CDC tool (ADR 0212 d5)                                                                |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                    |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                            |
| Deploy modes (ADR 0076)               | PASS   | one build in SaaS, on-prem and air-gapped                                                                                    |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                           |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; ADR 0212 stands, the open items are listed in the spec                             |

- Boundaries: runtime imports of actions, config, container, contracts, database, errors, model, tenancy and
  validation; dev-only `@stackra/gen` (the conformance test), `@stackra/testing` and the tooling presets.
- Versions: catalogs and `workspace:*` only.
- Naming: the facet `AccessLogged`, drivers `<Name>Driver`, the refusal ends in `Error`, the macro `<Name>Macro`, the
  job `PurgeAccessLogAction` with `PurgeAccessLogInput` and `PurgeAccessLogOutput` in `schemas/`.

## Properties

- **P-001**: `package.json` names `@stackra/access-log` at `packages/security/access-log` and `exports` lists only `.`, `./contracts`, `./node` and `./testing` — Validates: FR-001
- **P-002**: `@AccessLogged` records its options on a marked action, query or service and its subclasses, and throws on a class of any other kind — Validates: FR-002
- **P-003**: for every marked instance, the Explorer's targets equal gen's discovered targets, and each wrapped call writes exactly one record after it settles — Validates: FR-003
- **P-004**: for any values, the record's subjects are the principal when no field is named, else the distinct string values of the field, and `record` never rejects — Validates: FR-004
- **P-005**: for any run built by `linkAccessRecord`, `findChainBreak` returns undefined, and changing, removing or reordering any link returns that link's sequence — Validates: FR-005
- **P-006**: after any sequence of concurrent writes, a sink's links have sequences 1..n with no gaps and verify — Validates: FR-006
- **P-007**: the compiled migration has every column stated and commented, the tenant policy, the unique (tenant, sequence) index and the trigger with its inverse — Validates: FR-007
- **P-008**: for any instant and window, the job purges exactly the records with `at` before the instant minus `retentionDays` — Validates: FR-008
- **P-009**: the matcher passes exactly when one record matches the target, every given subject and the actor id — Validates: FR-009

## Deploy modes

| Mode       | Behaviour                                                                        |
| ---------- | -------------------------------------------------------------------------------- |
| SaaS       | the same build; records in the service's Postgres, one chain per tenant          |
| On-prem    | identical: the same build, no SaaS-only code path                                |
| Air-gapped | identical: needs no network; hashing is local Web Crypto, storage local Postgres |
