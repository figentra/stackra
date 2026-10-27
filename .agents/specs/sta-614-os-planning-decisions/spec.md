# Feature Specification: No code without an answered questionnaire and a plan (the plan gate)

**Feature Branch**: `figentra/sta-614-os-planning-decisions`

**Created**: 2026-10-25

**Status**: Implementing

**Linear**: STA-614

**Linear project**: none

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: Owner decision (chat, 2026-10-25, `ai-chain-plan.md` "Owner answers", Enforcement): "no development
without an answered questionnaire and a plan, in every repository, by ADR plus a local hook that refuses code edits
unless the branch's spec has every question answered and a plan written. Depth scales with size (bug 5-10, feature
~20, module/service the full questionnaire). Production hotfix may go first with owner approval; its questionnaire
follows right after."

## Questionnaire (the owner's enforcement answers)

| #   | Question                                                  | Answer (owner, 2026-10-25)                                                                                                                        |
| --- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Does the rule apply to every change, or only to features? | Every change: bug, feature, module, service                                                                                                       |
| 2   | In which repositories?                                    | Every repository                                                                                                                                  |
| 3   | How deep is the questionnaire?                            | Scales with size: bug 5-10 questions, feature about 20, module or service the full questionnaire                                                  |
| 4   | May a question take its default?                          | Yes, but every question is answered before the plan (from the owner's default rule, `notes/handover/os/default-applied.md`; not asked separately) |
| 5   | How is it enforced?                                       | An ADR plus a local hook that refuses code edits until the branch's spec is answered and a plan is written                                        |
| 6   | Is there an exception?                                    | A production hotfix may go first with the owner's approval; its questionnaire follows right after                                                 |

## Impact

- **Apps touched**: `apps/docs` (ADRs 0353 to 0362, Notes on 0021, 0099, 0100, 0120, 0155, 0171, 0172, 0185, 0186, 0203, 0205, 0206, 0211, 0212, 0218, 0235, 0242, 0280, 0307, 0308 and 0352, `src/adr/index.mdx` and `src/docs.json`)
- **Services touched**: none
- **Packages touched**: none
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: yes, ADR 0362 (Accepted, owner decision 2026-10-25)
- **New dependencies**: none
- **Deploy modes**: none (local agent tooling only)
- **Licence tier**: not distributed
- **Docs to update**: `.agents/hooks/README.md`, ADRs 0353 to 0362, the 21 amended ADRs above, `apps/docs/src/docs/adr/index.mdx`, `apps/docs/src/docs.json`
- **Lane**: lite (recorded reason: one hook rule plus its tests, decided by the owner in chat)
- **Change risk**: R3 (agent guards)

## User Scenarios & Testing

### User Story 1 - An agent cannot write code before the plan (Priority: P1)

An agent on `figentra/sta-<n>-<slug>` tries to write `packages/**`, `services/**`, `workers/**`, `apps/**` or
`tools/**` before the spec folder has an answered spec and a plan, and the write is refused with a reason that says
what to write first.

**Independent Test**: `.agents/hooks/__tests__/plan-gate.test.mjs` builds spec folders in a temporary root and asserts
each decision.

**Acceptance Scenarios**:

1. **Given** no `.agents/specs/sta-<n>-*` folder, **When** an agent writes `packages/x/src/a.ts`, **Then** it is
   refused.
2. **Given** a spec with every question answered and a plan.md, **When** an agent writes the same path, **Then** it is
   allowed.
3. **Given** any branch, **When** an agent writes `apps/docs/**`, `.agents/specs/**` or a root file, **Then** it is
   allowed.

### User Story 2 - The owner lets a hotfix go first (Priority: P2)

**Independent Test**: the same test file asserts the hotfix marker and the write rule on it.

**Acceptance Scenarios**:

1. **Given** a spec folder holding the owner's filled `hotfix.md`, **When** an agent writes source, **Then** it is
   allowed without spec or plan.
2. **Given** any spec folder, **When** an agent writes `hotfix.md`, **Then** it is refused.

### Edge Cases

- **EC-01**: A file outside any git checkout is not gated.
- **EC-02**: Two spec folders for one key, or a branch with no key (`main`), refuse a source write.

## Requirements

- **FR-001**: THE hook SHALL refuse a Write, Edit, MultiEdit or NotebookEdit to a source path unless the branch key has
  exactly one `.agents/specs/sta-<n>-*` folder.
- **FR-002**: THE hook SHALL refuse it unless that folder's spec.md passes spec-gate's `checkSpec` and a non-empty
  plan.md exists.
- **FR-003**: THE hook SHALL allow a source write when the folder holds a `hotfix.md` with filled `Approved by`,
  `Approved on` and `Reason` lines, and SHALL refuse an agent's write to `hotfix.md`.
- **FR-004**: THE hook SHALL not gate paths outside `PLAN_GATED`, nor files outside a git checkout.

## Success Criteria

- **SC-001**: `pnpm test:hooks` passes with `plan-gate.test.mjs` — verified by: test run (not run in this change)

## Out of scope

- The OpenCode guard (`.opencode/plugins/guard`) calling the gate.
- The bug and feature question sets (5-10 and about 20 questions); the bug lane path (ADR 0362, Open questions).
- Installing the hook in other repositories.

## Assumptions

- Claude Code passes absolute `file_path` values to Write and Edit, and runs the hook with `node` from the repository.

## Status history

- 2026-10-25 · — → Draft · Claude (builder) · from the owner's enforcement answers of 2026-10-25 (lite lane)
- 2026-10-25 · Draft → Clarified · Claude (builder) · questionnaire answered by the owner in chat
- 2026-10-25 · Clarified → Planned · Claude (builder)
- 2026-10-25 · Planned → Tasked · Claude (builder)
- 2026-10-25 · Tasked → Implementing · Claude (builder)
