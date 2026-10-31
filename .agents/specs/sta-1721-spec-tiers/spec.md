# Feature Specification: spec tiers (trivial, small, feature, big)

**Feature Branch**: `figentra/sta-1721-spec-tiers`

**Created**: 2026-10-31

**Status**: Planned — Approved by owner 2026-10-31

**Tier**: big

**Approver**: owner (process and governance); technical plan stops under the owner's delegation to the leader

**Linear**: STA-1721

**Clarifications status**: complete

**Input**: The owner approved ("goooo", relayed by the leader on 2026-10-31) four spec sizes recorded as a `Tier:` header,
auto-classification from the diff in the lane check, approval stops recorded in the spec's Status, and who approves.
Build it in core's spec checks (STA-1669's repo-checks and the CLI) and in Vellum, with an ADR.

## Impact

- **Apps touched**: apps/docs (the ADR, the spec-flow guide)
- **Services touched**: none
- **Packages touched**: packages/developer/repo-checks, packages/developer/cli (through `specFindings`); Vellum's
  `packages/vellum` (figentra/vellum)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: yes: ADR 0502, spec tiers and approval stops (amends ADR 0120 lanes and ADR 0362's plan gate)
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Licence tier**: free
- **Docs to update**: the ADR, the spec template, the plan-gate hook README, the repo-checks README
- **Lane**: full
- **Change risk**: R2 (every repository's lane check and the plan-gate hook change behaviour)

## Requirements

- **FR-1** A spec declares `**Tier**: trivial | small | feature | big`. Trivial work has no spec: a commit message and
  a Linear issue.
- **FR-2** The lane check computes a minimum tier from the diff: a migration, a public contract (`src/contracts/`,
  `stackra.manifest.json`, `openapi.json`), a permission (`*.permissions.ts`, `access/`), payment or money code
  (`packages/commerce/`, paths naming payment, money, ledger, billing, payout or refund) or a new app or Worker member
  forces at least feature; a new service or package forces big. A declared tier lower than the computed one fails; a
  branch with no spec declares trivial.
- **FR-3** Small: a lite spec, 5 to 10 answered questions, its plan and tasks in the same file (`## Plan`,
  `## Tasks`); no plan.md or tasks.md, no owner stop.
- **FR-4** Feature: full spec, plan, then tasks; one approval stop after spec plus plan. Big: full questionnaire, ADR,
  spec, plan, tasks; stops after the spec and after the plan.
- **FR-5** An approval is recorded in the Status as `Approved by <who> <date>` on the stage it approves (the
  `**Status**` line, then its `## Status history` line). The gate checks it: a feature spec needs the Planned approval
  before Tasked; a big spec needs the Clarified approval before Planned and the Planned approval before Tasked. The
  plan-gate hook checks the same before code.
- **FR-6** `**Approver**:` records who approves: the owner for product, money, legal, security, brand and pricing; the
  leader for technical-only stops under the owner's delegation. Feature and big specs must carry it.
- **FR-7** The agent asks for an approval with the question tool: Approve, Revise with notes, Reject; Revise loops.
- **FR-8** Trivial work is never blocked: the plan-gate hook lets a branch with no spec folder write code.
- **FR-9** Vellum's `gate` carries the same rules.

## Status history

- 2026-10-31: Draft → Clarified — Approved by owner 2026-10-31 (the rules as relayed by the leader)
- 2026-10-31: Clarified → Planned — Approved by owner 2026-10-31 (build approved with the rules: "goooo")
