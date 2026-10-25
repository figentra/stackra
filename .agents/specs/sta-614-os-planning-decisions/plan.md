# Implementation Plan: No code without an answered questionnaire and a plan (the plan gate)

**Spec**: `.agents/specs/sta-614-os-planning-decisions/spec.md` · **Linear**: STA-614 · **Date**: 2026-10-25

## Summary

`_rules.mjs` gains `decidePlanGate` (async), `PLAN_GATED`, `HOTFIX_FIELDS` and `hotfixApproved`, plus a write rule that
refuses an agent's write to `.agents/specs/*/hotfix.md`. `guard-paths.mjs` calls the gate after `decideWrite`. The gate
finds the file's git checkout and branch, the branch's spec folder, and reuses `checkSpec` from
`tools/scripts/spec-gate.mjs`, loaded only for a source path.

## Technical Context

- **Language**: JavaScript on Node 24, no dependencies (the hooks run before `pnpm install`)
- **Members**: none; `.agents/hooks` and `apps/docs`
- **Testing**: `node:test` in `.agents/hooks/__tests__/plan-gate.test.mjs` (`pnpm test:hooks`)
- **Storage**: none

## Constitution Check

| Law                                   | Result | Note                                                |
| ------------------------------------- | ------ | --------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | N/A    | no member changes; hooks import a root script       |
| Secrets (ADR 0173)                    | PASS   | reads spec files only; no secret path               |
| Security                              | PASS   | an agent guard; fails open like every hook (README) |
| HTTP and events                       | N/A    | no action or event                                  |
| Tenancy                               | N/A    | no tenant data                                      |
| Delegation                            | PASS   | one builder; separate review                        |
| Not built yet (ADR 0227)              | PASS   | no rejected technology                              |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                               |
| Versions and catalogs                 | N/A    | no dependency                                       |
| Deploy modes (ADR 0076)               | N/A    | local tooling only                                  |
| Licence tier (ADR 0077)               | N/A    | not distributed                                     |
| Docs and ADRs                         | PASS   | ADR 0362, `.agents/hooks/README.md`                 |

## Deploy modes

| Mode       | Behaviour                    |
| ---------- | ---------------------------- |
| SaaS       | not deployed; developer tool |
| On-prem    | not deployed; developer tool |
| Air-gapped | not deployed; developer tool |

## Correctness properties

- **P-001**: A source write with no single spec folder for the branch key, or no key, is refused — Validates: FR-001
- **P-002**: A source write is allowed only when `checkSpec` returns nothing and plan.md is non-empty — Validates: FR-002
- **P-003**: A filled hotfix marker allows the write, a partial one does not, and an agent never writes it — Validates: FR-003
- **P-004**: Non-source paths and files outside git are never refused by the gate — Validates: FR-004

## Contracts and events

None. New exports of `.agents/hooks/_rules.mjs`: `decidePlanGate`, `PLAN_GATED`, `HOTFIX_FIELDS`, `hotfixApproved`.

## Data and tenancy

None.

## Delegation and risk plan

R3 (agent guard): one builder, a separate code review, no delegation. One wave.

## ADRs

ADR 0362 (Accepted). The same branch carries ADRs 0360 and 0361.

## Docs

ADR 0362, `.agents/hooks/README.md`.

## Project structure

`.agents/hooks/{_rules.mjs,guard-paths.mjs,README.md,__tests__/plan-gate.test.mjs}`,
`apps/docs/src/adr/0362-no-code-without-an-answered-questionnaire-and-a-plan.mdx`.
