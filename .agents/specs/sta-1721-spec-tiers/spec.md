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
- **FR-10** Kiro depth (the owner, 2026-10-31): EARS acceptance criteria with ids in spec.md; plan.md is the design
  with its required sections; each task names the criteria and files it covers; the small tier keeps a short form of
  the same sections in spec.md.

## Acceptance criteria

- **AC-001**: WHEN a branch with no spec folder changes only paths that raise no floor THE lane check SHALL pass it as trivial
- **AC-002**: WHEN a diff adds a migration, a contract, a permission, money code or a new app or Worker THE lane check SHALL refuse a declared tier below feature, naming the paths
- **AC-003**: WHEN a diff adds a service or a package THE lane check SHALL refuse a declared tier below big
- **AC-004**: IF a feature spec reaches Tasked without "Approved by <who> <date>" on its Planned stage THEN THE stage gate SHALL refuse it
- **AC-005**: IF a big spec reaches Planned without its Clarified approval, or Tasked without its Planned approval, THEN THE stage gate SHALL refuse it
- **AC-006**: WHEN a tiered spec is past Draft THE stage gate SHALL require EARS acceptance criteria with AC ids
- **AC-007**: WHEN a feature or big spec is Planned THE stage gate SHALL require plan.md's design sections (architecture overview to rollout)
- **AC-008**: WHEN a feature or big spec is Tasked THE stage gate SHALL require each task to cover an AC id and name a file, and every AC to be covered
- **AC-009**: WHILE a spec is small THE stage gate SHALL read a short design and the tasks from spec.md instead of plan.md and tasks.md
- **AC-010**: WHERE a repository runs Vellum THE vellum gate SHALL apply the same rules

## Status history

- 2026-10-31: Draft → Clarified — Approved by owner 2026-10-31 (the rules as relayed by the leader)
- 2026-10-31: Clarified → Planned — Approved by owner 2026-10-31 (build approved with the rules: "goooo")
