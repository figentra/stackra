# Implementation Plan: main's Quality Gate passes: TSDoc blocks, a typecheck cap and tsconfig without baseUrl

**Spec**: `.agents/specs/sta-2665-main-green/spec.md` · **Linear**: STA-2665 · **Date**: 2026-11-09

**Input**: Feature specification from `.agents/specs/sta-2665-main-green/spec.md`

## Summary

Each of the 52 findings gets a TSDoc block, or its label becomes a purpose sentence of at least three words. The
Typecheck step passes `--concurrency=2`. The service check refuses `baseUrl`, `stackra encore:prepare` removes it, and
the two services drop it.

## Technical Context

- **Language**: TypeScript (ESM); GitHub Actions YAML
- **Members**: apps/playground, apps/mobile, ai, notifications, database, ui, gen, repo-checks, cli, services/example,
  services/health
- **Testing**: vitest and node:test in `src/**/__tests__/`; `pnpm validate`; the Quality Gate
- **Storage**: none
- **Runtime target**: unchanged

## Constitution Check

| Law                                   | Result | Note                                         |
| ------------------------------------- | ------ | -------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | cli imports gen's `formatJson` (lib to lib)  |
| Secrets (ADR 0009)                    | N/A    | none                                         |
| Security                              | N/A    | none                                         |
| HTTP and events                       | N/A    | none                                         |
| Tenancy                               | N/A    | none                                         |
| Delegation                            | PASS   | Claude only                                  |
| Not built yet (ADR 0011)              | N/A    | none                                         |
| Test placement (ADR 0022)             | PASS   | tests stay in `__tests__/`                   |
| Versions and catalogs                 | PASS   | a changeset patches repo-checks, cli and gen |
| Deploy modes (ADR 0076)               | PASS   | same in all three                            |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                    |
| Docs and ADRs                         | PASS   | ADR 0007's docblocks; ADR 0091 rule 4 fixed  |

## Deploy modes

| Mode       | Behaviour                                   |
| ---------- | ------------------------------------------- |
| SaaS       | unchanged: docblocks, CI and a tsconfig key |
| On-prem    | unchanged: docblocks, CI and a tsconfig key |
| Air-gapped | unchanged: no outbound call added           |

## Correctness properties

- **P-001**: `stackra validate --repository` on the branch reports no ADR 0007 finding — Validates: AC-001
- **P-002**: the Typecheck step's turbo command carries `--concurrency=2` — Validates: AC-002
- **P-003**: the service check reports a `baseUrl`, and `encore:prepare` writes `paths` with no `baseUrl` —
  Validates: AC-003

## Architecture overview

No flow changes. The doc check reads the same blocks, now complete; turbo runs the same typecheck tasks two at a
time; Encore and tsc resolve the services' `paths` from the tsconfig's folder, without `baseUrl`.

## Components and responsibilities

- The docblocks: say what each export and member is for (ADR 0007).
- `.github/workflows/ci.yml` Typecheck step: the concurrency cap.
- `checkEncoreService`: requires `paths` equal to `imports` and refuses `baseUrl`.
- `prepareEncoreService`: deletes `baseUrl`, writes `paths`, keeps the tsconfig's file contract.

## Files and folders

```text
apps/mobile/src/demos/free/scheduling-board/read-only.tsx
apps/playground/src/demos/free/**  (12 demo files)
packages/application/ai/src/contracts/types/{tamo-part-data,tamo-table-column}.type.ts
packages/communication/notifications/src/testing/drivers/{memory-notification-preferences-client,memory-push-registration}.driver.ts
packages/data/database/src/core/constants/table-declaration-markers.constant.ts
packages/data/database/src/testing/types/role-policy-row.type.ts
packages/design-system/ui/src/**  (16 scheduling and dither types and enums)
packages/developer/gen/src/core/types/seeder-row.type.ts
packages/developer/gen/src/core/index.ts (exports formatJson)
packages/developer/repo-checks/src/node/constants/layout-templates.constant.ts
packages/developer/repo-checks/src/node/functions/check-encore-service.function.ts (and its test)
packages/developer/cli/src/node/functions/prepare-encore-service.function.ts
packages/developer/cli/src/node/commands/encore-prepare.command.ts (and its test)
services/example/tsconfig.json
services/health/tsconfig.json
apps/docs/src/docs/adr/0091-generated-encore-app-in-stackra-folder.mdx
.github/workflows/ci.yml
.changeset/encore-paths-without-baseurl.md
```

## Data models and migrations

none

## Contracts

none changed: docblocks are comments; the service check gains one refusal (`baseUrl`) that TypeScript 7 already makes.

## Error handling

The service check reports `compilerOptions.baseUrl must go` with the `encore:prepare` fix; nothing else changes.

## Security and tenancy

none

## Testing strategy

- AC-001: the Quality Gate's `pnpm validate` on this branch.
- AC-002: the Quality Gate's Typecheck finishes on this wide branch, as it did not before.
- AC-003: `check-encore-service.function.test.ts` and `encore-prepare.command.test.ts`.

## Rollout

A patch changeset for `@stackra/repo-checks`, `@stackra/cli` and `@stackra/gen`; released in 0.33.0. Consumer
services run `stackra encore:prepare` once to drop `baseUrl`.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R1.

## ADRs

ADR 0091 (Accepted): rule 4 now names `paths` without `baseUrl`.

## Docs

ADR 0091.

## Complexity tracking

none
