# Plan: spec tiers (trivial, small, feature, big)

**Spec**: `.agents/specs/sta-1721-spec-tiers/spec.md`

> **Revised 2026-10-31 (leader, decision D7 of the Figentra Flow final plan, `notes/plans/flow-final-plan.md`).**
> Figentra Flow is the only home of these rules. The `@stackra/repo-checks` copy below was removed before landing; core
> keeps the ADR, the preset and template text, the docs and the plan-gate hook, which imports
> `@figentra-oss/flow/gate`. `stackra check`'s spec phase reaches the rules by calling `figentra-flow gate ci` and
> `figentra-flow trace ci` (`chore/cli-vellum`). The repo-checks steps below are historical.

## Architecture overview

The rules live once, as pure functions in `@stackra/repo-checks` (erasable TypeScript, loaded by plain Node), and run
in two places: `specFindings` (the CLI's spec phase) and core's `tools/scripts/spec-gate.mjs` wrappers. Figentra
Flow's `gate` carries a plain-JavaScript copy until the Figentra Flow wave replaces core's scripts.

## Components and responsibilities

- `specTierOf`, `specComputedTier`, `specCheckTier`: the declared tier, the diff's floor, the tier rule.
- `specApprovedAt`, `specCheckApproval`: the approval stops.
- `specCheckCriteria`, `specCheckDesign`, `specCheckTraceTasks`: EARS criteria, the design sections, the task trace.
- `specCheckStage`, `specFindings`: run them by status and on the PR's diff.

## Files and folders

- `packages/developer/repo-checks/src/node/constants/`: `spec-tiers.constant.ts`, `spec-design-sections.constant.ts`
- `packages/developer/repo-checks/src/node/functions/`: `spec-tier-of`, `spec-computed-tier`, `spec-check-tier`,
  `spec-approved-at`, `spec-check-approval`, `spec-check-criteria`, `spec-check-design`, `spec-check-trace-tasks`
  (each `.function.ts`), and the changed `spec-check-stage`, `spec-findings`, `spec-check-tasks`
- `tools/scripts/spec-checks.mjs`, `tools/scripts/spec-gate.mjs`
- `.agents/speckit/presets/stackra/templates/` and `commands/speckit.{clarify,plan}.md`, rendered by `pnpm speckit:sync`
- `apps/docs/src/docs/adr/0502-spec-tiers-and-approval-stops.mdx`, `apps/docs/src/docs/agents/spec-lifecycle.mdx`
- Figentra Flow (figentra/flow): `packages/figentra-flow/src/commands/gate.mjs`, its tests and `assets/`

## Data models and migrations

none

## Contracts

The exported functions above; `spec-gate.mjs` gains `tierOf`, `computedTier` and `approvedAt`. No action, query, event
or API.

## Error handling

Every rule returns problem strings, which the gate prints and turns into a non-zero exit; nothing throws.

## Security and tenancy

none: the checks read the repository only. Money, permission and contract diffs get a higher floor.

## Testing strategy

Unit tests per function and through `specCheckStage` and `specFindings` (`spec-tiers.function.test.ts`), Figentra Flow's
`node:test` cases, and the gate run on this branch.

## Rollout

Older specs without a `**Tier**` keep the ADR 0120 rules, so nothing in flight breaks. The plan-gate hook change waits
for the owner. Figentra Flow's copy lands with its fresh-start branch.

## Design

Built on STA-1669 (the spec checks in `@stackra/repo-checks`, the CLI's spec phase over `specFindings`).

1. **repo-checks** (erasable TypeScript, relative `.ts` imports, loaded by plain Node):
   - `SPEC_TIERS` (`trivial`, `small`, `feature`, `big`), `specTierOf(text)` (the `**Tier**` header).
   - `specComputedTier(changes)` over `git diff --name-status`: the minimum tier and the reasons (FR-2).
   - `specCheckTier({ declared, computed, reasons })`: a declared tier below the computed one is a problem.
   - `specApprovedAt(text, stage)`: whether the `**Status**` line or a `## Status history` line for `stage` carries
     `Approved by <who> <YYYY-MM-DD>`.
   - `specCheckApproval(text)`: feature needs the Planned approval from Tasked on; big needs the Clarified approval from
     Planned on and the Planned approval from Tasked on; both need `**Approver**`.
   - `specCheckStage` runs `specCheckApproval`, and a small spec's Planned and Tasked stages read `## Plan` and
     `## Tasks` in spec.md instead of plan.md and tasks.md.
   - `specFindings` computes the tier from the diff and checks it against the branch's own spec (none: trivial).
2. **core wrappers**: `tools/scripts/spec-checks.mjs` loads the new files; `spec-gate.mjs` re-exports
   `tierOf`, `computedTier`, `approvedAt`, and its `ci`/`lane` modes run the tier check.
3. **plan-gate hook** (ADR 0362): no spec folder for the branch key means trivial, so writing is allowed. Small needs
   an answered spec. Feature and big also need plan.md and the approvals of FR-5. A spec without a `**Tier**` keeps the
   current rule.
4. **Templates and docs**: the spec template gains `**Tier**` and `**Approver**`; the speckit skills ask for approval
   with the question tool (Approve, Revise with notes, Reject); ADR 0502 records the decision.
5. **Figentra Flow**: `gate.mjs` gains the same pure functions and checks; its assets are re-copied from core's template.

## Properties

- **P-001**: A spec's tier is its `**Tier**` header, and a branch with no spec is trivial — Validates: FR-1
- **P-002**: The computed tier is the highest any changed path forces, and a lower declared tier is one problem naming the reasons — Validates: FR-2
- **P-003**: A small spec reaches Planned and Tasked through `## Plan` and `## Tasks` in spec.md, with no plan.md or tasks.md — Validates: FR-3
- **P-004**: A feature spec is refused at Tasked without its Planned approval; a big spec at Planned without its Clarified approval and at Tasked without its Planned approval — Validates: FR-4, FR-5
- **P-005**: A feature or big spec past Clarified without `**Approver**` is a problem — Validates: FR-6
- **P-006**: The speckit skills ask for approval with the question tool and loop on Revise — Validates: FR-7
- **P-007**: The plan-gate hook allows a write on a branch with no spec folder — Validates: FR-8
- **P-008**: Figentra Flow's gate returns the same problems as core's checks on the same inputs — Validates: FR-9
- **P-009**: A tiered spec's criteria are EARS lines with AC ids, its design has every required section, and its tasks trace to criteria and files — Validates: FR-10

## Tests

- repo-checks: each new function and the small-tier and approval paths of `specCheckStage`, plus `specFindings`
  over a diff that adds a migration under a small spec.
- hook: the plan-gate test gains trivial (no folder), small, and feature with and without approval.
- Figentra Flow: `node:test` cases for the same rules.

## Constitution Check

| Law                       | Result | Note                                             |
| ------------------------- | ------ | ------------------------------------------------ |
| Boundaries (ADR 0003)     | PASS   | repo-checks imports only its own spec files      |
| Secrets (ADR 0173)        | PASS   | none                                             |
| Security                  | PASS   | money, permission and contract diffs gate harder |
| Not built yet (ADR 0227)  | PASS   | nothing new                                      |
| Test placement (ADR 0022) | PASS   | `__tests__/` beside each subject                 |
| Versions and catalogs     | PASS   | no dependency change                             |

## Deploy modes

| Mode       | Difference |
| ---------- | ---------- |
| saas       | none       |
| on-prem    | none       |
| air-gapped | none       |
