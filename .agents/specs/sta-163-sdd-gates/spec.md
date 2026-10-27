# Feature Specification: SDD gates and templates (spec-kit SDLC Phase 1)

**Feature Branch**: `figentra/sta-163-spec-kit-phase-1-sdd-gates-and-templates-dogfood-spec`

**Created**: 2026-10-20

**Status**: Done

**Linear**: STA-163

**Linear project**: Spec-kit SDLC

**Clarifications status**: complete

**Analyze**: — <!-- /speckit.analyze not run: the analyze wrap that records this line is Phase 2 scope -->

**Input**: User description: "Phase 1 of the spec-kit SDLC plan (§13), as a dogfood full-lane spec: preset sources moved to .agents/speckit plus speckit-sync; template v2 (Impact, Amendments, Status history, the OR12 state machine Draft→Clarified→Planned→Tasked→Implementing→Done); spec-gate v2 (check, tasks, lane, branch, bug rules); spec-trace (trace, drift) for FR→task→test→PR traceability; validate wiring and fixtures. The dogfood spec must pass every stage gate in CI."

## Impact

- **Apps touched**: `apps/docs` (the `apps/docs/src/docs/agents/spec-lifecycle.mdx` page only)
- **Services touched**: none
- **Packages touched**: none (root tooling in `tools/scripts`, `.agents/speckit`, `.specify`, `.github/workflows/ci.yml`, `lefthook.yml`)
- **Public contract change**: additive: new `spec-gate` subcommands (`check`, `tasks`, `lane`, `branch`), the `spec-trace` script, `pnpm speckit:sync|spec:gate|spec:trace`; the spec states Ready and Verified are renamed Tasked and Done (OR12)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: CI gate logic (`spec-gate`, `spec-trace`) and CI env; no permissions change, no new token
- **Secrets**: none
- **ADR needed**: no (implements ADR 0120 enforcement and owner decision OR12; ADR 0120's "Planned" enforcement note becomes true)
- **New dependencies**: none (the scripts are dependency-free)
- **Deploy modes**: same in all three (developer and CI tooling only)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `apps/docs/src/docs/agents/spec-lifecycle.mdx`
- **Lane**: full (agent guards and CI gate scripts are R3 paths)
- **Change risk**: R3 (ADR 0120: CI gate and agent-guard scripts)

## Glossary

- **Installed copy**: what `specify` writes into `.specify/presets/stackra` from the source in `.agents/speckit`.
- **Live ID**: an FR, SC, EC, P or task id that no amendment has struck.

## User Scenarios & Testing

### User Story 1 - Specs move through gated states (Priority: P1)

The lead moves a spec Draft → Clarified → Planned → Tasked → Implementing → Done; each status is refused while its
artifacts are missing.

**Independent Test**: the sta-901 fixture passes at every status; breaking one artifact yields one precise message.

**Acceptance Scenarios**:

1. **Given** a spec at Planned whose plan has a TODO constitution row, **When** CI runs, **Then** it names the row.
2. **Given** a tasks.md where an FR has no task, **When** `spec-gate tasks` runs, **Then** it names the FR.

### User Story 2 - Traceability from requirement to test (Priority: P1)

A reviewer sees which tasks and tests cover each FR, and a Done spec cannot merge with an untested FR.

**Independent Test**: `spec-trace trace` on this folder lists every FR with its tasks and tests.

### User Story 3 - One source for the preset (Priority: P2)

Templates and wraps are edited in `.agents/speckit` only; a hand edit to the installed copy turns CI red.

**Independent Test**: edit `.specify/presets/stackra/preset.yml`; the tripwire names the file.

### Edge Cases

- **EC-01**: A struck FR or task (amendment) is excluded from coverage and from the Done rule.
- **EC-02**: A draft PR may carry a Draft spec; marking it ready requires Tasked.

## Requirements

- **FR-001**: WHEN `pnpm speckit:sync` runs THE tooling SHALL install the preset from `.agents/speckit/presets`, keep the bundled workflow disabled and render both integrations, AND the tripwire SHALL fail when the installed copy differs from the source.
- **FR-002**: THE spec, plan and tasks templates SHALL carry the v2 header, Impact v2, Amendments, Status history, the OR12 state machine, the constitution table and the `covers:`/`route:`/`deps:` task line.
- **FR-003**: WHEN a spec declares a status THE gate SHALL refuse it unless that status's artifact rules hold (Draft, Clarified, Planned, Tasked, Implementing, Done; Abandoned and Superseded skip).
- **FR-004**: WHEN `spec-gate tasks` runs THE gate SHALL report duplicate ids, missing or unknown `covers:`, missing or unknown `route:`, unknown or cyclic `deps:`, uncovered FRs and `[P]` tasks sharing a path in one phase, each with its line or ID.
- **FR-005**: WHEN `spec-gate ci` runs THE gate SHALL fail feat commits that reach no spec, a bug folder without a `@covers sta-n:BUG` test, and the PR's own changed spec (the branch key's folder) below Tasked on a ready-for-review PR. The branch name is `linear check-pr`'s rule (it honours `chore-lane`); `spec-gate branch` only warns.
- **FR-006**: WHEN a spec is Done THE trace SHALL require every live FR and P to be covered by a `@covers` test (an FR through a tested P) and every SC to name its verification method.
- **FR-007**: WHEN a spec is Implementing or Done THE drift check SHALL fail members changed but not named in Impact, ticked tasks whose paths do not exist and, at Done, Impact docs the diff does not touch.
- **FR-008**: THE `pnpm validate` script SHALL run `spec-gate ci` and `spec-trace ci`, and CI SHALL pass the ready-for-review state and the branch name to them.

## Success Criteria

- **SC-001**: This spec passes every stage gate in CI on its own PR — verified by: e2e (the Quality Gate run)
- **SC-002**: Every broken-fixture case fails with a message naming the offending ID, line or path — verified by: unit

## Out of scope

- The `stackra` and `stackra-linear` extensions, `spec-run`, the analyze and converge wraps' attestation lines (Phase 2).
- Commit-to-task trace warnings and the PR-level "owned member" advisory (Phase 2).
- Moving the notifications spec to the v2 Impact lines (it needs the owner's H1).

## Assumptions

- Existing Draft specs keep their v1 header comments; the gate reads only `**Status**`, so they stay valid.

## Amendments

None.

## Status history

- 2026-10-20 · — → Draft · Claude (lead) · created from the plan §13 Phase 1 brief
- 2026-10-20 · Draft → Clarified · Claude (lead) · scope fixed by the coordinator's brief; OR12 states
- 2026-10-20 · Clarified → Planned · Claude (lead)
- 2026-10-20 · Planned → Tasked · Claude (lead)
- 2026-10-20 · Tasked → Implementing · Claude (lead)
- 2026-10-20 · Implementing → Done · Claude (lead) · bootstrap exception: the gates cannot gate their own design PR, so design and implementation ship in one PR
