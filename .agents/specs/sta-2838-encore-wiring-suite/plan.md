# Implementation Plan: an Encore wiring suite for the generated app

**Spec**: `.agents/specs/sta-2838-encore-wiring-suite/spec.md` · **Linear**: STA-2838 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2838-encore-wiring-suite/spec.md`

## Summary

Gen writes a thin Encore suite for each service that runs as a generated Encore app, and the CLI runs it under
`encore test`. A new `encoreEndpoints` reads the endpoint rows once; `emitEncoreApi` prints the adapters from them
and `emitEncoreWiringTest` probes the same rows, so a route cannot exist in one and be missing from the other.
`stackra test --tier wiring` starts `encore test`, which runs the member's `test` script (`stackra test` again); the
tier reaches that inner run through `STACKRA_TEST_TIER`, and the inner run, seeing Encore's runtime variables, skips
gen and runs Vitest with the generated wiring config.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/developer/gen`, `packages/developer/cli` (developer); root `turbo.jsonc`
- **Testing**: vitest in `src/**/__tests__/`; the generated suite itself runs under `encore test` (Encore and Docker)
- **Storage**: none (the suite reads the Encore test database)
- **Runtime target**: the generated Encore app

## Constitution Check

| Law                                   | Result | Note                                                           |
| ------------------------------------- | ------ | -------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | cli already imports gen; no new import between members         |
| Secrets (ADR 0009)                    | N/A    | none; the probe token is a fixed non-token string              |
| Security                              | PASS   | the suite asserts the guarded routes refuse a bad credential   |
| HTTP and events                       | PASS   | adapters unchanged (same rows, byte-identical `api.ts`)        |
| Tenancy                               | N/A    | no data written                                                |
| Delegation                            | PASS   | Claude only                                                    |
| Not built yet (ADR 0011)              | PASS   | Encore stays generated (ADR 0091, 0124)                        |
| Test placement (ADR 0022)             | PASS   | unit tests in `__tests__/`; the generated suite in `.stackra/` |
| Versions and catalogs                 | PASS   | minor changesets for @stackra/gen and @stackra/cli             |
| Deploy modes (ADR 0076)               | PASS   | a test tier only                                               |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                      |
| Docs and ADRs                         | PASS   | CLI README, two docs pages, task vocabulary, ADR 0182 note     |

## Deploy modes

| Mode       | Behaviour                                  |
| ---------- | ------------------------------------------ |
| SaaS       | nothing deployed changes; a new test tier  |
| On-prem    | nothing deployed changes; a new test tier  |
| Air-gapped | the suite makes no outside call (loopback) |

## Correctness properties

- **P-001**: gen writes the suite and its config only for a service with its Encore service declaration, no authored
  entry, and `vitest` and `@stackra/vitest-config` declared — Validates: AC-001
- **P-002**: the suite's route rows equal the `api.raw` adapters of the generated `api.ts`, and a guarded row is
  probed for both refusals — Validates: AC-003
- **P-003**: every `export const x = api(` / `api.raw(` and `new CronJob|Topic|Subscription` of the member's Encore
  files is listed — Validates: AC-004
- **P-004**: the database check lists every model table of the manifest and is absent without `database.ts` —
  Validates: AC-005
- **P-005**: `--tier wiring` resolves to `encore test` (with the variable) outside Encore and to Vitest on the wiring
  config inside; the inner run does not generate — Validates: AC-006
- **P-006**: no run starts `encore test` from a tier it read in `STACKRA_TEST_TIER`, and an `encore test` that exits 0
  without the marker is a failure — Validates: AC-008
- **P-007**: a malformed bearer is refused before `JsonWebKeys` is resolved — Validates: AC-009

## Architecture overview

`generateMember` collects the Encore files as before. After `broker-message.ts`, `emitEncoreWiringTest` reads those
files' exports and `encoreEndpoints(ir, manifest)`, and writes the suite; `emitWiringTierConfig` writes its config.
The suite hands each request to the exported raw handler on a loopback `node:http` server, as Encore's gateway does;
Encore's own router is checked when `encore test` compiles the app.

## Components and responsibilities

- `encoreEndpoints`: the endpoint rows (calls, then own controllers, then a hosted package's).
- `emitEncoreApi`: prints the adapters from those rows (output unchanged).
- `emitEncoreWiringTest`: the suite; `emitWiringTierConfig`: its Vitest config.
- `resolveTool` / `toolCommand`: the `wiring` tier, outside and inside `encore test`; `insideEncoreTest` tells which.
- `serviceTemplate`: the `test:wiring` script; root `turbo.jsonc`: the uncached `test:wiring` task.

## Files and folders

```text
packages/developer/gen/src/core/
  constants/encore-wiring-config.constant.ts, constants/encore-wiring-test.constant.ts
  functions/encore-endpoints.function.ts, functions/emit-encore-wiring-test.function.ts,
  functions/emit-wiring-tier-config.function.ts, functions/emit-encore-api.function.ts,
  functions/generate-member.function.ts, index.ts
  types/encore-endpoint.type.ts, types/encore-call-endpoint.type.ts, types/encore-controller-endpoint.type.ts
  functions/__tests__/{encore-endpoints,emit-encore-wiring-test,emit-wiring-tier-config,generate-member}.function.test.ts
packages/developer/cli/src/node/
  constants/test-tier-variable.constant.ts, functions/inside-encore-test.function.ts
  functions/{resolve-tool,tool-command,service-template}.function.ts and their tests
packages/developer/cli/src/node/constants/wiring-ran-marker.constant.ts
packages/runtime/app/src/server/services/call-authenticator.service.ts
packages/runtime/app/src/server/services/__tests__/call-authenticator.service.test.ts
turbo.jsonc
.changeset/encore-wiring-suite.md
services/example/package.json
services/README.md
```

The last two are stackra-template's (its branch adds them with its root `package.json` and `turbo.jsonc`).

## Data models and migrations

none

## Contracts

Additive only: the three gen exports, the `wiring` tier and `STACKRA_TEST_TIER`. See the spec's Impact.

## Error handling

`stackra test --tier wiring` refuses outside a service and before gen wrote the config, naming why; an unknown tier
is still a usage error. A handler that throws inside the probe answers 500 with the error's message, so the failing
row names it.

## Security and tenancy

The suite sends no valid credential and runs no anonymous action, so it changes no data. Its refusal rows are the
check that a guarded route never runs for an unauthenticated caller.

## Testing strategy

- AC-001/P-001: `emit-encore-wiring-test` (none for package, authored entry, no Vitest, no service file) and
  `generate-member` (written after the Encore files with Vitest, not without).
- AC-003/P-002: the route rows counted against the real `api.ts` adapters; guarded, anonymous and controller rows.
- AC-004/P-003, AC-005/P-004: the listed resources and the tables.
- AC-006/P-005: `resolve-tool`, `tool-command`, `inside-encore-test`; AC-007: `service-template`.
- AC-008/P-006: `tool-command` (the variable outside Encore, a second `encore test`, a stale marker, Encore's own code).
- AC-009/P-007: `call-authenticator.service` (a malformed token with no `JsonWebKeys` bound).
- Revert checks for each behaviour; a run under `encore test` on box 2 when its disk allows.

## Rollout

Minor changesets for `@stackra/gen` and `@stackra/cli`, a patch for `@stackra/app`. stackra-template's branch
`figentra/sta-2838-template-wiring` adds the `test:wiring` script to `services/example`, the root script and the turbo
task; it merges after this release and the catalog bump that brings it (the template's CLI must know the tier). A CI
job that runs `turbo run test:wiring` on a created app (Encore and Docker on a box runner) is STA-2862.

## Delegation and risk plan

Claude only; one wave. R1.

## ADRs

ADR 0182 decision 3 (implemented; enforcement note added).

## Docs

CLI README; scaffolding guide; testing-by-kind standard; task vocabulary; ADR 0182 enforcement.

## Complexity tracking

none
