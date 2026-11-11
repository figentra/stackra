# Implementation Plan: release: the 0.33.1 boot set in one merge

**Spec**: `.agents/specs/sta-2690-release-0-33-1-boot/spec.md` · **Linear**: STA-2690 · **Date**: 2026-11-11

**Input**: Feature specification from `.agents/specs/sta-2690-release-0-33-1-boot/spec.md`

## Summary

Branch off main, merge the boot drafts in stack order, resolve conflicts once, run one Testbed gate dry-run with CI's
environment, push, open one pull request. The owner or leader merges it; the leader closes the folded originals.

## Technical Context

- **Language**: as the nine (TypeScript, MDX, JSON)
- **Members**: as the nine
- **Testing**: the nine's own tests; one Testbed gate dry-run; the Quality Gate on CI
- **Storage**: none
- **Runtime target**: the 0.33.1 release

## Constitution Check

| Law                                   | Result | Note                            |
| ------------------------------------- | ------ | ------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | as reviewed in each of the nine |
| Secrets (ADR 0009)                    | PASS   | #1024's generated dev values    |
| Security                              | PASS   | as reviewed in each of the nine |
| HTTP and events                       | PASS   | as reviewed in each of the nine |
| Tenancy                               | PASS   | #1022 as reviewed               |
| Delegation                            | PASS   | Claude only                     |
| Not built yet (ADR 0011)              | N/A    | none                            |
| Test placement (ADR 0022)             | PASS   | as the nine                     |
| Versions and catalogs                 | PASS   | the nine's changesets           |
| Deploy modes (ADR 0076)               | PASS   | as the nine                     |
| Licence tier (ADR 0077)               | PASS   | free, MIT                       |
| Docs and ADRs                         | PASS   | the nine's own notes            |

## Deploy modes

| Mode       | Behaviour   |
| ---------- | ----------- |
| SaaS       | as the nine |
| On-prem    | as the nine |
| Air-gapped | as the nine |

## Correctness properties

- **P-001**: the branch's diff against main is the union of the included pull requests plus the named resolutions —
  Validates: AC-001
- **P-002**: the combined dry-run and the gate are green — Validates: AC-002

## Architecture overview

Merge commits plus conflict resolutions; nothing else is authored here.

## Components and responsibilities

- the nine pull requests: their changes, specs, changesets and tests.
- this branch: their order, the resolutions and one gate run.

## Files and folders

```text
.agents/specs/sta-2690-release-0-33-1-boot/spec.md
.agents/specs/sta-2690-release-0-33-1-boot/plan.md
.agents/specs/sta-2690-release-0-33-1-boot/tasks.md
packages/developer/gen/src/core/functions/__tests__/emit-wiring.function.test.ts
packages/tooling/typescript/src/base.json
.changeset/typescript-config-stackra-encore-exclude.md
knip.jsonc
packages/developer/cli/stackra.manifest.json
packages/data/database/src/core/schemas/__tests__/database-config-options.schema.test.ts
packages/developer/cli/src/node/commands/__tests__/dev-secrets-init.command.test.ts
packages/developer/gen/src/core/functions/__tests__/emit-encore-events.function.test.ts
packages/developer/gen/src/core/functions/__tests__/generate-member.function.test.ts
packages/developer/runway/src/node/functions/__tests__/encore-deploy-tree.function.test.ts
packages/developer/gen/__golden__/consumer/expected/services/catalogue/stackra-encore/catalogue/
packages/developer/gen/__golden__/cross-app-consumer/expected/services/catalogue/
```

The integration fixes (T003) are where two of the nine meet, or where a pull request's own check was never run
(CI runs no tests): the base preset excludes `stackra-encore/` (#1015's folder, read by a `node`-preset service's
default include), knip reads it as a service entry, the cli manifest gains #1024's command row, and four tests and
two goldens follow what the merged generator writes.

The nine pull requests' own files are listed per pull request in tasks.md.

## Data models and migrations

none beyond the nine.

## Contracts

none beyond the nine.

## Error handling

A conflict is resolved once here and named in the pull request body; a draft that cannot be made green drops to
0.33.2 by name.

## Security and tenancy

As reviewed in each of the nine.

## Testing strategy

- AC-001: every included head is an ancestor of the branch head.
- AC-002: one Testbed gate dry-run (CI's environment, fflow on a main-parented tree), then the Quality Gate.

## Rollout

0.33.1 = #1027 plus this set if its gate is green within about two hours of #1027's merge; otherwise 0.33.1 is
#1027 alone and this set is 0.33.2 the same day.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2.

## ADRs

none

## Docs

none

## Complexity tracking

none
