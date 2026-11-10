# Implementation Plan: stackra dev serves on when gen refuses one member

**Spec**: `.agents/specs/sta-2672-dev-past-gen-refusal/spec.md` · **Linear**: STA-2672 · **Date**: 2026-11-10

**Input**: Feature specification from `.agents/specs/sta-2672-dev-past-gen-refusal/spec.md`

## Summary

A new `runDevGen(context)` runs `stackra gen` for dev and answers whether dev may go on: yes on 0, yes with a stderr
line on 1 (a refusal), no otherwise. `runDevSurface` and `runDevProduct` use it in place of their own exit check.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/developer/cli` (developer)
- **Testing**: vitest in `src/**/__tests__/`, on CI
- **Storage**: none
- **Runtime target**: `stackra dev --surface` and `--product` on a workstation

## Constitution Check

| Law                                   | Result | Note                             |
| ------------------------------------- | ------ | -------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | no new import between members    |
| Secrets (ADR 0009)                    | N/A    | none                             |
| Security                              | N/A    | none                             |
| HTTP and events                       | N/A    | none                             |
| Tenancy                               | N/A    | none                             |
| Delegation                            | PASS   | Claude only                      |
| Not built yet (ADR 0011)              | N/A    | none                             |
| Test placement (ADR 0022)             | PASS   | tests stay in `__tests__/`       |
| Versions and catalogs                 | PASS   | a changeset patches @stackra/cli |
| Deploy modes (ADR 0076)               | N/A    | a local dev command              |
| Licence tier (ADR 0077)               | PASS   | free, MIT                        |
| Docs and ADRs                         | N/A    | no rule changes                  |

## Deploy modes

| Mode       | Behaviour                                  |
| ---------- | ------------------------------------------ |
| SaaS       | unchanged: a local dev command, not a host |
| On-prem    | unchanged: a local dev command, not a host |
| Air-gapped | unchanged: a local dev command, not a host |

## Correctness properties

- **P-001**: with gen exiting 1, `runDevProduct` starts every surface and app and writes the refusal line — Validates:
  AC-001
- **P-002**: with gen exiting 2, `runDevProduct` returns 1 and starts nothing — Validates: AC-002

## Architecture overview

Dev runs gen through the in-process CLI (`context.cli(["gen"], io)`), then starts its processes. Only the reading of
gen's exit code changes; a surface whose own bundle-mode config gen did not write still stops in `runDevSurface`.

## Components and responsibilities

- `runDevGen`: runs gen and decides whether dev goes on.
- `runDevSurface`, `runDevProduct`: call it.

## Files and folders

```text
packages/developer/cli/
  src/node/dev-surface/functions/run-dev-gen.function.ts
  src/node/dev-surface/functions/run-dev-surface.function.ts
  src/node/dev-product/functions/run-dev-product.function.ts
  src/node/dev-product/functions/__tests__/run-dev-product.function.test.ts
.changeset/cli-dev-past-gen-refusal.md
```

## Data models and migrations

none

## Contracts

`stackra dev` goes on past a gen refusal (exit 1) and names it; `stackra build` and `stackra gen --check` are unchanged.

## Error handling

A gen refusal is a stderr line and the run goes on; any other gen failure stops dev with exit 1, as before.

## Security and tenancy

none

## Testing strategy

- AC-001, AC-002: `run-dev-product.function.test.ts` with gen exiting 1 and 2.

## Rollout

A patch changeset for `@stackra/cli`, in 0.33.x.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R1.

## ADRs

none

## Docs

none

## Complexity tracking

none
