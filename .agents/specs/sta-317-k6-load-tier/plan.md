# Implementation Plan: the k6 load tier, its first soaks and the capacity numbers

**Spec**: `.agents/specs/sta-317-k6-load-tier/spec.md` · **Linear**: STA-317 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-317-k6-load-tier/spec.md`

## Summary

The load tier follows the int tier's shape. `LOAD_TESTS` and `loadTier` in `@stackra/vitest-config/load` narrow a
member's config to `<subject>.load.test.ts`; gen writes `.stackra/vitest.load.config.ts` for a member that has one;
`stackra test --tier load` runs it and the root fans out through the uncached turbo task `test:load`, one member at a time (`--concurrency=1`). The kit is
`@stackra/testing/node`: a load test serves its subject in its own process (`serveLoadTarget`), drives it with k6
(`runK6`, one built-in script, executor and thresholds passed as `-e` values), then asserts on what the subject did and
keeps the numbers (`writeLoadReport`). Three soaks ship: the action pipeline, the queue and the outbox relay, the last
two on Postgres. `load.yml` runs them weekly; `runbooks/capacity.mdx` records what they measured.

## Technical Context

- **Language**: TypeScript (ESM); k6's JavaScript for the one script, held as a string
- **Members**: `@stackra/testing`, `@stackra/vitest-config`, `@stackra/gen`, `@stackra/cli`, `@stackra/actions`,
  `@stackra/queue`, `@stackra/outbox`
- **Testing**: vitest unit tests for every kit piece (k6 replaced by a shell stand-in); the soaks themselves run under
  real k6 1.3.0 and Postgres on box 2
- **Storage**: a throwaway Postgres database per soak file (`ownerPostgres`)
- **Runtime target**: node 24 on a workstation, a testbed box or the weekly hosted runner

## Constitution Check

| Law                                   | Result | Note                                                                        |
| ------------------------------------- | ------ | --------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `./node` imports no workspace package (package-boundary test)               |
| Secrets (ADR 0009)                    | PASS   | none; the workflow decrypts nothing                                         |
| Security                              | PASS   | loopback only, no shell, figures-only reports                               |
| HTTP and events                       | N/A    | no endpoint or event changes                                                |
| Tenancy                               | PASS   | soaks run owned writes as the NOBYPASSRLS role in two tenants               |
| Delegation                            | PASS   | Claude only                                                                 |
| Not built yet (ADR 0011)              | PASS   | nothing deferred                                                            |
| Test placement (ADR 0022)             | PASS   | `__tests__/<subject>.load.test.ts`                                          |
| Versions and catalogs                 | PASS   | no new package dependency; k6 pinned in the workflow; one changeset         |
| Deploy modes (ADR 0076)               | PASS   | test tooling only                                                           |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                                   |
| Docs and ADRs                         | PASS   | capacity runbook, test-infrastructure runbook, READMEs; implements ADR 0182 |

## Deploy modes

| Mode       | Behaviour                                                       |
| ---------- | --------------------------------------------------------------- |
| SaaS       | no runtime change                                               |
| On-prem    | no runtime change; the tier runs wherever k6 and Postgres exist |
| Air-gapped | no runtime change; k6 is a single binary that needs no network  |

## Correctness properties

- **P-001**: a target answers 204, 500 with the message, 404 for an unknown route, and its `latency` counts both —
  Validates: AC-001
- **P-002**: with a stand-in k6 that writes a summary and exits 0, 99 or 2, `runK6` answers passed, answers failed with
  the crossed thresholds, or throws with the error tail — Validates: AC-002
- **P-003**: `soakLoad` uses the overrides and throws a `RangeError` for `abc` or `10x` — Validates: AC-003
- **P-004**: `k6Binary` answers `STACKRA_K6`, else the `k6` on `PATH`, else undefined — Validates: AC-004
- **P-005**: gen writes the load config only once a `.load.test.ts` exists — Validates: AC-005
- **P-006**: `resolveTool` runs the load config, refuses without it and in an app; the root runs `turbo run test:load --concurrency=1`
  — Validates: AC-006
- **P-007**: the generated unit config excludes `*.load.test.*`; `loadTier` includes only `LOAD_TESTS`, file
  parallelism off, `maxConcurrency` 1, `retry` 0 — Validates: AC-005, AC-007
- **P-008**: the three soaks pass under k6 1.3.0 and Postgres on box 2 and write their reports — Validates: AC-008,
  AC-009, AC-010, AC-012

## Architecture overview

`pnpm test:load` → turbo `test:load` (uncached, after `^build` and gen, one member at a time) → each member's
`vitest run --config .stackra/vitest.load.config.ts` → each `.load.test.ts` wires its subject (a real database, workers
or relays looping beside it), `serveLoadTarget` exposes one unit of work per request, `runK6` spawns k6 with the built-in
script at a constant arrival rate, and the test asserts on the subject's own records (exactly once, nothing left, drain
time, lag) and k6's thresholds, then `writeLoadReport` keeps the numbers.

## Components and responsibilities

- `serveLoadTarget`, `runK6`, `k6Args`, `readK6Summary`, `K6_SCENARIO_SCRIPT`, `k6Binary`, `soakLoad`,
  `writeLoadReport`, `summariseLatencies`, `percentile` (`packages/developer/testing/src/node/`)
- `loadTier`, `LOAD_TESTS`, `LOAD_TEST_TIMEOUT_MS` (`packages/tooling/vitest/src/`)
- `emitLoadTierConfig`, `hasLoadTests`, `generate` (`packages/developer/gen/src/`)
- `resolveTool`, `toolCommand`, `COMMANDS` (`packages/developer/cli/src/node/`)
- the soaks: `action-pipeline.load.test.ts`, `queue-worker.load.test.ts`, `outbox-relay.load.test.ts`
- `.github/workflows/load.yml`, `turbo.jsonc` (`test:load`), root `package.json` (`test:load`)

## Files and folders

```text
packages/developer/testing/src/node/            (new entry, with __tests__)
packages/developer/testing/package.json
packages/developer/testing/tsdown.config.ts
packages/developer/testing/src/__tests__/package-boundary.test.ts
packages/tooling/vitest/src/load.ts
packages/tooling/vitest/src/functions/load-tier.function.ts
packages/tooling/vitest/src/constants/load-tests.constant.ts
packages/tooling/vitest/src/constants/load-test-timeout.constant.ts
packages/tooling/vitest/src/__tests__/load-tier.test.ts
packages/tooling/vitest/package.json
packages/developer/gen/src/core/functions/emit-load-tier-config.function.ts
packages/developer/gen/src/node/functions/has-load-tests.function.ts
packages/developer/gen/src/node/functions/generate.function.ts
packages/developer/cli/src/node/functions/resolve-tool.function.ts
packages/developer/cli/src/node/functions/tool-command.function.ts
packages/developer/cli/src/node/constants/commands.constant.ts
packages/developer/cli/src/node/errors/cli-usage.error.ts
turbo.jsonc
package.json
packages/application/actions/src/core/services/__tests__/action-pipeline.load.test.ts
packages/runtime/queue/src/node/services/__tests__/queue-worker.load.test.ts
packages/runtime/outbox/src/node/services/__tests__/outbox-relay.load.test.ts
packages/application/actions/package.json
packages/runtime/queue/package.json
packages/runtime/outbox/package.json
.github/workflows/load.yml
.github/workflows/README.md
apps/docs/src/docs/runbooks/capacity.mdx
apps/docs/src/docs/runbooks/test-infrastructure.mdx
apps/docs/src/config/docs.config.ts
packages/developer/testing/README.md
packages/developer/testing/AGENTS.md
packages/tooling/vitest/README.md
.changeset/k6-load-tier.md
packages/developer/gen/src/core/functions/__tests__/emit-load-tier-config.function.test.ts
packages/developer/gen/src/node/functions/__tests__/has-load-tests.function.test.ts
packages/developer/gen/src/node/functions/__tests__/generate.function.test.ts
packages/developer/cli/src/node/functions/__tests__/resolve-tool.function.test.ts
packages/developer/cli/src/node/functions/__tests__/tool-command.function.test.ts
```

## Data models and migrations

none

## Contracts

The exports listed under Impact. A load test's contract with k6 is the built-in script: `POST
<target>/scenarios/<name>` with no body, 204 meaning one unit served.

## Error handling

- k6 missing: `runK6` throws; the test file skips before it gets there (`k6Binary() === undefined`).
- k6 exits other than 0 or 99, or writes no summary: `runK6` throws with the last 4 KiB of its error output.
- A crossed threshold: `passed: false` and `crossed` names it; the test fails on `expect(k6.crossed).toEqual([])`.
- A scenario that throws: 500 with the message; `latency(name).failed` counts it and keeps the first message.
- A malformed `STACKRA_LOAD_RATE` or `STACKRA_LOAD_DURATION`: `RangeError`, never ignored.

## Security and tenancy

The target listens on 127.0.0.1 on a free port. No body is read; no secret is read; reports hold figures. The Postgres
soaks write as the service role with row security forced, in two tenants, so the measured path is the production path.

## Testing strategy

- Unit: every kit function (stand-in k6 shell script for `runK6`), `loadTier`, `emitLoadTierConfig`, `hasLoadTests`,
  `generate`, `resolveTool`, `toolCommand`, the package-boundary test.
- Load: the three soaks under real k6 1.3.0 and Postgres in box 2's `stackra-demo` container, at the default 30 s and
  for the capacity numbers at ten minutes, reports kept in the capacity runbook.
- Revert checks: removing `load` from the CLI tiers, the gen branch or the boundary entry fails its test.

## Rollout

One changeset (minor for the kit, preset, gen and CLI; patch for the three subjects). The weekly workflow starts on the
next Monday after merge; nothing gates on it.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R1.

## ADRs

ADR 0182 decisions 1 and 4, implemented as written. ADR 0078, 0148, 0149, 0221, 0473 for what the soaks hold the
subjects to. ADR 0502 sets this spec's tier.

## Docs

`runbooks/capacity.mdx` (new), `runbooks/test-infrastructure.mdx`, `docs.config.ts`, `.github/workflows/README.md`, the
testing and vitest-config READMEs, the testing AGENTS.md, the changeset.

## Complexity tracking

none
