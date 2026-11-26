# Implementation Plan: cli: stackra upgrade moves a consumer between releases, with codemods and a release gate

**Spec**: `.agents/specs/sta-145-stackra-upgrade/spec.md` · **Linear**: STA-145 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-145-stackra-upgrade/spec.md`

## Summary

`stackra upgrade` reads the consumer's `@stackra/*` pins, plans the `UPGRADE_CODEMODS` entries between the oldest pin
and the target, bumps the pins, runs the entries' source codemods (ts-morph renames, ast-grep reports), then runs
`pnpm install`, each entry's commands in its folders, and `stackra gen`. `stackra upgrade-notes` keeps the entry list
complete: every break mark in a pending `@stackra/*` changeset or a released changelog entry needs an entry, named by
`Upgrade entry: <id>` or by the commit an entry's `source` names.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/developer/cli`
- **Testing**: vitest in `src/**/__tests__/`; codemod fixtures (before, after, findings) per source codemod
- **Storage**: none
- **Runtime target**: a developer's machine and CI (`pnpm validate`)

## Constitution Check

| Law                                   | Result | Note                                                         |
| ------------------------------------- | ------ | ------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | the CLI imports `@stackra/console` only                      |
| Secrets (ADR 0009)                    | N/A    | none                                                         |
| Security                              | PASS   | edits only the consumer's own checkout; a dirty tree refused |
| HTTP and events                       | N/A    | none                                                         |
| Tenancy                               | N/A    | none                                                         |
| Delegation                            | PASS   | Claude only                                                  |
| Not built yet (ADR 0011)              | PASS   | ADR 0199 Enforcement moves from planned to live              |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                                        |
| Versions and catalogs                 | PASS   | two minor changesets for `@stackra/cli`; deps in catalog     |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                            |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                    |
| Docs and ADRs                         | PASS   | CLI page, runbook, ADR 0199 Enforcement                      |

## Deploy modes

| Mode       | Behaviour                                          |
| ---------- | -------------------------------------------------- |
| SaaS       | the consumer runs `stackra upgrade` locally        |
| On-prem    | the same                                           |
| Air-gapped | the same, with the registry mirror for the install |

## Correctness properties

- **P-001**: pins move exactly; non-exact and non-`@stackra/*` specifiers are untouched — Validates: AC-001
- **P-002**: the plan is the ordered set of entries in (from, to] — Validates: AC-002, AC-008
- **P-003**: each source codemod turns its fixture into the expected source, reports exactly its findings, and changes
  nothing on a second run — Validates: AC-003, AC-004
- **P-004**: a dry run writes nothing — Validates: AC-005
- **P-005**: refusals exit 2; a failed step exits 1 and its named re-run completes — Validates: AC-006, AC-007
- **P-006**: every break mark in this repository is covered — Validates: AC-008, AC-009

## Architecture overview

A pure planner (`planUpgrade`, `planUpgradeCodemods`) over the pins and the entry list; a codemod runner that loads
ast-grep and ts-morph lazily; a step runner (`upgradeStepRuns`) for the install, the entries' commands and gen; a gate
(`checkUpgradeNotes` over `readReleaseNotes`) that needs no network.

## Components and responsibilities

- `UpgradeCommand`: flags, refusals, plan output, steps, the re-run hint.
- `UpgradeNotesCommand`: the release gate.
- `UPGRADE_CODEMODS`: 36 entries, 0.4.0 to 0.33.1, one constant file each.
- `renameExports`, `runSourceCodemods`, `reportCodemodFindings`: source edits and findings.

## Files and folders

```text
packages/developer/cli/src/node/commands/upgrade.command.ts
packages/developer/cli/src/node/commands/upgrade-notes.command.ts
packages/developer/cli/src/node/upgrade/constants/
packages/developer/cli/src/node/upgrade/functions/
packages/developer/cli/src/node/upgrade/types/
packages/developer/cli/stackra.manifest.json
package.json
.changeset/stackra-upgrade-codemods.md
.changeset/stackra-upgrade-notes-gate.md
```

## Data models and migrations

none

## Contracts

`stackra upgrade [--from <v>] [--to <v>] [--dry-run] [--no-install] [--only <id>] [--list] [--allow-dirty] [--json]`;
`stackra upgrade-notes [--json]`. A changeset names its entry on a line `Upgrade entry: <id>`.

## Error handling

Exit 2 for refusals (dirty tree, inexact version, a pin newer than the target); exit 1 for a failed step, with the
re-run named; `upgrade-notes` exits 1 with one finding per uncovered note.

## Security and tenancy

none.

## Testing strategy

- AC-001: `bump-stackra-pins.function.test.ts`, `plan-upgrade.function.test.ts`
- AC-002, AC-008: `plan-upgrade-codemods.function.test.ts`; the range tests 0.20.0 → 0.29.0 and 0.5.0 → 0.8.0 in
  `upgrade-codemods.constant.test.ts`
- AC-003, AC-004: `rename-exports.function.test.ts`, `run-source-codemods.function.test.ts`, the fixtures in
  `upgrade-codemods.constant.test.ts`
- AC-005 to AC-007: `upgrade.command.test.ts`, `upgrade-step-runs.function.test.ts`
- AC-009: `upgrade-notes.command.test.ts`, `check-upgrade-notes.function.test.ts`, and the repository check in
  `upgrade-codemods.constant.test.ts`

## Rollout

Two minor changesets for `@stackra/cli`. Consumers get the command with the next release.

## Delegation and risk plan

Claude only; two waves (the command, then review round 2); route `spec-task`. R2.

## ADRs

ADR 0199 (decision 2 and Enforcement), implemented; no new ADR.

## Docs

The CLI page (English and Arabic), the upgrade runbook, ADR 0199 Enforcement, the CLI README and AGENTS.md.

## Complexity tracking

none
