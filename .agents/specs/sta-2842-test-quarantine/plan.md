# Implementation Plan: a flaky-test quarantine and shared-box test rules in the repository gate

**Spec**: `.agents/specs/sta-2842-test-quarantine/spec.md` · **Linear**: STA-2842 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2842-test-quarantine/spec.md`

## Summary

A new `test-markers` folder in `@stackra/cli` reads every test file once (`testFiles`), finds its markers
(`testMarkers`) and checks them against the committed list `tools/scripts/test-markers.yaml` (`testMarkerFindings`), and
applies the shared-box rules to the same files (`sharedBoxFindings`). Both readers work on masked source (`maskCode`),
so text in comments, strings, template text and regular expressions never counts. `VALIDATE_COMMAND` adds both
findings to `stackra validate --repository`. The 22 markers on main are listed as environment gates, and the relay,
promote and deploy tests stop taking fixed ports and the host's deploy lock.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/developer/cli` (developer), `packages/runtime/realtime` (test only),
  `packages/developer/flow-preset` (agent text)
- **Testing**: vitest in `src/**/__tests__/`, on CI and box 2
- **Storage**: the committed YAML list `tools/scripts/test-markers.yaml`
- **Runtime target**: `stackra validate --repository` in `pnpm validate`, on a workstation, a build box and CI

## Constitution Check

| Law                                   | Result | Note                                                 |
| ------------------------------------- | ------ | ---------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | no new import between members                        |
| Secrets (ADR 0009)                    | N/A    | none                                                 |
| Security                              | N/A    | reads test source only                               |
| HTTP and events                       | N/A    | none                                                 |
| Tenancy                               | N/A    | none                                                 |
| Delegation                            | PASS   | Claude only                                          |
| Not built yet (ADR 0011)              | N/A    | none                                                 |
| Test placement (ADR 0022)             | PASS   | tests stay in `__tests__/`                           |
| Versions and catalogs                 | PASS   | changesets: minor @stackra/cli, patch flow-preset    |
| Deploy modes (ADR 0076)               | N/A    | a repository gate                                    |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                            |
| Docs and ADRs                         | PASS   | testing standard, CLI README and test-engineer agent |

## Deploy modes

| Mode       | Behaviour                                |
| ---------- | ---------------------------------------- |
| SaaS       | unchanged: a repository gate, not a host |
| On-prem    | unchanged: a repository gate, not a host |
| Air-gapped | unchanged: a repository gate, not a host |

## Correctness properties

- **P-001**: an unlisted `skip` and an unlisted `skipIf` are each one finding naming the file, line and title; a test
  with no marker is none — Validates: AC-001
- **P-002**: a listed gate with a reason passes; a gate with no reason, and a `skip` listed as a gate, are findings —
  Validates: AC-002
- **P-003**: a quarantine with an issue, a reason and an `until` from today to today + 30 passes; an ended, a too-long,
  an undated, an issue-less or a reason-less quarantine is a finding — Validates: AC-003
- **P-004**: `.only`, a title-less marker, a marker under both sections, a stale entry and an unparsable list are
  findings — Validates: AC-004
- **P-005**: `listen(47913)`, `RELAY_PORT = 47_913` and a write to `/tmp/fixed` are findings; port 0, a port from the
  OS, a `mkdtemp` folder and a line with `// shared-box: <reason>` are not — Validates: AC-005
- **P-006**: a marker or a port inside a comment, string, template text or regular expression is not read; code inside
  `${ }` is — Validates: AC-006
- **P-007**: the relay test passes with a process holding 47914; the promote and deploy tests pass with a held host
  lock — Validates: AC-007
- **P-008**: this checkout has no marker findings and no shared-box findings — Validates: AC-008

## Architecture overview

`validate --repository` gathers findings from many checks and prints them as `<dir>: <finding>`. The new checks plug
into that list: `testFiles(root)` walks the checkout once for test files inside `__tests__/` (skipping dependencies,
build output and fixtures); `testMarkers` and `sharedBoxFindings` each read those files through `maskCode`;
`testMarkerFindings` compares the markers with the YAML list. The list follows the reviewed-list pattern of the row
security declarations (ADR 0282): a test that stops running shows in the list's diff and is reviewed.

## Components and responsibilities

- `maskCode`: blanks comments, strings, template text and regular expressions, keeping offsets and line breaks.
- `testFiles`: the test files of a checkout.
- `testMarkers`: every marker with its kind, file, 1-based line and the title of its test call.
- `testMarkerFindings`: the markers against the list (gates, quarantine, `.only`, stale entries).
- `sharedBoxFindings`: literal ports, fixed `*_PORT` constants and fixed shared paths, with the `shared-box` opt-out.
- `QUARANTINE_MAX_DAYS`, `TEST_MARKERS_LIST_FILE`: the 30-day limit and the list's path.
- `VALIDATE_COMMAND`: runs both checks.

## Files and folders

```text
packages/developer/cli/
  src/node/test-markers/constants/quarantine-max-days.constant.ts
  src/node/test-markers/constants/test-markers-list-file.constant.ts
  src/node/test-markers/types/test-marker.type.ts
  src/node/test-markers/functions/mask-code.function.ts
  src/node/test-markers/functions/test-files.function.ts
  src/node/test-markers/functions/test-markers.function.ts
  src/node/test-markers/functions/test-marker-findings.function.ts
  src/node/test-markers/functions/shared-box-findings.function.ts
  src/node/test-markers/functions/__tests__/*.test.ts
  src/node/constants/validate-command.constant.ts
  src/node/commands/__tests__/promote.command.test.ts
  src/node/runway-deploy/functions/__tests__/run-runway-deploy.function.test.ts
  README.md
packages/runtime/realtime/src/node/drivers/__tests__/lan-realtime-local-relay.driver.test.ts
packages/developer/flow-preset/preset/agents/test-engineer.md
.agents/agents/test-engineer.md
.claude/agents/test-engineer.md
.opencode/agents/test-engineer.md
.flow/lock.json
tools/scripts/test-markers.yaml
apps/docs/src/docs/standards/testing.mdx
.changeset/cli-test-marker-quarantine.md
.changeset/flow-preset-test-engineer-quarantine.md
```

## Data models and migrations

none. The list is YAML: `gates: { <test file>: { <title>: <reason> } }` and
`quarantine: { <test file>: { <title>: { issue, reason, until } } }`.

## Contracts

`stackra validate --repository` gains two finding sources and exits 1 on any of them. A repository without the list
file has no gates and no quarantine, so its markers are findings until listed. New `@stackra/cli` exports as named in
the spec's Impact.

## Error handling

An unparsable list or one that is not a map is one finding on the list file, and no marker is checked against it. A
test file that cannot be read is skipped by `testFiles`. Every other problem is a `<dir>: <finding>` line.

## Security and tenancy

none: the checks read the checkout's test source and the list, write nothing and run no test code.

## Testing strategy

- AC-001, AC-004, AC-008: `test-marker-findings.test.ts` and `test-markers.test.ts` (temp repositories, and the
  shipped list against this checkout).
- AC-002, AC-003: `test-marker-findings.test.ts` with fixed `today` dates at and past the limit.
- AC-005, AC-008: `shared-box-findings.test.ts`, including this checkout's tests.
- AC-006: `mask-code.test.ts` and the comment and string cases in `test-markers.test.ts`.
- AC-007: the relay driver test with a held port; the promote and deploy tests with a held lock.
- Revert check: with the wiring removed from `VALIDATE_COMMAND`, a planted unlisted `it.skip` and `RELAY_PORT = 47_913`
  make the built `validate --repository` exit 0; with it, exit 1 with both findings.

## Rollout

A minor changeset for `@stackra/cli` and a patch for `@stackra/flow-preset`. The 22 existing markers are listed in the
same change, so `pnpm validate` stays green on main.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2.

## ADRs

ADR 0182 (decision 4, the flaky-test quarantine) is implemented; no new ADR.

## Docs

The testing standard gains "Tests that do not always run" and "Shared-box rules" and two rows in "What enforces this";
the CLI README's `validate --repository` row names the test rules; the test-engineer agent describes both.

## Complexity tracking

none
