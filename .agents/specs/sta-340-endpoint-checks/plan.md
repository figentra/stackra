# Implementation Plan: Endpoint refusals in gen

**Spec**: `.agents/specs/sta-340-endpoint-checks/spec.md` · **Linear**: STA-340 · **Date**: 2026-11-03

**Input**: Feature specification from `.agents/specs/sta-340-endpoint-checks/spec.md`

## Summary

`deriveEndpoint` prefixes every derived route with `/<area>` (`app` when no area is written), and `buildManifest`
records the area on every action entry. A new pure `checkEndpoints(ir, manifest)` in gen's full pass refuses route
collisions, versioned paths, routes outside their area, methods that contradict the kind or a transition, jobs without a
system or job actor, cron inputs the input schema rejects and intents without phrases. The overrides and route
constants that sit outside their area move under it, and every committed manifest, `openapi.json` and golden fixture is
regenerated.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/developer/gen` (`tier:lib`); `packages/commerce/loyalty-kit`,
  `packages/application/achievements`, `packages/security/consent`, `packages/cross-cutting/analytics`,
  `packages/application/clients`, `packages/foundation/contracts` (`tier:lib`); the regenerated manifests of the
  members listed in the spec's Impact; `apps/playground` (`tier:app`, regenerated only)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); the gen goldens in `packages/developer/gen/__golden__/` through
  `gen/node/__tests__/golden.test.ts`
- **Storage**: none
- **Runtime target**: a library (the code generator) and the committed contracts it writes

## Constitution Check

| Law                                   | Result | Note                                                                                  |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | gen reads only its IR and manifest; no new imports between members                    |
| Secrets (ADR 0009)                    | N/A    | no secret is named or read                                                            |
| Security                              | PASS   | routes can no longer leave the area that authenticates them                           |
| HTTP and events                       | PASS   | enforces the http-conventions rule (collision, method by kind, no versioned path)     |
| Tenancy                               | N/A    | no tenant-owned data                                                                  |
| Delegation                            | PASS   | one agent, one worktree; the action entry block is shared with wp-17, merged in order |
| Not built yet (ADR 0011)              | PASS   | no new technology                                                                     |
| Test placement (ADR 0022)             | PASS   | tests sit in `__tests__/` beside their subjects                                       |
| Versions and catalogs                 | PASS   | no dependency or catalog change                                                       |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                                     |
| Licence tier (ADR 0077)               | PASS   | free, this repo                                                                       |
| Docs and ADRs                         | PASS   | rule, gen docs and ADR Enforcement lines updated in the same change                   |

## Deploy modes

| Mode       | Behaviour                                         |
| ---------- | ------------------------------------------------- |
| SaaS       | build-time checks only; routes carry their prefix |
| On-prem    | same                                              |
| Air-gapped | same                                              |

## Correctness properties

- **P-001**: for every area `a` and every key, the derived path starts with `/a/` — Validates: FR-001
- **P-002**: every manifest action entry has an `area` that is one of the four codes — Validates: FR-002
- **P-003**: two routes with equal method and equal path after erasing parameter names refuse `endpoint_collision`;
  distinct shapes never do — Validates: FR-003
- **P-004**: a path segment matching `^v\d+$` refuses `endpoint_versioned`, and no other segment does — Validates:
  FR-004
- **P-005**: a route path that is not `/a` and does not start with `/a/` for its area `a` refuses
  `endpoint_area_mismatch` — Validates: FR-005
- **P-006**: query and non-GET, action and GET, transition override and non-PUT each refuse
  `endpoint_method_mismatch` — Validates: FR-006
- **P-007**: a `job` without a `system` or `job` actor refuses `job_without_system_actor` — Validates: FR-007
- **P-008**: each unknown, missing required or wrongly typed cron input property refuses `cron_input_invalid` once —
  Validates: FR-008
- **P-009**: `intent: true` without phrases in a base locale refuses `intent_phrases_missing` — Validates: FR-009
- **P-010**: the check is pure and runs only in the full pass, so `stackra gen --manifests` still writes — Validates:
  FR-010
- **P-011**: the golden suite and `stackra gen --check` over every committed manifest pass after regeneration —
  Validates: FR-011

## Architecture overview

Discovery reads each action or query class into the IR. `buildManifest` derives its route with `deriveEndpoint` and
writes the action entry; this change makes the derivation prefix every area and records the area on the entry. In the
full pass, `generateMember` runs the whole-member checks over the IR and the built manifest; `checkEndpoints` joins that
list, so a refusal stops `openapi.json`, the SDKs and the other emitted files from being written. The manifest pass is
unchanged, as for `checkConventions`.

## Components and responsibilities

- `deriveEndpoint`: the route convention; owns the area prefix (FR-001).
- `buildManifest` action entry block: records `area` (written or `app`) on every entry (FR-002); one changed line in
  the shared block that wp-17 and later packages also touch.
- `checkEndpoints` (new): the seven refusals of FR-003 to FR-009. It reads routes, areas, actors and jobs from the
  manifest entries, the input JSON Schema from the manifest's `schemas`, the `intent` option and the written key from
  the IR class, and the catalogues from `ir.catalogues`.
- `generateMember`: calls `checkEndpoints(ir, manifest)` in the full pass (FR-010).

## Files and folders

- `packages/developer/gen/src/core/functions/derive-endpoint.function.ts` (change)
- `packages/developer/gen/src/core/functions/build-manifest.function.ts` (change: `area` on every entry)
- `packages/developer/gen/src/core/functions/check-endpoints.function.ts` (new)
- `packages/developer/gen/src/core/functions/generate-member.function.ts` (change: one call)
- `packages/developer/gen/src/core/index.ts` (export `checkEndpoints`, as the other checks are)
- `packages/developer/gen/src/core/functions/__tests__/derive-endpoint.function.test.ts` (change)
- `packages/developer/gen/src/core/functions/__tests__/check-endpoints.function.test.ts` (new)
- `packages/developer/gen/__golden__/**` (regenerated expectations, plus a `refusal-endpoint-collision` scenario)
- `packages/commerce/loyalty-kit/src/node/actions/*.action.ts`, `src/node/queries/get-balance.query.ts` and their
  tests (overrides move under `/app`)
- `packages/application/achievements/src/node/queries/verify-award.query.ts` and its test (`/public/awards/verify`)
- `packages/security/consent/src/node/actions/issue-consent-snapshot.action.ts`,
  `src/contracts/constants/consent-snapshot-path.constant.ts` and their tests (`/public/consent/snapshots`)
- `packages/cross-cutting/analytics/src/contracts/constants/analytics-ingest-path.constant.ts` and its tests
  (`/public/analytics/batches`)
- `packages/application/clients/src/contracts/constants/device-order.constant.ts` and its tests
  (`/app/devices/acknowledged`)
- `packages/foundation/contracts/src/core/types/__tests__/fixtures/loyalty-kit.stackra.manifest.json`
- every committed `stackra.manifest.json` and `openapi.json` listed in the spec's Impact (regenerated)
- `.changeset/sta-340-endpoint-checks.md`
- docs: see Docs

## Data models and migrations

none

## Contracts

- Manifest: every `actions[]` entry carries `area`; every `endpoint.path` starts with `/<area>`.
- Route constants: `ANALYTICS_INGEST_PATH = "/public/analytics/batches"`, `CONSENT_SNAPSHOT_PATH =
"/public/consent/snapshots"`, `DEVICE_ORDER.acknowledgedPath = "/app/devices/acknowledged"`.
- New gen codes: `endpoint_collision`, `endpoint_versioned`, `endpoint_area_mismatch`, `endpoint_method_mismatch`,
  `job_without_system_actor`, `cron_input_invalid`, `intent_phrases_missing`.

## Error handling

Each refusal is a `GenError` with the class's file, the class as subject, the message and the fix (ADR 0294 decision
22). Gen collects every refusal of the member and writes nothing when there is one, as today. The runtime `TypeError`s
in `Action(...)` and `readCallOptions` for the job actor and the method by kind stay; gen now catches the same mistakes
before a test imports the class.

## Security and tenancy

The area prefix is what the edge and the generated gateway route and authenticate by (ADR 0237 decision 1, ADR 0290
decision 11). Refusing a route outside its area closes the gap where a public-area call could be served from a path the
edge treats as `app`, or an operator call outside the Access-guarded `/platform`. No permission, tenant rule or secret
changes.

## Testing strategy

- AC-001 to AC-003, AC-006 to AC-009: one fixture per code in `check-endpoints.function.test.ts`, each beside a
  conforming fixture that passes, carrying `@covers sta-340:FR-00n`.
- AC-004: `derive-endpoint.function.test.ts` covers each area and the default.
- AC-005: a `build-manifest` assertion through the golden suite (every golden entry has `area`).
- AC-010: the golden suite, `stackra gen --check` over every member, and the tests of loyalty-kit, achievements,
  consent, analytics, clients and contracts, all on ci-box.

## Rollout

One pull request. The changeset bumps `@stackra/gen` and the packages whose overrides or route constants move (minor,
0.x breaking). No flag: the routes are not served yet (the Encore adapters are G-2), so nothing deployed moves.

## Delegation and risk plan

One agent in `.claude/worktrees/sta-340-endpoint`. Installs, gen, typecheck and tests run on ci-box. The action entry
block of `build-manifest.function.ts` is shared with wp-17 (`figentra/sta-340-call-shape-checks`) and STA-2044/2045
edits: merge origin/main in before shipping and keep their behaviour. Risk: the regenerated manifests are a large but
mechanical diff; review reads the gen change and the moved overrides.

## ADRs

ADR 0082 (decision 3), ADR 0237 (decision 1), ADR 0290 (decision 11), ADR 0294 (decisions 21 and 22), ADR 0305 (rules
28 and 30), ADR 0118 (paths stay unversioned): all Accepted. No new ADR.

## Docs

- `.agents/rules/http-conventions.md` and the AGENTS.md block `tools/scripts/agents-sync.mjs` projects from it
- `packages/developer/gen/README.md`, `packages/developer/gen/AGENTS.md`
- `apps/docs/src/docs/adr/0237-generated-api-gateway-in-four-layers.mdx` and
  `apps/docs/src/docs/adr/0082-public-ids-and-api-areas.mdx` (Enforcement lines only)

## Complexity tracking

none
