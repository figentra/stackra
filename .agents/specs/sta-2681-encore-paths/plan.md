# Implementation Plan: a service's tsconfig paths give Encore one `./` target per key, and its typecheck reads no paths

**Spec**: `.agents/specs/sta-2681-encore-paths/spec.md` · **Linear**: STA-2681 · **Date**: 2026-11-10

**Input**: Feature specification from `.agents/specs/sta-2681-encore-paths/spec.md`

## Summary

`pathsOfImports` keeps each `imports` entry's first target, so the tsconfig Encore reads has one `./` target per key;
tsc still probes extensions through it (`moduleResolution: bundler`). Gen writes a service's
`.stackra/tsconfig.typecheck.json` (the member's tsconfig with `paths` emptied and `include` naming the member's files,
since tsc's default include is relative to the config it is given), and `resolveTool` runs the service's
typecheck on it, so `#` imports resolve per package through `imports` instead of program-wide `paths`.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/developer/repo-checks`, `packages/developer/cli`, `packages/developer/gen` (developer);
  `services/example`, `services/health`
- **Testing**: vitest in `src/**/__tests__/`, the gen goldens, on the Testbed and CI
- **Storage**: none
- **Runtime target**: every service's Encore build and typecheck

## Constitution Check

| Law                                   | Result | Note                                      |
| ------------------------------------- | ------ | ----------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the CLI reads gen's exported constant     |
| Secrets (ADR 0009)                    | N/A    | none                                      |
| Security                              | N/A    | none                                      |
| HTTP and events                       | N/A    | none                                      |
| Tenancy                               | N/A    | none                                      |
| Delegation                            | PASS   | Claude only                               |
| Not built yet (ADR 0011)              | N/A    | none                                      |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                     |
| Versions and catalogs                 | PASS   | changesets patch repo-checks, cli and gen |
| Deploy modes (ADR 0076)               | PASS   | same in all three                         |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                 |
| Docs and ADRs                         | PASS   | ADR 0091 rule 4 corrected 2026-11-10      |

## Deploy modes

| Mode       | Behaviour                                                     |
| ---------- | ------------------------------------------------------------- |
| SaaS       | Encore resolves the service's `#` imports from its one target |
| On-prem    | the same                                                      |
| Air-gapped | the same                                                      |

## Correctness properties

- **P-001**: `pathsOfImports` gives each key exactly its first target — Validates: AC-001
- **P-002**: a service's gen output holds the typecheck tsconfig, a package's does not — Validates: AC-002
- **P-003**: a service's typecheck run names that config when it exists — Validates: AC-003

## Architecture overview

One rule changes shape (one target per key) where it is computed (`pathsOfImports`), so the validator and
`encore:prepare` follow it together. The typecheck's program drops `paths` through a generated config, never through
an edit of the authored tsconfig.

## Components and responsibilities

- `pathsOfImports`: the one-target map.
- `checkEncoreService`: the finding's wording.
- `TYPECHECK_TSCONFIG` and `emitToolConfigs`: the service's typecheck config.
- `resolveTool`: the typecheck run.

## Files and folders

```text
packages/developer/repo-checks/src/node/functions/paths-of-imports.function.ts (+ test)
packages/developer/repo-checks/src/node/functions/check-encore-service.function.ts (+ test)
packages/developer/cli/src/node/encore/functions/prepare-encore-service.function.ts
packages/developer/cli/src/node/functions/resolve-tool.function.ts (+ test)
packages/developer/gen/src/core/constants/typecheck-tsconfig.constant.ts
packages/developer/gen/src/core/functions/emit-tool-configs.function.ts
packages/developer/gen/src/core/index.ts
packages/developer/gen/__golden__/*/expected/services/*/.stackra/tsconfig.typecheck.json.golden (14)
services/example/tsconfig.json, services/health/tsconfig.json
apps/docs/src/docs/adr/0091-generated-encore-app-in-stackra-folder.mdx
.changeset/encore-paths-one-target.md
```

## Data models and migrations

none

## Contracts

none changed beyond the files above.

## Error handling

The validator's finding names the fix (`stackra encore:prepare`). A service without the generated config (gen has not
run) keeps today's typecheck.

## Security and tenancy

none.

## Testing strategy

- AC-001: `pathsOfImports` and `checkEncoreService` unit tests.
- AC-002: the gen goldens (14 service fixtures gain the file).
- AC-003: `resolveTool` unit test.
- AC-004: `stackra validate --repository` on CI.

## Rollout

Patch changesets for `@stackra/repo-checks`, `@stackra/cli` and `@stackra/gen`, in 0.33.1. A product runs
`stackra encore:prepare` in each service after the upgrade.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2.

## ADRs

ADR 0091: rule 4 of the 2026-11-09 amendment, corrected 2026-11-10.

## Docs

ADR 0091 only.

## Complexity tracking

none
