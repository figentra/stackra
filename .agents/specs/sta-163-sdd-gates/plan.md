# Implementation Plan: SDD gates and templates

**Spec**: `.agents/specs/sta-163-sdd-gates/spec.md` · **Linear**: STA-163 · **Date**: 2026-10-20

## Summary

Move the preset source to `.agents/speckit`, add `speckit-sync.mjs`, ship template v2, extend `spec-gate.mjs` with
the OR12 state machine and the tasks, lane, branch and bug rules, add `spec-trace.mjs`, share parsing in
`spec-parse.mjs`, and wire both gates into `pnpm validate` and CI.

## Technical Context

- **Language**: JavaScript ESM (`.mjs`), Node 24, no dependencies (ADR 0012 rule 4: gates read files and git only)
- **Members**: none; root tooling
- **Testing**: node:test in `tools/scripts/__tests__/`, fixtures in `tools/scripts/__tests__/__fixtures__/sdd/`
- **Storage**: none
- **Runtime target**: scripts run by `pnpm validate`, lefthook and CI

## Constitution Check

| Law                                   | Result | Note                                      |
| ------------------------------------- | ------ | ----------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   |                                           |
| Secrets (ADR 0009)                    | PASS   | no secret read or added                   |
| Security                              | PASS   | CI permissions unchanged                  |
| HTTP and events                       | N/A    | no endpoint or event                      |
| Tenancy                               | N/A    | no tenant data                            |
| Delegation                            | PASS   | lead-only; gate scripts are Claude-only   |
| Not built yet (ADR 0011)              | PASS   |                                           |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                     |
| Versions and catalogs                 | PASS   | no dependency                             |
| Deploy modes (ADR 0076)               | N/A    | developer tooling                         |
| Licence tier (ADR 0077)               | PASS   | MIT                                       |
| Docs and ADRs                         | PASS   | spec-lifecycle page; ADR 0120 enforcement |

## Deploy modes

| Mode       | Behaviour             |
| ---------- | --------------------- |
| SaaS       | not deployed; tooling |
| On-prem    | not deployed; tooling |
| Air-gapped | not deployed; tooling |

## Correctness properties

- **P-001**: A status is accepted only when every rule of that status and the earlier ones holds — Validates: FR-003
- **P-002**: Every tasks-lint problem names its line or ID, and a clean fixture yields none — Validates: FR-004
- **P-003**: Lane, branch, bug and ready rules are pure functions of commits, branch name, folders and test text — Validates: FR-005
- **P-004**: Trace and drift are pure functions of the spec folder texts, the test text and the changed paths — Validates: FR-006, FR-007
- **P-005**: The installed preset equals its source byte for byte; sync order is preset, workflow, OpenCode, Claude — Validates: FR-001
- **P-006**: The templates carry the v2 sections the gates read — Validates: FR-002
- **P-007**: `validate` runs both gates and CI passes the PR state and branch — Validates: FR-008

## Contracts and events

`spec-gate.mjs` exports `checkStage`, `checkPlan`, `checkTasks`, `checkLane`, `checkBranch`, `checkBug`, `statusOf`;
`spec-trace.mjs` exports `trace`, `traceProblems`, `drift`; `spec-parse.mjs` the parsers. CLI usage in each header.

## Data and tenancy

None.

## Delegation and risk plan

R3 (gate scripts): lead only, no delegation. One wave, sequential. Budget: none (no OpenCode dispatch).

## ADRs

ADR 0120 (Accepted) names `spec-gate` lane and folder enforcement as planned; this makes it true.

## Docs

`apps/docs/src/docs/agents/spec-lifecycle.mdx`.

## Project structure

`tools/scripts/{spec-gate,spec-trace,spec-parse,speckit-sync}.mjs`, their tests and fixtures,
`.agents/speckit/presets/stackra/**`, `.specify/presets/stackra/**` (generated), `package.json`, `lefthook.yml`,
`.github/workflows/ci.yml`.

## Complexity tracking

None.
