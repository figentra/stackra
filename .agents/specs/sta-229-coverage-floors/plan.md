# Implementation Plan: the ADR 0182 coverage floors run, and the box verify runs the int tier

**Spec**: `.agents/specs/sta-229-coverage-floors/spec.md` · **Linear**: STA-229 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-229-coverage-floors/spec.md`

## Summary

`@stackra/vitest-config/coverage` learns the two floors of ADR 0182 decision 2: `withCoverage` reads the member's
`package.json` name and applies `coverageThresholdsFor(name)` (90/90/80 for `STRICT_COVERAGE_PACKAGES`, 80/80/70
otherwise), with the member's documented override last. The root `test:coverage` covers services too, a new
`pnpm verify:box` chains `pnpm verify`, `pnpm test:int` and `pnpm test:coverage`, and the testbed fallback's `verify`
preset runs it. `stackra check` gains an opt-in `coverage` phase after `test` (both share `runTurboTaskPhase`),
`stackra test` gains `--coverage`, and the service scaffold writes `test:coverage`. Members that the strict floor or
the wider gate would fail are brought up to it.

## Technical Context

- **Language**: TypeScript (ESM), Node 24; Node test runner for `tools/scripts`
- **Members**: `packages/tooling/vitest`, `packages/developer/cli`, `packages/security/tenancy`,
  `packages/developer/testing`, `packages/design-system/showcase`, `packages/data/database`
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); `node --test tools/scripts/__tests__/*.test.mjs`
- **Storage**: none
- **Runtime target**: node (tooling)

## Constitution Check

| Law                                   | Result | Note                                                                      |
| ------------------------------------- | ------ | ------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the preset reads only `node:fs`; the CLI starts turbo as before           |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                                                |
| Security                              | PASS   | stricter floors on the security packages                                  |
| HTTP and events                       | N/A    | none                                                                      |
| Tenancy                               | N/A    | test configuration only                                                   |
| Delegation                            | PASS   | one session, one branch                                                   |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                                    |
| Test placement (ADR 0022)             | PASS   | tests sit in `__tests__/` beside each changed file                        |
| Versions and catalogs                 | PASS   | `@vitest/coverage-v8` from `catalog:quality`, already pinned              |
| Deploy modes (ADR 0076)               | PASS   | development tooling, same in all three                                    |
| Licence tier (ADR 0077)               | PASS   | free                                                                      |
| Docs and ADRs                         | PASS   | ADR 0182 Enforcement, standards, runbook, READMEs, AGENTS, two changesets |

## Deploy modes

| Mode       | Behaviour                       |
| ---------- | ------------------------------- |
| SaaS       | none (development tooling only) |
| On-prem    | none                            |
| Air-gapped | none                            |

## Correctness properties

- **P-001**: for every package name `n`, `coverageThresholdsFor(n)` is 90/90/80 exactly when `n` is in `STRICT_COVERAGE_PACKAGES`, and 80/80/70 otherwise or when `n` is undefined — Validates: FR-001
- **P-002**: for every member root, `withCoverage(config).test.coverage.thresholds` equals `coverageThresholdsFor(readPackageName(root))` overlaid by the member's overrides — Validates: FR-002
- **P-003**: every `packages/security/*` package name is in `STRICT_COVERAGE_PACKAGES` — Validates: FR-001
- **P-004**: every package or service with a `test` script (except the tooling presets) has `test:coverage` — Validates: FR-003
- **P-005**: the `coverage` phase returns one finding per task turbo names as failed, and none on exit 0 — Validates: FR-005

## Architecture overview

The floor is chosen where the coverage block is built, so no member config changes: every member already wraps its
config in `withCoverage`. The member's identity comes from its `package.json` in the config `root` or the working
directory, which turbo sets to the member root. The CLI's `test` and `coverage` phases are one turbo task each, so the
body of the old test phase moves into `runTurboTaskPhase(phase, task, run)` and both phases call it; `OPT_IN_PHASES`
names the two that `--with-tests` adds. The box verify is a root script, so the testbed, the fallback workflow and the
tester lane all run the same chain.

## Components and responsibilities

- `STRICT_COVERAGE_PACKAGES`, `STRICT_COVERAGE_THRESHOLDS` (`packages/tooling/vitest/src/constants/`): the strict
  group and its floor.
- `coverageThresholdsFor`, `readPackageName` (`packages/tooling/vitest/src/functions/`): the floor of one name; the name
  of one root.
- `withCoverage` (`packages/tooling/vitest/src/functions/with-coverage.function.ts`): applies the member's floor.
- `CoverageOverrides` (`packages/tooling/vitest/src/types/coverage-overrides.type.ts`): thresholds take any number.
- `COVERAGE_PHASE`, `OPT_IN_PHASES`, `runTurboTaskPhase`, `TEST_PHASE`, `CHECK_PHASES`, `parseCheckOptions`
  (`packages/developer/cli/src/node/`): the coverage phase and its opt-in.
- `resolveTool`, `toolCommand` (`packages/developer/cli/src/node/functions/`): `stackra test --coverage`.
- `serviceTemplate`, `SERVICE_CATALOGS`: the scaffold's `test:coverage` and provider.
- root `package.json`, `turbo.jsonc`, `.github/workflows/testbed-fallback.yml`: `verify:box`, the services filter, the
  preset.

## Files and folders

```text
package.json
turbo.jsonc
.github/workflows/testbed-fallback.yml
tools/scripts/__tests__/coverage-gate.test.mjs
packages/tooling/vitest/src/
├── coverage.ts
├── __tests__/coverage.test.ts
├── constants/strict-coverage-packages.constant.ts
├── constants/strict-coverage-thresholds.constant.ts
├── functions/coverage-thresholds-for.function.ts
├── functions/read-package-name.function.ts
├── functions/with-coverage.function.ts
└── types/coverage-overrides.type.ts
packages/developer/cli/src/node/
├── constants/check-phases.constant.ts
├── constants/coverage-phase.constant.ts
├── constants/opt-in-phases.constant.ts
├── constants/service-catalogs.constant.ts
├── constants/test-phase.constant.ts
├── functions/parse-check-options.function.ts
├── functions/resolve-tool.function.ts
├── functions/run-turbo-task-phase.function.ts
├── functions/service-template.function.ts
└── functions/tool-command.function.ts
packages/security/tenancy/vitest.config.ts
packages/developer/testing/src/e2e/{control,evict-shell,login-as,seed}/__tests__/
packages/design-system/showcase/package.json
```

- `packages/tooling/vitest/src/functions/with-coverage.function.ts`
- `packages/tooling/vitest/src/functions/coverage-thresholds-for.function.ts`
- `packages/tooling/vitest/src/functions/read-package-name.function.ts`
- `packages/tooling/vitest/src/constants/strict-coverage-packages.constant.ts`
- `packages/tooling/vitest/src/constants/strict-coverage-thresholds.constant.ts`
- `packages/developer/cli/src/node/constants/coverage-phase.constant.ts`
- `packages/developer/cli/src/node/functions/run-turbo-task-phase.function.ts`
- `tools/scripts/__tests__/coverage-gate.test.mjs`

## Data models and migrations

none

## Contracts

- `@stackra/vitest-config/coverage`: new `STRICT_COVERAGE_PACKAGES: readonly string[]`,
  `STRICT_COVERAGE_THRESHOLDS` (lines 90, functions 90, branches 80),
  `coverageThresholdsFor(name: string | undefined)`; `withCoverage(config, overrides)` unchanged in signature;
  `CoverageOverrides.thresholds?: Partial<Record<"lines" | "functions" | "branches", number>>`.
- `stackra check`: new phase `coverage` (opt-in, after `test`); `stackra test --coverage`.
- root scripts: `verify:box`; `test:coverage` adds `--filter='./services/**'`.
- Callers: every member's `vitest.config.ts` (through `withCoverage`), the testbed fallback, the tester lane.

## Error handling

A coverage failure is turbo's failed task; the phase turns each into one `failed` finding, or one exit finding when
turbo names none. `--coverage` with a non-unit tier is a `CliUsageError` (exit 2). An unreadable `package.json` gives
the default floor, never a throw.

## Security and tenancy

No data path changes. The strict floor applies to every `packages/security` package, and a repo test keeps a new one
from joining without it.

## Testing strategy

- AC-001, AC-002: `coverage.test.ts` ("are 80/80/70 for every member and 90/90/80 for the strict group", "withCoverage
  reads the floor from the member root's package.json", "falls back to the working directory", "puts a strict
  package's libraryPreset under the strict floor").
- AC-003, AC-005: `coverage-gate.test.mjs` ("verify:box runs the gate, then test:int, then the coverage floors",
  "test:coverage covers the packages and the services", "the testbed fallback's verify preset runs pnpm verify:box",
  "every package or service with a unit tier is in the coverage gate").
- AC-004: `check-phases.constant.test.ts` ("coverage runs turbo's test:coverage …") and
  `parse-check-options.function.test.ts`.
- AC-006: `resolve-tool.function.test.ts` ("measures the unit tier against the coverage floor with --coverage …"),
  `tool-command.function.test.ts`, `service-template.function.test.ts`.
- Revert check: with `withCoverage` back to the single floor, the `coverage.test.ts` strict cases fail.

## Rollout

Minor changesets for `@stackra/vitest-config` and `@stackra/cli`. The tester lane switches to `pnpm verify:box`
(root `AGENTS.md`). Products pick up the floors with the next `@stackra/vitest-config` release.

## Delegation and risk plan

One session, one branch. Budget: one PR.

## ADRs

ADR 0182 decisions 1 and 2, ADR 0282 decision 3, ADR 0484 decision 11, ADR 0022: all Accepted.

## Docs

ADR 0182 Enforcement, `apps/docs/src/docs/standards/testing.mdx`, `apps/docs/src/docs/runbooks/test-infrastructure.mdx`,
`.github/workflows/README.md`, root `AGENTS.md` and `flow.config.json`, `packages/tooling/vitest/README.md`,
`packages/tooling/vitest/AGENTS.md`, `packages/developer/cli/README.md`, `.changeset/coverage-floors-adr-0182.md`,
`.changeset/coverage-gate-check-phase.md`.

## Complexity tracking

none
