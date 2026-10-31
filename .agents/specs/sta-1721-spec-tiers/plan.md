# Plan: spec tiers (trivial, small, feature, big)

**Spec**: `.agents/specs/sta-1721-spec-tiers/spec.md`

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
5. **Vellum**: `gate.mjs` gains the same pure functions and checks; its assets are re-copied from core's template.

## Properties

- **P-001**: A spec's tier is its `**Tier**` header, and a branch with no spec is trivial — Validates: FR-1
- **P-002**: The computed tier is the highest any changed path forces, and a lower declared tier is one problem naming the reasons — Validates: FR-2
- **P-003**: A small spec reaches Planned and Tasked through `## Plan` and `## Tasks` in spec.md, with no plan.md or tasks.md — Validates: FR-3
- **P-004**: A feature spec is refused at Tasked without its Planned approval; a big spec at Planned without its Clarified approval and at Tasked without its Planned approval — Validates: FR-4, FR-5
- **P-005**: A feature or big spec past Clarified without `**Approver**` is a problem — Validates: FR-6
- **P-006**: The speckit skills ask for approval with the question tool and loop on Revise — Validates: FR-7
- **P-007**: The plan-gate hook allows a write on a branch with no spec folder — Validates: FR-8
- **P-008**: Vellum's gate returns the same problems as core's checks on the same inputs — Validates: FR-9

## Tests

- repo-checks: each new function and the small-tier and approval paths of `specCheckStage`, plus `specFindings`
  over a diff that adds a migration under a small spec.
- hook: the plan-gate test gains trivial (no folder), small, and feature with and without approval.
- Vellum: `node:test` cases for the same rules.

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
